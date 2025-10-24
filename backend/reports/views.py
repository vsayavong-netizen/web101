from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from core.permissions import require_roles


@api_view(['GET'])
@require_roles('Admin')
def generate_report(request):
    """Generate a report."""
    
    return Response({
        'message': 'Report generation endpoint',
        'status': 'success'
    })


@api_view(['GET'])
@require_roles('Admin')
def report_list(request):
    """List available reports."""
    
    return Response({
        'message': 'Report list endpoint',
        'status': 'success',
        'reports': []
    })

