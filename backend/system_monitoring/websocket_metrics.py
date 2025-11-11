"""
WebSocket metrics and monitoring utilities
"""
from django.core.cache import cache
from django.utils import timezone
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class WebSocketMetrics:
    """WebSocket metrics collector and reporter"""
    
    @staticmethod
    def get_active_connections():
        """Get current number of active WebSocket connections"""
        return cache.get("ws_active_connections", 0)
    
    @staticmethod
    def get_connections_today():
        """Get total connections today"""
        today_key = f"ws_connections_today:{datetime.now().strftime('%Y-%m-%d')}"
        return cache.get(today_key, 0)
    
    @staticmethod
    def get_messages_sent():
        """Get total messages sent"""
        return cache.get("ws_messages_sent", 0)
    
    @staticmethod
    def get_messages_received():
        """Get total messages received"""
        return cache.get("ws_messages_received", 0)
    
    @staticmethod
    def get_average_connection_duration():
        """Get average connection duration in seconds"""
        durations = cache.get("ws_avg_connection_duration", [])
        if not durations:
            return 0
        return sum(durations) / len(durations)
    
    @staticmethod
    def get_messages_per_minute():
        """Get messages per minute"""
        current_minute = int(timezone.now().timestamp() / 60)
        minute_key = f"ws_messages_minute:{current_minute}"
        return cache.get(minute_key, 0)
    
    @staticmethod
    def get_metrics_summary():
        """Get comprehensive metrics summary"""
        return {
            "active_connections": WebSocketMetrics.get_active_connections(),
            "connections_today": WebSocketMetrics.get_connections_today(),
            "messages_sent": WebSocketMetrics.get_messages_sent(),
            "messages_received": WebSocketMetrics.get_messages_received(),
            "avg_connection_duration": round(WebSocketMetrics.get_average_connection_duration(), 2),
            "messages_per_minute": WebSocketMetrics.get_messages_per_minute(),
            "timestamp": timezone.now().isoformat(),
        }
    
    @staticmethod
    def reset_metrics():
        """Reset all metrics (use with caution)"""
        cache.delete("ws_active_connections")
        cache.delete("ws_messages_sent")
        cache.delete("ws_messages_received")
        cache.delete("ws_avg_connection_duration")
        
        # Delete daily counters
        today_key = f"ws_connections_today:{datetime.now().strftime('%Y-%m-%d')}"
        cache.delete(today_key)
        
        logger.info("WebSocket metrics reset")

