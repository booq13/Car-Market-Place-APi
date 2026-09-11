from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Car(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="cars",
        null=True,
        blank=True,
    )
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mileage = models.IntegerField()
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    is_vip = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.brand} {self.model} {self.year}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, default="")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_premium = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username


class CarImage(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="car_images/")
    is_main = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.car.id}"


class Review(models.Model):
    reviewer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="given_reviews"
    )
    seller = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_reviews"
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("reviewer", "seller")

    def __str__(self):
        return f"{self.reviewer} -> {self.seller} ({self.rating})"


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="favorited_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "car")

    def __str__(self):
        return f"{self.user} ❤️ {self.car}"


class Subscription(models.Model):
    PLAN_CHOICES = [
        ("free", "Free"),
        ("premium", "Premium"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="subscriptions"
    )

    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    expires_at = models.DateTimeField(null=True, blank=True)

    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan}"
