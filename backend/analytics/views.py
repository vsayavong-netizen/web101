from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum
from django.utils import timezone

from .models import AnalyticsMetric


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analytics_dashboard(request):
    """Get analytics dashboard data."""
    
    return Response({
        'message': 'Analytics dashboard endpoint',
        'status': 'success'
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def analytics_statistics(request):
    """Get analytics statistics."""
    
    return Response({
        'message': 'Analytics statistics endpoint',
        'status': 'success'
    })

