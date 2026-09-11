from django.contrib import admin
from .models import Car, Review, Favorite, Subscription


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ("brand", "model", "year", "price", "mileage", "is_active", "is_vip")
    list_filter = ("brand", "is_active", "is_vip")
    search_fields = ("brand", "model")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("reviewer", "seller", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("reviewer__username", "seller__username")


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "car", "created_at")
    list_filter = ("created_at",)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "plan", "status", "expires_at", "stripe_subscription_id")
    list_filter = ("plan", "status")
