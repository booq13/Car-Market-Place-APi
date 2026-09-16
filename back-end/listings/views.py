from django.contrib.auth.models import User
from django.db.models import Avg

from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.filters import SearchFilter, OrderingFilter

from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Car, UserProfile, CarImage, Favorite, Review
from .utils import free_listing_limit_reached
from .serializers import (
    CarSerializer,
    RegisterSerializer,
    UserProfileSerializer,
    CarImageSerializer,
    FavoriteSerializer,
    ReviewSerializer,
)
from .permissions import IsOwnerOrReadOnly, IsReviewerOrReadOnly
from .filters import CarFilter


def get_profile_with_avg_rating(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return (
        UserProfile.objects.filter(pk=profile.pk)
        .annotate(avg_rating=Avg("user__received_reviews__rating"))
        .first()
    )


@extend_schema_view(
    list=extend_schema(
        summary="List car listings",
        description="Retrieves a list of all active car listings. Supports search, filtering, and ordering. VIP listings are prioritised at the top.",
    ),
    retrieve=extend_schema(
        summary="Get car listing details",
        description="Retrieves the full details of a specific car listing by its ID.",
    ),
    create=extend_schema(
        summary="Create a new car listing",
        description="Registers a new car listing. On the free plan, a user is limited to 1 active listing. To add more active listings, they must upgrade to Premium.",
    ),
    update=extend_schema(
        summary="Update a car listing",
        description="Performs a complete update of a car listing. Validates owner status and listing limits if the listing is being reactivated.",
    ),
    partial_update=extend_schema(
        summary="Partially update a car listing",
        description="Performs a partial update of a car listing. Validates owner status and listing limits if the listing is being reactivated.",
    ),
    destroy=extend_schema(
        summary="Delete a car listing",
        description="Deletes a car listing from the marketplace. Only the listing owner can delete it.",
    ),
)
class CarViewSet(viewsets.ModelViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CarFilter

    search_fields = ["brand", "model", "description"]
    ordering_fields = ["price", "year", "id"]

    def get_queryset(self):
        queryset = Car.objects.all()
        ordering = self.request.query_params.get("ordering")
        if ordering:
            return queryset.order_by("-is_vip", ordering)
        return queryset.order_by("-is_vip", "-id")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        is_active = request.data.get("is_active", True)
        if is_active in (True, "true", "True", "1", 1):
            if free_listing_limit_reached(request.user):
                return Response(
                    {
                        "detail": (
                            "Free plan allows only 1 active listing. "
                            "Deactivate an existing listing or upgrade to Premium."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        is_active = request.data.get("is_active")
        if is_active in (True, "true", "True", "1", 1) and not instance.is_active:
            if free_listing_limit_reached(request.user):
                return Response(
                    {
                        "detail": (
                            "Free plan allows only 1 active listing. "
                            "Deactivate an existing listing or upgrade to Premium."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().update(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


@extend_schema(
    summary="Register a new user",
    description="Creates a new user account with a unique username, email, and password.",
)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get user profile",
        description="Retrieves the authenticated user's profile details, including phone, city, avatar, premium status, and their average rating as a seller.",
        responses={200: UserProfileSerializer},
    )
    def get(self, request):
        profile = get_profile_with_avg_rating(request.user)
        serializer = UserProfileSerializer(profile, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        summary="Update user profile",
        description="Allows the authenticated user to update their profile information (phone, city, avatar).",
        request=UserProfileSerializer,
        responses={200: UserProfileSerializer},
    )
    def put(self, request):
        profile = get_profile_with_avg_rating(request.user)
        serializer = UserProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if serializer.is_valid():
            serializer.save()
            profile = get_profile_with_avg_rating(request.user)
            return Response(
                UserProfileSerializer(profile, context={"request": request}).data
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CarImageUploadView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(
        operation_id="car_image_upload",
        summary="Upload car image",
        description="Uploads a new image for a specific car. Only the car's owner can upload images.",
        request=CarImageSerializer,
        responses={201: CarImageSerializer},
    )
    def post(self, request, pk):
        try:
            car = Car.objects.get(pk=pk)
        except Car.DoesNotExist:
            return Response({"error": "Car not found"}, status=status.HTTP_404_NOT_FOUND)

        if car.owner != request.user:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = CarImageSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save(car=car)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        operation_id="car_image_list",
        summary="List car images",
        description="Retrieves a list of all images uploaded for a specific car.",
        responses={200: CarImageSerializer(many=True)},
    )
    def get(self, request, pk):
        try:
            car = Car.objects.get(pk=pk)
        except Car.DoesNotExist:
            return Response({"error": "Car not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CarImageSerializer(
            car.images.all(), many=True, context={"request": request}
        )
        return Response(serializer.data)

    @extend_schema(
        operation_id="car_image_delete",
        summary="Delete car image",
        description="Deletes a specific image of a car. Only the car's owner can delete its images.",
    )
    def delete(self, request, pk, image_id):
        try:
            car = Car.objects.get(pk=pk)
        except Car.DoesNotExist:
            return Response({"error": "Car not found"}, status=404)

        if car.owner != request.user:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        try:
            image = CarImage.objects.get(pk=image_id, car=car)
        except CarImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)

        if image.image:
            image.image.delete(save=False)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        summary="List user favorites",
        description="Retrieves all favorited car listings for the currently authenticated user.",
    ),
    create=extend_schema(
        summary="Add car to favorites",
        description="Adds a car to the currently authenticated user's favorites.",
    ),
    destroy=extend_schema(
        summary="Remove car from favorites",
        description="Removes a car from the currently authenticated user's favorites by the favorite entry ID.",
    ),
)
class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Favorite.objects.none()
        return Favorite.objects.filter(user=self.request.user).select_related("car")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema_view(
    list=extend_schema(
        summary="List reviews",
        description="Retrieves a list of all seller reviews. Can be filtered using the `seller` query parameter.",
    ),
    retrieve=extend_schema(
        summary="Get review details",
        description="Retrieves details of a specific seller review by its ID.",
    ),
    create=extend_schema(
        summary="Create a review",
        description="Creates a review (rating and optional comment) for a seller. Users cannot review themselves or review the same seller multiple times.",
    ),
    update=extend_schema(
        summary="Update a review",
        description="Performs a complete update of a review. Only the reviewer can update their review.",
    ),
    partial_update=extend_schema(
        summary="Partially update a review",
        description="Performs a partial update of a review. Only the reviewer can update their review.",
    ),
    destroy=extend_schema(
        summary="Delete a review",
        description="Deletes a review. Only the reviewer can delete their review.",
    ),
)
class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsReviewerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["seller"]

    def get_queryset(self):
        return Review.objects.select_related("reviewer", "seller").order_by(
            "-created_at"
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
