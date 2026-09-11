from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from .models import Car, UserProfile


class AuthTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_user_registration(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "testuser",
                "email": "testuser@example.com",
                "password": "testpass123",
                "password2": "testpass123",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="testuser").exists())

    def test_user_login(self):
        User.objects.create_user(
            username="testuser", email="testuser@example.com", password="testpass123"
        )

        response = self.client.post(
            "/api/auth/login/", {"username": "testuser", "password": "testpass123"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)


class CarTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser", email="testuser@example.com", password="testpass123"
        )
        self.profile, _ = UserProfile.objects.get_or_create(user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_create_car(self):
        response = self.client.post(
            "/api/cars/",
            {
                "brand": "BMW",
                "model": "M4",
                "year": 2020,
                "price": "120000.00",
                "mileage": 10000,
                "description": "fast car",
                "is_active": True,
                "is_vip": False,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Car.objects.count(), 1)

    def test_free_plan_limit(self):
        Car.objects.create(
            owner=self.user,
            brand="BMW",
            model="Model1",
            year=2020,
            price="10000.00",
            mileage=1000,
            description="test",
            is_active=True,
            is_vip=False,
        )

        response = self.client.post(
            "/api/cars/",
            {
                "brand": "Audi",
                "model": "A6",
                "year": 2021,
                "price": "20000.00",
                "mileage": 5000,
                "description": "extra car",
                "is_active": True,
                "is_vip": False,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Free plan allows only 1 active listing", response.data["detail"])

    def test_premium_plan_bypass_limit(self):
        self.profile.is_premium = True
        self.profile.save()

        Car.objects.create(
            owner=self.user,
            brand="BMW",
            model="Model1",
            year=2020,
            price="10000.00",
            mileage=1000,
            description="test",
            is_active=True,
            is_vip=False,
        )

        response = self.client.post(
            "/api/cars/",
            {
                "brand": "Audi",
                "model": "A6",
                "year": 2021,
                "price": "20000.00",
                "mileage": 5000,
                "description": "extra car",
                "is_active": True,
                "is_vip": False,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Car.objects.filter(owner=self.user).count(), 2)

    def test_car_belongs_to_user(self):
        car = Car.objects.create(
            owner=self.user,
            brand="Toyota",
            model="Camry",
            year=2016,
            price="14000.00",
            mileage=200000,
            description="ok",
            is_active=True,
            is_vip=False,
        )

        self.assertEqual(car.owner, self.user)
