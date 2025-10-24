from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Count, Q
from django.contrib.auth import get_user_model

from .models import Major, MajorSpecialization, MajorRequirement
from .serializers import (
    MajorSerializer, MajorListSerializer, MajorCreateUpdateSerializer,
    MajorSpecializationSerializer, MajorRequirementSerializer,
    MajorStatisticsSerializer
)

User = get_user_model()


class MajorListView(generics.ListCreateAPIView):
    """List and create majors."""
    
    queryset = Major.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'abbreviation', 'description']
    ordering_fields = ['name', 'abbreviation', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return MajorListSerializer
        return MajorCreateUpdateSerializer
    
    def get_queryset(self):
        """Filter active majors by default."""
        queryset = super().get_queryset()
        active_only = self.request.query_params.get('active_only', 'true').lower() == 'true'
        
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        return queryset


class MajorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a major."""
    
    queryset = Major.objects.all()
    serializer_class = MajorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MajorCreateUpdateSerializer
        return MajorSerializer


class MajorSpecializationListView(generics.ListCreateAPIView):
    """List and create major specializations."""
    
    serializer_class = MajorSpecializationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['major', 'name']
    
    def get_queryset(self):
        """Filter by major if specified."""
        queryset = MajorSpecialization.objects.all()
        major_id = self.request.query_params.get('major_id')
        
        if major_id:
            queryset = queryset.filter(major_id=major_id)
        
        return queryset


class MajorRequirementListView(generics.ListCreateAPIView):
    """List and create major requirements."""
    
    serializer_class = MajorRequirementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['requirement_type', 'requirement_value', 'description']
    ordering_fields = ['requirement_type', 'created_at']
    ordering = ['major', 'requirement_type']
    
    def get_queryset(self):
        """Filter by major if specified."""
        queryset = MajorRequirement.objects.all()
        major_id = self.request.query_params.get('major_id')
        
        if major_id:
            queryset = queryset.filter(major_id=major_id)
        
        return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def major_statistics(request):
    """Get major statistics."""
    
    # Basic counts
    total_majors = Major.objects.count()
    active_majors = Major.objects.filter(is_active=True).count()
    
    # Student counts by major
    students_by_major = {}
    majors_by_degree_level = {}
    
    for major in Major.objects.all():
        # Count students in this major
        student_count = User.objects.filter(
            role='Student',
            student__major=major
        ).count() if hasattr(major, 'students') else 0
        
        students_by_major[major.name] = student_count
        
        # Count by degree level
        degree_level = major.degree_level
        majors_by_degree_level[degree_level] = majors_by_degree_level.get(degree_level, 0) + 1
    
    total_students = sum(students_by_major.values())
    
    statistics = {
        'total_majors': total_majors,
        'active_majors': active_majors,
        'total_students': total_students,
        'students_by_major': students_by_major,
        'majors_by_degree_level': majors_by_degree_level
    }
    
    serializer = MajorStatisticsSerializer(statistics)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def major_bulk_update(request):
    """Bulk update majors."""
    
    major_ids = request.data.get('major_ids', [])
    update_data = request.data.get('update_data', {})
    
    if not major_ids:
        return Response(
            {'error': 'major_ids is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate update data
    allowed_fields = ['is_active', 'degree_level']
    for field in update_data.keys():
        if field not in allowed_fields:
            return Response(
                {'error': f'Field {field} is not allowed for bulk update'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Update majors
    updated_count = Major.objects.filter(id__in=major_ids).update(**update_data)
    
    return Response({
        'message': f'Successfully updated {updated_count} majors',
        'updated_count': updated_count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def major_dropdown(request):
    """Get majors for dropdown selection."""
    
    queryset = Major.objects.filter(is_active=True).order_by('name')
    serializer = MajorListSerializer(queryset, many=True)
    
    return Response(serializer.data)