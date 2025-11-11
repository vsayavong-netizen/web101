"""
Test-specific ASGI config that bypasses AllowedHostsOriginValidator
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from core.middleware.websocket_auth import JWTAuthMiddlewareStack
from final_project_management.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_settings')

django_asgi_app = get_asgi_application()

# Test application without AllowedHostsOriginValidator for easier testing
test_application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})

