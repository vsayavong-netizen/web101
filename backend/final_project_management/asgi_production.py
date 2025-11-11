"""
Production ASGI config with rate limiting and monitoring
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from core.middleware.websocket_auth import JWTAuthMiddlewareStack
from core.middleware.websocket_rate_limit import WebSocketRateLimitMiddlewareStack
from core.middleware.websocket_monitoring import WebSocketMonitoringMiddlewareStack
from final_project_management.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')

django_asgi_app = get_asgi_application()

# Production ASGI application with all middleware layers
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        WebSocketRateLimitMiddlewareStack(  # Rate limiting first
            WebSocketMonitoringMiddlewareStack(  # Monitoring
                JWTAuthMiddlewareStack(  # Authentication
                    URLRouter(websocket_urlpatterns)
                )
            )
        )
    ),
})

