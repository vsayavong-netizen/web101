from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def committee_list(request):
    """List committees."""
    
    return Response({
        'message': 'Committee list endpoint',
        'status': 'success',
        'committees': []
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def create_committee(request):
    """Create a committee."""
    
    return Response({
        'message': 'Committee created successfully',
        'status': 'success'
    })
