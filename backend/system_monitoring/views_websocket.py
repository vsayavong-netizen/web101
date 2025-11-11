"""
WebSocket monitoring API views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .websocket_metrics import WebSocketMetrics
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def websocket_metrics(request):
    """
    Get WebSocket metrics summary
    Admin only endpoint
    """
    try:
        metrics = WebSocketMetrics.get_metrics_summary()
        return Response(metrics, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting WebSocket metrics: {e}")
        return Response(
            {"error": "Failed to get WebSocket metrics"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def websocket_active_connections(request):
    """
    Get current active WebSocket connections count
    Admin only endpoint
    """
    try:
        count = WebSocketMetrics.get_active_connections()
        return Response({"active_connections": count}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error getting active connections: {e}")
        return Response(
            {"error": "Failed to get active connections"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

