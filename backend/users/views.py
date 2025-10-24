"""
User management views
"""

from rest_framework import viewsets, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from students.models import Student
from advisors.models import Advisor
from majors.models import Major
from classrooms.models import Classroom
from core.permissions import (
    IsAdminOrReadOnly, CanManageStudents, CanManageAdvisors,
    IsDepartmentAdminOrAdmin, AcademicYearPermission
)
from .serializers import (
    StudentSerializer, StudentUpdateSerializer,
    AdvisorSerializer, AdvisorUpdateSerializer,
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    BulkStudentUpdateSerializer, BulkAdvisorUpdateSerializer,
    UserStatisticsSerializer, StudentStatisticsSerializer,
    AdvisorStatisticsSerializer
)


class StudentViewSet(viewsets.ModelViewSet):
    """
    Student management viewset
    """
    queryset = Student.objects.select_related('user', 'major', 'classroom')
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, CanManageStudents, AcademicYearPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'major', 'classroom', 'gender', 'academic_year']
    search_fields = ['student_id', 'name', 'surname', 'email']
    ordering_fields = ['student_id', 'name', 'surname', 'created_at']
    ordering = ['student_id']

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return StudentUpdateSerializer
        return StudentSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Department admins can only see students in their departments
        if user.is_department_admin():
            managed_majors = user.advisor_profile.get_managed_majors()
            queryset = queryset.filter(major__in=managed_majors)
        
        # Filter by academic year if specified
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        return queryset

    def perform_create(self, serializer):
        """Set academic year and user on creation"""
        academic_year = self.request.data.get('academic_year', self.request.user.academic_year)
        serializer.save(academic_year=academic_year)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve student"""
        student = self.get_object()
        student.status = 'Approved'
        student.save()
        
        return Response({
            'message': f'Student {student.student_id} approved successfully'
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject student"""
        student = self.get_object()
        student.status = 'Pending'
        student.save()
        
        return Response({
            'message': f'Student {student.student_id} status reset to pending'
        })

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update students"""
        serializer = BulkStudentUpdateSerializer(data=request.data)
        if serializer.is_valid():
            student_ids = serializer.validated_data['student_ids']
            updates = serializer.validated_data['updates']
            
            updated_count = Student.objects.filter(
                student_id__in=student_ids
            ).update(**updates)
            
            return Response({
                'message': f'{updated_count} students updated successfully'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Bulk delete students"""
        student_ids = request.data.get('student_ids', [])
        if not student_ids:
            return Response({
                'error': 'student_ids is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        deleted_count, _ = Student.objects.filter(
            student_id__in=student_ids
        ).delete()
        
        return Response({
            'message': f'{deleted_count} students deleted successfully'
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get student statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total_students': queryset.count(),
            'approved_students': queryset.filter(status='Approved').count(),
            'pending_students': queryset.filter(status='Pending').count(),
            'students_with_projects': queryset.filter(projectgroups__isnull=False).distinct().count(),
            'students_without_projects': queryset.filter(projectgroups__isnull=True).count(),
            'students_by_major': dict(queryset.values('major__name').annotate(count=Count('id')).values_list('major__name', 'count')),
            'students_by_gender': dict(queryset.values('gender').annotate(count=Count('id')).values_list('gender', 'count')),
            'students_by_classroom': dict(queryset.values('classroom__name').annotate(count=Count('id')).values_list('classroom__name', 'count')),
        }
        
        serializer = StudentStatisticsSerializer(stats)
        return Response(serializer.data)


class AdvisorViewSet(viewsets.ModelViewSet):
    """
    Advisor management viewset
    """
    queryset = Advisor.objects.select_related('user').prefetch_related('specialized_majors')
    serializer_class = AdvisorSerializer
    permission_classes = [IsAuthenticated, CanManageAdvisors, AcademicYearPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_department_admin', 'academic_year']
    search_fields = ['name', 'user__username', 'user__email']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return AdvisorUpdateSerializer
        return AdvisorSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Department admins can only see advisors in their departments
        if user.is_department_admin():
            managed_majors = user.advisor_profile.get_managed_majors()
            queryset = queryset.filter(specialized_majors__in=managed_majors).distinct()
        
        # Filter by academic year if specified
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        return queryset

    def perform_create(self, serializer):
        """Set academic year on creation"""
        academic_year = self.request.data.get('academic_year', self.request.user.academic_year)
        serializer.save(academic_year=academic_year)

    @action(detail=True, methods=['get'])
    def workload(self, request, pk=None):
        """Get advisor workload information"""
        advisor = self.get_object()
        workload = advisor.get_workload_summary()
        
        return Response(workload)

    @action(detail=True, methods=['post'])
    def set_department_admin(self, request, pk=None):
        """Set advisor as department admin"""
        advisor = self.get_object()
        advisor.is_department_admin = True
        advisor.save()
        
        return Response({
            'message': f'Advisor {advisor.name} set as department admin'
        })

    @action(detail=True, methods=['post'])
    def remove_department_admin(self, request, pk=None):
        """Remove department admin status"""
        advisor = self.get_object()
        advisor.is_department_admin = False
        advisor.save()
        
        return Response({
            'message': f'Advisor {advisor.name} removed from department admin'
        })

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update advisors"""
        serializer = BulkAdvisorUpdateSerializer(data=request.data)
        if serializer.is_valid():
            advisor_ids = serializer.validated_data['advisor_ids']
            updates = serializer.validated_data['updates']
            
            # Handle specialized_majors separately
            specialized_majors = updates.pop('specialized_majors', None)
            
            updated_count = Advisor.objects.filter(
                id__in=advisor_ids
            ).update(**updates)
            
            # Update specialized majors if provided
            if specialized_majors is not None:
                for advisor in Advisor.objects.filter(id__in=advisor_ids):
                    advisor.specialized_majors.set(specialized_majors)
            
            return Response({
                'message': f'{updated_count} advisors updated successfully'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Bulk delete advisors"""
        advisor_ids = request.data.get('advisor_ids', [])
        if not advisor_ids:
            return Response({
                'error': 'advisor_ids is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        deleted_count, _ = Advisor.objects.filter(
            id__in=advisor_ids
        ).delete()
        
        return Response({
            'message': f'{deleted_count} advisors deleted successfully'
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get advisor statistics"""
        queryset = self.get_queryset()
        
        # Calculate workload statistics
        advisors = list(queryset)
        overloaded_count = sum(1 for advisor in advisors if advisor.is_overloaded())
        
        stats = {
            'total_advisors': queryset.count(),
            'department_admins': queryset.filter(is_department_admin=True).count(),
            'regular_advisors': queryset.filter(is_department_admin=False).count(),
            'overloaded_advisors': overloaded_count,
            'advisors_by_workload': {
                'light': sum(1 for a in advisors if a.get_current_project_count() <= 2),
                'moderate': sum(1 for a in advisors if 3 <= a.get_current_project_count() <= 5),
                'heavy': sum(1 for a in advisors if a.get_current_project_count() > 5),
            },
            'committee_positions': {
                'main': sum(a.get_committee_count('main') for a in advisors),
                'second': sum(a.get_committee_count('second') for a in advisors),
                'third': sum(a.get_committee_count('third') for a in advisors),
            },
            'specialized_majors_distribution': dict(
                queryset.values('specialized_majors__name')
                .annotate(count=Count('id'))
                .values_list('specialized_majors__name', 'count')
            ),
        }
        
        serializer = AdvisorStatisticsSerializer(stats)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    """
    User management viewset
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly, AcademicYearPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'academic_year']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'email', 'date_joined', 'last_login']
    ordering = ['username']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Department admins can only see users in their departments
        if user.is_department_admin():
            managed_majors = user.advisor_profile.get_managed_majors()
            # Filter students by major, advisors by specialized majors
            student_users = User.objects.filter(
                student_profile__major__in=managed_majors
            ).values_list('id', flat=True)
            advisor_users = User.objects.filter(
                advisor_profile__specialized_majors__in=managed_majors
            ).values_list('id', flat=True)
            queryset = queryset.filter(
                Q(id__in=student_users) | Q(id__in=advisor_users) | Q(role='admin')
            )
        
        # Filter by academic year if specified
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        return queryset

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate user"""
        user = self.get_object()
        user.is_active = True
        user.save()
        
        return Response({
            'message': f'User {user.username} activated successfully'
        })

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate user"""
        user = self.get_object()
        user.is_active = False
        user.save()
        
        return Response({
            'message': f'User {user.username} deactivated successfully'
        })

    @action(detail=True, methods=['post'])
    def force_password_change(self, request, pk=None):
        """Force user to change password"""
        user = self.get_object()
        user.must_change_password = True
        user.save()
        
        return Response({
            'message': f'User {user.username} must change password on next login'
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get user statistics"""
        queryset = self.get_queryset()
        
        # Calculate recent registrations (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_registrations = queryset.filter(date_joined__gte=thirty_days_ago).count()
        
        stats = {
            'total_users': queryset.count(),
            'total_students': queryset.filter(role='student').count(),
            'total_advisors': queryset.filter(role='advisor').count(),
            'total_admins': queryset.filter(role='admin').count(),
            'active_users': queryset.filter(is_active=True).count(),
            'inactive_users': queryset.filter(is_active=False).count(),
            'users_by_role': dict(queryset.values('role').annotate(count=Count('id')).values_list('role', 'count')),
            'users_by_academic_year': dict(queryset.values('academic_year').annotate(count=Count('id')).values_list('academic_year', 'count')),
            'recent_registrations': recent_registrations,
            'users_requiring_password_change': queryset.filter(must_change_password=True).count(),
        }
        
        serializer = UserStatisticsSerializer(stats)
        return Response(serializer.data)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile view for current user
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
