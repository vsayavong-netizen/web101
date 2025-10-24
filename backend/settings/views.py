from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from core.permissions import require_roles


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def system_settings(request):
    """Get system settings."""
    
    return Response({
        'message': 'System settings endpoint',
        'status': 'success'
    })


@api_view(['POST'])
@require_roles('Admin')
def update_settings(request):
    """Update system settings."""
    
    return Response({
        'message': 'Settings updated successfully',
        'status': 'success'
    })

