"""
ASGI config for final_project_management project.
Supports both development and production modes.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from core.middleware.websocket_auth import JWTAuthMiddlewareStack
from final_project_management.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')

django_asgi_app = get_asgi_application()

# Check if production mode (use environment variable or settings)
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
USE_PRODUCTION_MIDDLEWARE = os.environ.get('USE_PRODUCTION_WEBSOCKET_MIDDLEWARE', 'False').lower() == 'true'

# Build WebSocket middleware stack
if USE_PRODUCTION_MIDDLEWARE or not DEBUG:
    # Production: Include rate limiting and monitoring
    try:
        from core.middleware.websocket_rate_limit import WebSocketRateLimitMiddlewareStack
        from core.middleware.websocket_monitoring import WebSocketMonitoringMiddlewareStack
        
        websocket_stack = AllowedHostsOriginValidator(
            WebSocketRateLimitMiddlewareStack(  # Rate limiting
                WebSocketMonitoringMiddlewareStack(  # Monitoring
                    JWTAuthMiddlewareStack(  # Authentication
                        URLRouter(websocket_urlpatterns)
                    )
                )
            )
        )
    except ImportError:
        # Fallback if middleware not available
        websocket_stack = AllowedHostsOriginValidator(
            JWTAuthMiddlewareStack(
                URLRouter(websocket_urlpatterns)
            )
        )
else:
    # Development: Basic stack without rate limiting/monitoring
    websocket_stack = AllowedHostsOriginValidator(
        JWTAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    )

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": websocket_stack,
})
