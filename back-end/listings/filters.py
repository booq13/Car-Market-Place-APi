from django_filters import rest_framework as filters
from .models import Car


class CarFilter(filters.FilterSet):
    price_min = filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="price", lookup_expr="lte")
    year_min = filters.NumberFilter(field_name="year", lookup_expr="gte")
    year_max = filters.NumberFilter(field_name="year", lookup_expr="lte")

    class Meta:
        model = Car
        fields = ["brand"]
