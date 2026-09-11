from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CarViewSet,
    FavoriteViewSet,
    ReviewViewSet,
    RegisterView,
    ProfileView,
    CarImageUploadView,
)

router = DefaultRouter()
router.register(r"cars", CarViewSet)
router.register(r"favorites", FavoriteViewSet, basename="favorites")
router.register(r"reviews", ReviewViewSet, basename="reviews")

urlpatterns = [
    path("", include(router.urls)),
    # auth
    path("auth/register/", RegisterView.as_view(), name="register"),
    # profile
    path("profile/", ProfileView.as_view(), name="profile"),
    # images
    path("cars/<int:pk>/images/", CarImageUploadView.as_view(), name="car-images"),
    path(
        "cars/<int:pk>/images/<int:image_id>/",
        CarImageUploadView.as_view(),
        name="car-image-detail",
    ),
]
