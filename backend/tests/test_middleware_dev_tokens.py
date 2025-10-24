import json
from django.test import TestCase, override_settings
from django.urls import path
from django.http import JsonResponse
from django.conf import settings
from django.test import Client


def dummy_view(request):
    return JsonResponse({"ok": True})


urlpatterns = [
    path("/protected/", dummy_view),
]


class DevTokenMiddlewareTest(TestCase):
    @override_settings(
        ROOT_URLCONF=__name__,
        MIDDLEWARE=[
            'final_project_management.middleware.AuthenticationMiddleware',
        ],
        DEBUG=True,
        ALLOW_DEV_TOKENS=False,
    )
    def test_dev_token_allowed_in_debug(self):
        client = Client()
        response = client.get("/protected/", HTTP_AUTHORIZATION="Bearer mock-token")
        self.assertNotEqual(response.status_code, 401)

    @override_settings(
        ROOT_URLCONF=__name__,
        MIDDLEWARE=[
            'final_project_management.middleware.AuthenticationMiddleware',
        ],
        DEBUG=False,
        ALLOW_DEV_TOKENS=True,
    )
    def test_dev_token_allowed_when_flag_true(self):
        client = Client()
        response = client.get("/protected/", HTTP_AUTHORIZATION="Bearer authToken")
        self.assertNotEqual(response.status_code, 401)

    @override_settings(
        ROOT_URLCONF=__name__,
        MIDDLEWARE=[
            'final_project_management.middleware.AuthenticationMiddleware',
        ],
        DEBUG=False,
        ALLOW_DEV_TOKENS=False,
    )
    def test_dev_token_rejected_in_production(self):
        client = Client()
        response = client.get("/protected/", HTTP_AUTHORIZATION="Bearer mock-token")
        self.assertEqual(response.status_code, 401)


