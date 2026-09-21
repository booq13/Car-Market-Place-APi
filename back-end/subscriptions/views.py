import stripe
from django.conf import settings
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import serializers
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, inline_serializer


from listings.models import Subscription, UserProfile
from listings.utils import (
    count_active_listings,
    user_is_premium,
    FREE_ACTIVE_LISTING_LIMIT,
)

from .services import (
    activate_premium,
    deactivate_premium,
    get_user_from_checkout_session,
    stripe_get,
    stripe_period_end_to_datetime,
    sync_subscription_from_stripe,
)

stripe.api_key = settings.STRIPE_SECRET_KEY


class EmptySerializer(serializers.Serializer):
    pass


class SubscriptionStatusView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmptySerializer

    @extend_schema(
        summary="Get subscription status",
        description="Retrieves the current subscription plan (free or premium), expiry date, current active listings count, and the maximum allowed active listings.",
        responses={
            200: inline_serializer(
                name="SubscriptionStatusResponse",
                fields={
                    "plan": serializers.CharField(),
                    "status": serializers.CharField(),
                    "expires_at": serializers.DateTimeField(allow_null=True),
                    "is_premium": serializers.BooleanField(),
                    "active_listings_count": serializers.IntegerField(),
                    "max_active_listings": serializers.IntegerField(allow_null=True),
                },
            )
        },
    )
    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        subscription = Subscription.objects.filter(user=user).order_by("-pk").first()
        is_premium = user_is_premium(user)
        active_count = count_active_listings(user)

        if is_premium:
            plan = "premium"
            max_listings = None
        else:
            plan = subscription.plan if subscription else "free"
            max_listings = FREE_ACTIVE_LISTING_LIMIT

        return Response(
            {
                "plan": plan,
                "status": subscription.status if subscription else "active",
                "expires_at": subscription.expires_at if subscription else None,
                "is_premium": is_premium,
                "active_listings_count": active_count,
                "max_active_listings": max_listings,
            }
        )


class CreateCheckoutView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmptySerializer

    @extend_schema(
        summary="Create Stripe checkout session",
        description="Creates a Stripe Checkout Session for subscription upgrading (Premium plan) and returns the checkout URL to redirect the user to.",
        responses={
            200: inline_serializer(
                name="CheckoutResponse", fields={"checkout_url": serializers.URLField()}
            )
        },
    )
    def post(self, request):
        if not settings.STRIPE_SECRET_KEY:
            return Response(
                {"error": "Stripe secret key is not configured."}, status=503
            )

        if not settings.STRIPE_PRICE_ID:
            return Response(
                {"error": "STRIPE_PRICE_ID is not configured in .env"},
                status=503,
            )

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="subscription",
                line_items=[{"price": settings.STRIPE_PRICE_ID, "quantity": 1}],
                success_url=settings.CHECKOUT_SUCCESS_URL,
                cancel_url=settings.CHECKOUT_CANCEL_URL,
                metadata={"user_id": str(request.user.id)},
                client_reference_id=str(request.user.id),
                subscription_data={
                    "metadata": {"user_id": str(request.user.id)},
                },
            )
        except stripe.error.StripeError as exc:
            return Response({"error": str(exc)}, status=400)

        return Response({"checkout_url": session.url})


class BuySubscriptionDemoView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EmptySerializer

    @extend_schema(
        summary="Buy premium subscription (Demo/Mock)",
        description="Directly activates premium subscription for the logged-in user to bypass Stripe for testing and demonstration purposes.",
        responses={
            200: inline_serializer(
                name="BuySubscriptionDemoResponse",
                fields={
                    "detail": serializers.CharField(),
                    "plan": serializers.CharField(),
                    "is_premium": serializers.BooleanField(),
                },
            )
        },
    )
    def post(self, request):
        user = request.user
        activate_premium(user, stripe_subscription_id="demo_sub_12345")
        return Response(
            {
                "detail": "Subscription successfully activated via demo endpoint!",
                "plan": "premium",
                "is_premium": True,
            }
        )


