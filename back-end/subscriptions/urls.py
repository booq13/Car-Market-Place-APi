from django.urls import path

from .views import (
    CreateCheckoutView,
    SubscriptionStatusView,
    stripe_webhook,
    BuySubscriptionDemoView,
)

urlpatterns = [
    path("status/", SubscriptionStatusView.as_view(), name="subscription-status"),
    path("create-checkout/", CreateCheckoutView.as_view(), name="create-checkout"),
    path("webhook/", stripe_webhook, name="stripe-webhook"),
    path("buy/", BuySubscriptionDemoView.as_view(), name="buy-subscription-demo"),
]
