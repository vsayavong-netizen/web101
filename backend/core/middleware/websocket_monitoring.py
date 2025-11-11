"""
Monitoring middleware for WebSocket connections
"""
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.core.cache import cache
import logging
import time
from datetime import datetime

logger = logging.getLogger(__name__)


class WebSocketMonitoringMiddleware(BaseMiddleware):
    """
    Monitoring middleware for WebSocket connections.
    Tracks:
    - Connection metrics
    - Message metrics
    - Error metrics
    - Performance metrics
    """
    
    async def __call__(self, scope, receive, send):
        # Only process WebSocket connections
        if scope["type"] != "websocket":
            return await super().__call__(scope, receive, send)
        
        # Track connection
        connection_id = scope.get("path", "unknown")
        start_time = time.time()
        
        await self._track_connection(connection_id)
        
        # Wrap send to track messages
        original_send = send
        
        async def monitored_send(message):
            if message.get("type") == "websocket.send":
                await self._track_message_sent(connection_id)
            elif message.get("type") == "websocket.close":
                duration = time.time() - start_time
                await self._track_disconnection(connection_id, duration)
            
            return await original_send(message)
        
        # Wrap receive to track incoming messages
        original_receive = receive
        
        async def monitored_receive():
            message = await original_receive()
            if message.get("type") == "websocket.receive":
                await self._track_message_received(connection_id)
            return message
        
        return await super().__call__(scope, monitored_receive, monitored_send)
    
    @database_sync_to_async
    def _track_connection(self, connection_id):
        """Track new connection"""
        try:
            # Increment active connections counter
            cache_key = "ws_active_connections"
            current = cache.get(cache_key, 0)
            cache.set(cache_key, current + 1, 3600)
            
            # Track total connections today
            today_key = f"ws_connections_today:{datetime.now().strftime('%Y-%m-%d')}"
            today_count = cache.get(today_key, 0)
            cache.set(today_key, today_count + 1, 86400)  # 24 hours
            
            # Track connection timestamp
            timestamp_key = f"ws_connection_timestamp:{connection_id}"
            cache.set(timestamp_key, time.time(), 3600)
            
            logger.debug(f"WebSocket connection tracked: {connection_id}")
        except Exception as e:
            logger.error(f"Error tracking WebSocket connection: {e}")
    
    @database_sync_to_async
    def _track_disconnection(self, connection_id, duration):
        """Track disconnection"""
        try:
            # Decrement active connections
            cache_key = "ws_active_connections"
            current = cache.get(cache_key, 0)
            if current > 0:
                cache.set(cache_key, current - 1, 3600)
            
            # Track connection duration
            duration_key = "ws_avg_connection_duration"
            durations = cache.get(duration_key, [])
            durations.append(duration)
            # Keep only last 100 durations
            if len(durations) > 100:
                durations = durations[-100:]
            cache.set(duration_key, durations, 3600)
            
            logger.debug(f"WebSocket disconnection tracked: {connection_id}, duration: {duration:.2f}s")
        except Exception as e:
            logger.error(f"Error tracking WebSocket disconnection: {e}")
    
    @database_sync_to_async
    def _track_message_sent(self, connection_id):
        """Track message sent"""
        try:
            # Increment messages sent counter
            cache_key = "ws_messages_sent"
            current = cache.get(cache_key, 0)
            cache.set(cache_key, current + 1, 3600)
            
            # Track messages per minute
            minute_key = f"ws_messages_minute:{int(time.time() / 60)}"
            minute_count = cache.get(minute_key, 0)
            cache.set(minute_key, minute_count + 1, 120)  # 2 minutes TTL
        except Exception as e:
            logger.error(f"Error tracking message sent: {e}")
    
    @database_sync_to_async
    def _track_message_received(self, connection_id):
        """Track message received"""
        try:
            # Increment messages received counter
            cache_key = "ws_messages_received"
            current = cache.get(cache_key, 0)
            cache.set(cache_key, current + 1, 3600)
        except Exception as e:
            logger.error(f"Error tracking message received: {e}")


def WebSocketMonitoringMiddlewareStack(inner):
    """Stack monitoring middleware"""
    return WebSocketMonitoringMiddleware(inner)