@csrf_exempt
def stripe_webhook(request):
    if request.method != "POST":
        return HttpResponse(status=405)

    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

    if not settings.STRIPE_WEBHOOK_SECRET:
        return HttpResponse("Webhook secret not configured", status=503)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse("Invalid payload", status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse("Invalid signature", status=400)

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        user = get_user_from_checkout_session(data_object)
        if user:
            stripe_subscription_id = stripe_get(data_object, "subscription")
            expires_at = None
            if stripe_subscription_id:
                stripe_sub = stripe.Subscription.retrieve(stripe_subscription_id)
                expires_at = stripe_period_end_to_datetime(
                    stripe_get(stripe_sub, "current_period_end")
                )
            activate_premium(user, stripe_subscription_id, expires_at)

    elif event_type in (
        "customer.subscription.updated",
        "customer.subscription.created",
    ):
        sync_subscription_from_stripe(stripe_get(data_object, "id"))

    elif event_type == "customer.subscription.deleted":
        metadata = stripe_get(data_object, "metadata") or {}
        user_id = stripe_get(metadata, "user_id")
        user = None
        if user_id:
            try:
                user = User.objects.get(pk=int(user_id))
            except (User.DoesNotExist, ValueError, TypeError):
                user = None

        if user is None:
            sub = Subscription.objects.filter(
                stripe_subscription_id=stripe_get(data_object, "id")
            ).first()
            if sub:
                user = sub.user

        if user:
            deactivate_premium(user)

    return HttpResponse(status=200)


@require_GET
def payment_success(request):
    session_id = request.GET.get("session_id")
    payment_status = None
    premium_activated = False

    if session_id and settings.STRIPE_SECRET_KEY:
        try:
            session = stripe.checkout.Session.retrieve(session_id)
            payment_status = stripe_get(session, "payment_status")
            if payment_status == "paid":
                user = get_user_from_checkout_session(session)
                if user:
                    sub_id = stripe_get(session, "subscription")
                    expires_at = None
                    if sub_id:
                        stripe_sub = stripe.Subscription.retrieve(sub_id)
                        expires_at = stripe_period_end_to_datetime(
                            stripe_get(stripe_sub, "current_period_end")
                        )
                    activate_premium(user, sub_id, expires_at)
                    premium_activated = True
        except stripe.error.StripeError:
            payment_status = None

    if payment_status == "paid" and premium_activated:
        status_line = (
            '<p style="color:#0a0;font-weight:bold;">Stripe підтвердив оплату. Premium активовано.</p>'
            "<p>Перевір <code>GET /api/profile/</code> (поле <code>is_premium</code>).</p>"
        )
    elif payment_status == "paid":
        status_line = (
            '<p style="color:#0a0;font-weight:bold;">Stripe підтвердив оплату.</p>'
            "<p>Якщо <code>is_premium</code> ще false — перезапусти webhook і зроби checkout знову.</p>"
        )
    else:
        status_line = (
            "<p>Якщо щойно оплатив — зачекай кілька секунд і перевір профіль.</p>"
        )

    return_url = f"{settings.FRONTEND_URL}/subscription"
    html = f"""<!DOCTYPE html>
<html lang="uk">
<head><meta charset="utf-8"><title>Оплата успішна</title></head>
<body style="font-family:sans-serif;max-width:520px;margin:40px auto;padding:20px;">
  <h1>Оплата успішна</h1>
  {status_line}
  <p><small>session_id: {session_id or "—"}</small></p>
  <p><a href="{return_url}">Повернутися в додаток</a></p>
</body></html>"""
    return HttpResponse(html)


@require_GET
def payment_cancel(request):
    return_url = f"{settings.FRONTEND_URL}/subscription"
    html = f"""<!DOCTYPE html>
<html lang="uk">
<head><meta charset="utf-8"><title>Оплату скасовано</title></head>
<body style="font-family:sans-serif;max-width:520px;margin:40px auto;padding:20px;">
  <h1>Оплату скасовано</h1>
  <p>Ти повернувся з Stripe без оплати. Premium не активовано.</p>
  <p><a href="{return_url}">Повернутися в додаток</a></p>
</body></html>"""
    return HttpResponse(html)
