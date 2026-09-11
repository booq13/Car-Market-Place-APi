from .models import Car, UserProfile

FREE_ACTIVE_LISTING_LIMIT = 1


def user_is_premium(user):
    profile = UserProfile.objects.filter(user=user).first()
    return bool(profile and profile.is_premium)


def count_active_listings(user):
    return Car.objects.filter(owner=user, is_active=True).count()


def free_listing_limit_reached(user):
    if user_is_premium(user):
        return False
    return count_active_listings(user) >= FREE_ACTIVE_LISTING_LIMIT
