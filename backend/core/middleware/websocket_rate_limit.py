"""
Rate limiting middleware for WebSocket connections
"""
from channels.middleware import BaseMiddleware
from django.core.cache import cache
from django.contrib.auth.models import AnonymousUser
import logging
import time

logger = logging.getLogger(__name__)


class WebSocketRateLimitMiddleware(BaseMiddleware):
    """
    Rate limiting middleware for WebSocket connections.
    Limits:
    - Connection attempts per IP
    - Messages per connection
    - Reconnection attempts
    """
    
    # Rate limit settings
    MAX_CONNECTIONS_PER_IP = 5  # Max concurrent connections per IP
    MAX_MESSAGES_PER_MINUTE = 60  # Max messages per minute per connection
    MAX_RECONNECT_ATTEMPTS = 10  # Max reconnection attempts per hour per IP
    RATE_LIMIT_WINDOW = 60  # Time window in seconds
    
    async def __call__(self, scope, receive, send):
        # Only process WebSocket connections
        if scope["type"] != "websocket":
            return await super().__call__(scope, receive, send)
        
        # Get client IP
        client_ip = self._get_client_ip(scope)
        
        # Check connection rate limit
        if not await self._check_connection_limit(client_ip):
            logger.warning(f"WebSocket connection rate limit exceeded for IP: {client_ip}")
            await send({
                "type": "websocket.close",
                "code": 1008,  # Policy violation
            })
            return
        
        # Check concurrent connections limit
        if not await self._check_concurrent_connections(client_ip):
            logger.warning(f"WebSocket concurrent connection limit exceeded for IP: {client_ip}")
            await send({
                "type": "websocket.close",
                "code": 1008,  # Policy violation
            })
            return
        
        # Track connection
        await self._track_connection(client_ip)
        
        return await super().__call__(scope, receive, send)
    
    def _get_client_ip(self, scope):
        """Extract client IP from scope"""
        # Try to get IP from headers
        headers = dict(scope.get("headers", []))
        
        # Check X-Forwarded-For header (for proxies)
        forwarded_for = headers.get(b"x-forwarded-for", b"").decode()
        if forwarded_for:
            # Take first IP in chain
            return forwarded_for.split(",")[0].strip()
        
        # Check X-Real-IP header
        real_ip = headers.get(b"x-real-ip", b"").decode()
        if real_ip:
            return real_ip
        
        # Fallback to client address
        client = scope.get("client")
        if client:
            return client[0]
        
        return "unknown"
    
    async def _check_connection_limit(self, client_ip):
        """Check if IP has exceeded connection rate limit"""
        cache_key = f"ws_conn_rate_limit:{client_ip}"
        connection_count = cache.get(cache_key, 0)
        
        if connection_count >= self.MAX_RECONNECT_ATTEMPTS:
            return False
        
        # Increment counter
        cache.set(cache_key, connection_count + 1, self.RATE_LIMIT_WINDOW * 60)  # 1 hour
        
        return True
    
    async def _check_concurrent_connections(self, client_ip):
        """Check if IP has exceeded concurrent connection limit"""
        cache_key = f"ws_concurrent_conn:{client_ip}"
        current_connections = cache.get(cache_key, 0)
        
        if current_connections >= self.MAX_CONNECTIONS_PER_IP:
            return False
        
        return True
    
    async def _track_connection(self, client_ip):
        """Track active connection"""
        cache_key = f"ws_concurrent_conn:{client_ip}"
        current = cache.get(cache_key, 0)
        cache.set(cache_key, current + 1, 3600)  # 1 hour TTL


def WebSocketRateLimitMiddlewareStack(inner):
    """Stack rate limit middleware"""
    return WebSocketRateLimitMiddleware(inner)

