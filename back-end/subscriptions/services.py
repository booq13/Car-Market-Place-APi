from datetime import datetime, timezone as dt_timezone

import stripe
from django.conf import settings
from django.contrib.auth.models import User
from listings.models import Subscription, UserProfile

stripe.api_key = settings.STRIPE_SECRET_KEY


def stripe_get(obj, key, default=None):
    """Stripe objects (v8+) are not dicts — use getattr instead of .get()."""
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def stripe_period_end_to_datetime(timestamp):
    if not timestamp:
        return None
    return datetime.fromtimestamp(timestamp, tz=dt_timezone.utc)


def activate_premium(user, stripe_subscription_id=None, expires_at=None):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.is_premium = True
    profile.save(update_fields=["is_premium"])

    subscription = Subscription.objects.filter(user=user).order_by("-pk").first()
    if subscription is None:
        subscription = Subscription(user=user)
    subscription.plan = "premium"
    subscription.status = "active"
    subscription.stripe_subscription_id = stripe_subscription_id
    subscription.expires_at = expires_at
    subscription.save()
    return subscription


def deactivate_premium(user):
    profile = UserProfile.objects.filter(user=user).first()
    if profile:
        profile.is_premium = False
        profile.save(update_fields=["is_premium"])

    subscription = Subscription.objects.filter(user=user).order_by("-pk").first()
    if subscription:
        subscription.plan = "free"
        subscription.status = "cancelled"
        subscription.save(update_fields=["plan", "status"])


def get_user_from_checkout_session(session):
    metadata = stripe_get(session, "metadata") or {}
    user_id = stripe_get(metadata, "user_id") or stripe_get(
        session, "client_reference_id"
    )
    if not user_id:
        return None
    try:
        return User.objects.get(pk=int(user_id))
    except (User.DoesNotExist, ValueError, TypeError):
        return None


def sync_subscription_from_stripe(stripe_subscription_id):
    if not stripe_subscription_id:
        return None

    stripe_sub = stripe.Subscription.retrieve(stripe_subscription_id)
    metadata = stripe_get(stripe_sub, "metadata") or {}
    user_id = stripe_get(metadata, "user_id")
    if not user_id:
        return None

    try:
        user = User.objects.get(pk=int(user_id))
    except (User.DoesNotExist, ValueError, TypeError):
        return None

    expires_at = stripe_period_end_to_datetime(
        stripe_get(stripe_sub, "current_period_end")
    )
    status = stripe_get(stripe_sub, "status")

    if status in ("active", "trialing"):
        activate_premium(user, stripe_subscription_id, expires_at)
    else:
        deactivate_premium(user)
        sub = Subscription.objects.filter(user=user).first()
        if sub:
            sub.stripe_subscription_id = stripe_subscription_id
            sub.expires_at = expires_at
            sub.save(update_fields=["stripe_subscription_id", "expires_at"])

    return user
