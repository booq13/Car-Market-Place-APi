from rest_framework import serializers
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from .models import Car, UserProfile, CarImage, Favorite, Review


class CarSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")
    owner_id = serializers.ReadOnlyField()

    class Meta:
        model = Car
        fields = [
            "id",
            "owner",
            "owner_id",
            "brand",
            "model",
            "year",
            "price",
            "mileage",
            "description",
            "is_active",
            "is_vip",
        ]

    def validate_is_vip(self, value):
        if not value:
            return False
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Authentication required for VIP listings."
            )
        profile = UserProfile.objects.filter(user=request.user).first()
        if not profile or not profile.is_premium:
            raise serializers.ValidationError(
                "Only Premium users can mark listings as VIP."
            )
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    avg_rating = serializers.FloatField(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "username",
            "email",
            "phone",
            "city",
            "avatar",
            "is_premium",
            "avg_rating",
        ]
        read_only_fields = ["is_premium"]


class CarImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(write_only=True, required=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = CarImage
        fields = ["id", "image", "image_url", "is_main"]

    @extend_schema_field(serializers.URLField())
    def get_image_url(self, obj):
        request = self.context.get("request")
        if request is None:
            return obj.image.url if obj.image else None
        return request.build_absolute_uri(obj.image.url) if obj.image else None


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ["id", "car", "created_at"]
        read_only_fields = ["created_at"]

    def validate_car(self, value):
        user = self.context["request"].user
        if Favorite.objects.filter(user=user, car=value).exists():
            raise serializers.ValidationError("This car is already in favorites.")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = serializers.ReadOnlyField(source="reviewer.username")

    class Meta:
        model = Review
        fields = ["id", "reviewer", "seller", "rating", "comment", "created_at"]
        read_only_fields = ["reviewer", "created_at"]

    def validate_seller(self, value):
        request = self.context.get("request")
        if request and value == request.user:
            raise serializers.ValidationError("You cannot review yourself.")
        return value

    def validate(self, data):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return data

        seller = data.get("seller")
        if seller is None and self.instance:
            seller = self.instance.seller

        if seller:
            duplicates = Review.objects.filter(reviewer=request.user, seller=seller)
            if self.instance:
                duplicates = duplicates.exclude(pk=self.instance.pk)
            if duplicates.exists():
                raise serializers.ValidationError("You already reviewed this seller.")
        return data
