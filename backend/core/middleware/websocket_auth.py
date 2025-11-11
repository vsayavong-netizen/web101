"""
JWT Authentication Middleware for WebSocket connections
"""
from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_string):
    """Get user from JWT token"""
    try:
        # Validate token using UntypedToken (uses SIMPLE_JWT settings)
        UntypedToken(token_string)
        
        # Decode token - use SIGNING_KEY from SIMPLE_JWT settings
        from rest_framework_simplejwt.settings import api_settings
        signing_key = api_settings.SIGNING_KEY or settings.SECRET_KEY
        
        decoded_data = jwt_decode(
            token_string,
            signing_key,
            algorithms=[api_settings.ALGORITHM]
        )
        
        # Get user
        user_id = decoded_data.get(api_settings.USER_ID_CLAIM)
        if user_id:
            try:
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                return AnonymousUser()
        
        return AnonymousUser()
    except (InvalidToken, TokenError, Exception) as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"WebSocket token validation failed: {str(e)}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens.
    Token can be passed via:
    1. Query parameter: ?token=...
    2. Subprotocol header (if needed)
    """
    
    async def __call__(self, scope, receive, send):
        # Only process WebSocket connections
        if scope["type"] != "websocket":
            return await super().__call__(scope, receive, send)
        
        # Extract token from query string
        query_string = scope.get("query_string", b"").decode()
        query_params = parse_qs(query_string)
        token = query_params.get("token", [None])[0]
        
        # If no token in query, try to get from headers (subprotocol)
        if not token:
            headers = dict(scope.get("headers", []))
            # Check for Authorization header
            auth_header = headers.get(b"authorization", b"").decode()
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        # Authenticate user
        if token:
            user = await get_user_from_token(token)
            scope["user"] = user
            # Debug logging
            import logging
            logger = logging.getLogger(__name__)
            logger.debug(f"WebSocket auth: token={bool(token)}, user={user.username if hasattr(user, 'username') else 'Anonymous'}, authenticated={user.is_authenticated if hasattr(user, 'is_authenticated') else False}")
        else:
            scope["user"] = AnonymousUser()
        
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """Stack JWT auth middleware with other middleware"""
    return JWTAuthMiddleware(inner)

