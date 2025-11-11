"""
Views for settings app including Academic Year management
"""
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime, timedelta
from core.permissions import require_roles, IsAdminOrReadOnly
from .models import AcademicYear, SystemSettings
from .serializers import (
    AcademicYearSerializer, 
    AcademicYearListSerializer,
    SystemSettingsSerializer
)


class AcademicYearViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Academic Years.
    Admin can create, update, delete.
    All authenticated users can view.
    """
    queryset = AcademicYear.objects.all()  # No foreign keys to optimize
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'year']
    search_fields = ['year', 'description']
    ordering_fields = ['year', 'start_date', 'created_at']
    ordering = ['-year']
    
    def get_serializer_class(self):
        """Use list serializer for list action."""
        if self.action == 'list':
            return AcademicYearListSerializer
        return AcademicYearSerializer
    
    def get_queryset(self):
        """Filter queryset based on user permissions."""
        queryset = super().get_queryset()
        
        # Non-admin users can only see active years
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current active academic year."""
        current_year = AcademicYear.objects.filter(is_active=True).first()
        
        if not current_year:
            # Return the latest year if no active year is set
            current_year = AcademicYear.objects.order_by('-year').first()
        
        if current_year:
            serializer = self.get_serializer(current_year)
            return Response(serializer.data)
        
        # Return empty response instead of 404 to allow frontend to handle gracefully
        # Frontend will fallback to localStorage or default year
        return Response({
            'year': None,
            'message': 'No academic year found. Please create one in admin panel.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available academic years (for dropdown)."""
        years = self.get_queryset()
        serializer = AcademicYearListSerializer(years, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate an academic year (deactivates others)."""
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        academic_year = self.get_object()
        
        # Deactivate all other years
        AcademicYear.objects.exclude(pk=academic_year.pk).update(is_active=False)
        
        # Activate this year
        academic_year.is_active = True
        academic_year.save()
        
        serializer = self.get_serializer(academic_year)
        return Response({
            'message': f'Academic year {academic_year.year} activated',
            'data': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def create_next_year(self, request):
        """Create next academic year based on current year."""
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get current active year or latest year
        current_year = AcademicYear.objects.filter(is_active=True).first()
        if not current_year:
            current_year = AcademicYear.objects.order_by('-year').first()
        
        if not current_year:
            return Response({
                'error': 'No existing academic year found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract year number from current year
        current_year_str = current_year.year
        if '-' in current_year_str:
            # Format: "2024-2025"
            next_year_start = int(current_year_str.split('-')[1])
        else:
            # Format: "2024"
            next_year_start = int(current_year_str) + 1
        
        next_year_end = next_year_start + 1
        next_year_str = f"{next_year_start}-{next_year_end}"
        
        # Check if next year already exists
        if AcademicYear.objects.filter(year=next_year_str).exists():
            return Response({
                'error': f'Academic year {next_year_str} already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate dates (typically August to July)
        start_date = datetime(next_year_start, 8, 1).date()
        end_date = datetime(next_year_end, 7, 31).date()
        
        # Create new academic year
        new_year = AcademicYear.objects.create(
            year=next_year_str,
            start_date=start_date,
            end_date=end_date,
            is_active=False,  # Don't activate automatically
            description=f'Academic year {next_year_str}'
        )
        
        serializer = self.get_serializer(new_year)
        return Response({
            'message': f'Academic year {next_year_str} created successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)


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


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def security_audit_timestamp(request, academic_year: str = None):
    """Get or update security audit timestamp for an academic year."""
    if not academic_year:
        # Try to get from query params or current year
        academic_year = request.GET.get('academic_year') or request.data.get('academic_year')
        if not academic_year:
            # Get current active academic year
            current_year = AcademicYear.objects.filter(is_active=True).first()
            if current_year:
                academic_year = current_year.year
            else:
                return Response({'error': 'Academic year is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    setting_name = f'last_security_audit_{academic_year}'
    
    if request.method == 'GET':
        try:
            setting = SystemSettings.objects.get(setting_name=setting_name, is_active=True)
            return Response({
                'academic_year': academic_year,
                'timestamp': setting.setting_value,
                'updated_at': setting.updated_at
            })
        except SystemSettings.DoesNotExist:
            return Response({
                'academic_year': academic_year,
                'timestamp': None,
                'updated_at': None
            })
    
    elif request.method == 'POST':
        # Only Admin or DepartmentAdmin can update
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        timestamp = request.data.get('timestamp')
        if not timestamp:
            timestamp = str(int(timezone.now().timestamp() * 1000))  # Current timestamp in milliseconds
        
        setting, created = SystemSettings.objects.update_or_create(
            setting_name=setting_name,
            defaults={
                'setting_value': timestamp,
                'setting_type': 'timestamp',
                'description': f'Last automated security audit timestamp for academic year {academic_year}',
                'is_active': True
            }
        )
        
        return Response({
            'academic_year': academic_year,
            'timestamp': setting.setting_value,
            'updated_at': setting.updated_at,
            'created': created
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def app_settings(request, setting_type: str, academic_year: str = None):
    """
    Generic endpoint for managing application settings.
    
    Supported setting types:
    - milestone_templates
    - announcements
    - defense_settings
    - scoring_settings
    
    GET: Retrieve settings
    POST/PUT: Update or create settings
    DELETE: Delete settings
    """
    import json
    
    # Validate setting type
    valid_types = ['milestone_templates', 'announcements', 'defense_settings', 'scoring_settings']
    if setting_type not in valid_types:
        return Response({
            'error': f'Invalid setting type. Must be one of: {", ".join(valid_types)}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get or determine academic year
    if not academic_year:
        academic_year = request.GET.get('academic_year') or request.data.get('academic_year')
        if not academic_year:
            # Get current active academic year
            current_year = AcademicYear.objects.filter(is_active=True).first()
            if current_year:
                academic_year = current_year.year
            else:
                return Response({'error': 'Academic year is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    setting_name = f'{setting_type}_{academic_year}'
    
    if request.method == 'GET':
        try:
            setting = SystemSettings.objects.get(setting_name=setting_name, is_active=True)
            try:
                # Parse JSON value
                value = json.loads(setting.setting_value)
            except (json.JSONDecodeError, TypeError):
                # If not valid JSON, return as string
                value = setting.setting_value
            
            return Response({
                'setting_type': setting_type,
                'academic_year': academic_year,
                'value': value,
                'updated_at': setting.updated_at
            })
        except SystemSettings.DoesNotExist:
            return Response({
                'setting_type': setting_type,
                'academic_year': academic_year,
                'value': None,
                'updated_at': None
            })
    
    elif request.method in ['POST', 'PUT']:
        # Only Admin or DepartmentAdmin can update
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get value from request
        value = request.data.get('value')
        if value is None:
            return Response({'error': 'Value is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Convert to JSON string
        try:
            if isinstance(value, (dict, list)):
                setting_value = json.dumps(value, ensure_ascii=False)
            else:
                setting_value = str(value)
        except (TypeError, ValueError) as e:
            return Response({'error': f'Invalid value format: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Determine setting type for description
        type_descriptions = {
            'milestone_templates': 'Milestone templates',
            'announcements': 'Announcements',
            'defense_settings': 'Defense settings',
            'scoring_settings': 'Scoring settings'
        }
        
        setting, created = SystemSettings.objects.update_or_create(
            setting_name=setting_name,
            defaults={
                'setting_value': setting_value,
                'setting_type': 'json',
                'description': f'{type_descriptions.get(setting_type, setting_type)} for academic year {academic_year}',
                'is_active': True
            }
        )
        
        # Parse value for response
        try:
            response_value = json.loads(setting.setting_value)
        except (json.JSONDecodeError, TypeError):
            response_value = setting.setting_value
        
        return Response({
            'setting_type': setting_type,
            'academic_year': academic_year,
            'value': response_value,
            'updated_at': setting.updated_at,
            'created': created
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    elif request.method == 'DELETE':
        # Only Admin or DepartmentAdmin can delete
        if not request.user.is_staff and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            setting = SystemSettings.objects.get(setting_name=setting_name, is_active=True)
            setting.is_active = False
            setting.save()
            return Response({
                'message': f'{setting_type} for academic year {academic_year} deleted successfully'
            }, status=status.HTTP_200_OK)
        except SystemSettings.DoesNotExist:
            return Response({
                'error': 'Setting not found'
            }, status=status.HTTP_404_NOT_FOUND)

