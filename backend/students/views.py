from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Avg
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Student, StudentAcademicRecord, StudentSkill, StudentAchievement,
    StudentAttendance, StudentNote
)
from projects.models import ProjectGroup, ProjectStudent
from advisors.models import Advisor
from .serializers import (
    StudentSerializer, StudentCreateSerializer, StudentUpdateSerializer,
    StudentAcademicRecordSerializer, StudentSkillSerializer, StudentAchievementSerializer,
    StudentAttendanceSerializer, StudentNoteSerializer, StudentBulkUpdateSerializer,
    StudentSearchSerializer
)


class StudentListView(generics.ListCreateAPIView):
    """List and create students."""
    
    queryset = Student.objects.select_related('user').all()
    permission_classes = [permissions.AllowAny]  # Temporarily allow anonymous access for testing
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudentCreateSerializer
        return StudentSerializer
    
    def get_queryset(self):
        """Filter students based on user role and permissions."""
        user = self.request.user
        queryset = Student.objects.select_related('user').all()
        
        # If user is not authenticated, return all students (for testing)
        if not user.is_authenticated:
            return queryset
        
        # Students can only see themselves
        if hasattr(user, 'role') and user.role == 'Student':
            queryset = queryset.filter(user=user)
        
        # Advisors can see students in their projects
        elif hasattr(user, 'role') and user.role == 'Advisor':
            try:
                # Get advisor instance
                advisor = Advisor.objects.get(user=user)
                # Get all project groups where this advisor is the advisor
                project_groups = ProjectGroup.objects.filter(advisor_name__icontains=user.get_full_name() or user.username)
                # Get all students in these project groups
                project_students = ProjectStudent.objects.filter(project_group__in=project_groups)
                student_ids = [ps.student.id for ps in project_students]
                queryset = queryset.filter(id__in=student_ids)
            except Advisor.DoesNotExist:
                # If advisor doesn't exist, return empty queryset
                queryset = queryset.none()
        
        # Department admins can see students in their department
        elif hasattr(user, 'role') and user.role == 'DepartmentAdmin':
            try:
                # Get advisor instance (DepartmentAdmin is also an Advisor)
                advisor = Advisor.objects.get(user=user)
                # Filter students by advisor's specialized majors if available
                if hasattr(advisor, 'specialized_major_ids') and advisor.specialized_major_ids:
                    # If advisor has specialized majors, filter by those
                    queryset = queryset.filter(major_id__in=advisor.specialized_major_ids)
                # If no specialized majors, DepartmentAdmin can see all students
                # (This can be customized based on business requirements)
            except Advisor.DoesNotExist:
                # If advisor doesn't exist, return all students for DepartmentAdmin
                pass
        
        # Admins can see all students
        elif hasattr(user, 'role') and user.role == 'Admin':
            pass  # No filtering
        
        return queryset


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a student."""
    
    queryset = Student.objects.select_related('user').all()
    permission_classes = [permissions.AllowAny]  # Temporarily allow anonymous access for testing
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return StudentUpdateSerializer
        return StudentSerializer
    
    def get_object(self):
        """Get student by pk (id) or student_id."""
        pk = self.kwargs.get('pk')
        
        # Try to get by ID first
        try:
            pk_int = int(pk)
            return Student.objects.select_related('user').get(id=pk_int)
        except (ValueError, Student.DoesNotExist):
            # If not found by ID, try to get by student_id
            try:
                return Student.objects.select_related('user').get(student_id=pk)
            except Student.DoesNotExist:
                # Return 404
                from rest_framework.exceptions import NotFound
                raise NotFound(f"Student with id or student_id '{pk}' not found.")
    
    def get_queryset(self):
        """Filter based on user permissions."""
        user = self.request.user
        
        # If user is not authenticated, return all students (for testing)
        if not user.is_authenticated:
            return Student.objects.select_related('user').all()
        
        if hasattr(user, 'role') and user.role == 'Student':
            return Student.objects.select_related('user').filter(user=user)
        else:  # Admin, DepartmentAdmin, or Advisor
            return Student.objects.all()


class StudentAcademicRecordListView(generics.ListCreateAPIView):
    """List and create academic records for a student."""
    
    serializer_class = StudentAcademicRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get academic records for a specific student."""
        student_id = self.kwargs.get('student_id')
        return StudentAcademicRecord.objects.filter(student_id=student_id)
    
    def perform_create(self, serializer):
        """Create academic record."""
        student_id = self.kwargs.get('student_id')
        student = Student.objects.get(id=student_id)
        serializer.save(student=student)


class StudentSkillListView(generics.ListCreateAPIView):
    """List and create skills for a student."""
    
    serializer_class = StudentSkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get skills for a specific student."""
        student_id = self.kwargs.get('student_id')
        return StudentSkill.objects.filter(student_id=student_id)
    
    def perform_create(self, serializer):
        """Create student skill."""
        student_id = self.kwargs.get('student_id')
        student = Student.objects.get(id=student_id)
        serializer.save(student=student)


class StudentSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a student skill."""
    
    serializer_class = StudentSkillSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get specific student skill."""
        student_id = self.kwargs.get('student_id')
        return StudentSkill.objects.filter(student_id=student_id)


class StudentAchievementListView(generics.ListCreateAPIView):
    """List and create achievements for a student."""
    
    serializer_class = StudentAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get achievements for a specific student."""
        student_id = self.kwargs.get('student_id')
        return StudentAchievement.objects.filter(student_id=student_id)
    
    def perform_create(self, serializer):
        """Create student achievement."""
        student_id = self.kwargs.get('student_id')
        student = Student.objects.get(id=student_id)
        serializer.save(student=student)


class StudentAchievementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a student achievement."""
    
    serializer_class = StudentAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get specific student achievement."""
        student_id = self.kwargs.get('student_id')
        return StudentAchievement.objects.filter(student_id=student_id)


class StudentAttendanceListView(generics.ListCreateAPIView):
    """List and create attendance records for a student."""
    
    serializer_class = StudentAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get attendance records for a specific student."""
        student_id = self.kwargs.get('student_id')
        return StudentAttendance.objects.filter(student_id=student_id)
    
    def perform_create(self, serializer):
        """Create attendance record."""
        student_id = self.kwargs.get('student_id')
        student = Student.objects.get(id=student_id)
        serializer.save(student=student, recorded_by=self.request.user)


class StudentNoteListView(generics.ListCreateAPIView):
    """List and create notes for a student."""
    
    serializer_class = StudentNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get notes for a specific student."""
        student_id = self.kwargs.get('student_id')
        return StudentNote.objects.filter(student_id=student_id)
    
    def perform_create(self, serializer):
        """Create student note."""
        student_id = self.kwargs.get('student_id')
        student = Student.objects.get(id=student_id)
        serializer.save(student=student, created_by=self.request.user)


class StudentNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a student note."""
    
    serializer_class = StudentNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get specific student note."""
        student_id = self.kwargs.get('student_id')
        return StudentNote.objects.filter(student_id=student_id)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def student_statistics(request):
    """Get student statistics for dashboard."""
    user = request.user
    
    # Base queryset based on user role
    if user.role == 'Student':
        students = Student.objects.filter(user=user)
    else:
        students = Student.objects.all()
    
    # Calculate statistics
    total_students = students.count()
    active_students = students.filter(is_active=True).count()
    inactive_students = students.filter(is_active=False).count()
    
    # Academic year distribution
    academic_years = students.values_list('academic_year', flat=True).distinct()
    year_distribution = {}
    for year in academic_years:
        year_distribution[year] = students.filter(academic_year=year).count()
    
    # Major distribution
    majors = students.values_list('major', flat=True).distinct()
    major_distribution = {}
    for major in majors:
        major_distribution[major] = students.filter(major=major).count()
    
    # GPA statistics
    gpa_values = students.exclude(gpa__isnull=True).values_list('gpa', flat=True)
    if gpa_values:
        avg_gpa = sum(gpa_values) / len(gpa_values)
        max_gpa = max(gpa_values)
        min_gpa = min(gpa_values)
    else:
        avg_gpa = max_gpa = min_gpa = 0
    
    return Response({
        'total_students': total_students,
        'active_students': active_students,
        'inactive_students': inactive_students,
        'academic_year_distribution': year_distribution,
        'major_distribution': major_distribution,
        'gpa_statistics': {
            'average': round(avg_gpa, 2),
            'maximum': max_gpa,
            'minimum': min_gpa
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_update_students(request):
    """Bulk update student information."""
    serializer = StudentBulkUpdateSerializer(data=request.data)
    if serializer.is_valid():
        student_ids = serializer.validated_data['student_ids']
        updates = serializer.validated_data['updates']
        
        updated_count = 0
        for student_id in student_ids:
            try:
                student = Student.objects.get(id=student_id)
                for field, value in updates.items():
                    setattr(student, field, value)
                student.save()
                updated_count += 1
            except Student.DoesNotExist:
                continue
        
        return Response({
            'message': f'Updated {updated_count} students successfully.',
            'updated_count': updated_count
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.AllowAny])  # Temporarily allow anonymous access for testing
def bulk_delete_students(request):
    """Bulk delete students."""
    student_ids = request.data.get('student_ids', [])
    if not student_ids:
        return Response({
            'error': 'student_ids is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Support both student_id (string) and id (integer)
    deleted_count = 0
    try:
        # Try to filter by student_id first (string)
        students_by_id = Student.objects.filter(student_id__in=student_ids)
        if students_by_id.exists():
            deleted_count, _ = students_by_id.delete()
        else:
            # Try to filter by id (integer)
            try:
                ids = [int(sid) for sid in student_ids]
                deleted_count, _ = Student.objects.filter(id__in=ids).delete()
            except (ValueError, TypeError):
                pass
    except Exception as e:
        return Response({
            'error': f'Failed to delete students: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'message': f'{deleted_count} students deleted successfully',
        'deleted_count': deleted_count
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def student_search(request):
    """Search students by various criteria."""
    serializer = StudentSearchSerializer(data=request.GET)
    if serializer.is_valid():
        params = serializer.validated_data
        queryset = Student.objects.all()
        
        # Apply filters
        if params.get('query'):
            query = params['query']
            queryset = queryset.filter(
                Q(student_id__icontains=query) |
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query) |
                Q(user__email__icontains=query)
            )
        
        if params.get('major'):
            queryset = queryset.filter(major__icontains=params['major'])
        
        if params.get('classroom'):
            queryset = queryset.filter(classroom__icontains=params['classroom'])
        
        if params.get('academic_year'):
            queryset = queryset.filter(academic_year=params['academic_year'])
        
        if params.get('is_active') is not None:
            queryset = queryset.filter(is_active=params['is_active'])
        
        if params.get('gpa_min') is not None:
            queryset = queryset.filter(gpa__gte=params['gpa_min'])
        
        if params.get('gpa_max') is not None:
            queryset = queryset.filter(gpa__lte=params['gpa_max'])
        
        # Serialize results
        serializer = StudentSerializer(queryset[:50], many=True)  # Limit to 50 results
        
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def student_progress(request, student_id):
    """Get detailed progress information for a student."""
    try:
        student = Student.objects.get(id=student_id)
        
        # Academic progress
        progress_percentage = student.progress_percentage
        remaining_credits = student.total_credits - student.completed_credits
        
        # Recent academic records
        recent_records = student.academic_records.all()[:5]
        academic_records = StudentAcademicRecordSerializer(recent_records, many=True).data
        
        # Skills summary
        skills = student.skills.all()
        skills_by_category = {}
        for skill in skills:
            category = skill.category
            if category not in skills_by_category:
                skills_by_category[category] = []
            skills_by_category[category].append({
                'name': skill.skill_name,
                'level': skill.proficiency_level,
                'verified': bool(skill.verified_by)
            })
        
        # Recent achievements
        recent_achievements = student.achievements.all()[:5]
        achievements = StudentAchievementSerializer(recent_achievements, many=True).data
        
        # Attendance summary
        attendance_records = student.attendance_records.all()
        total_days = attendance_records.count()
        present_days = attendance_records.filter(status='present').count()
        attendance_rate = (present_days / total_days * 100) if total_days > 0 else 0
        
        return Response({
            'student': StudentSerializer(student).data,
            'academic_progress': {
                'percentage': progress_percentage,
                'completed_credits': student.completed_credits,
                'total_credits': student.total_credits,
                'remaining_credits': remaining_credits
            },
            'academic_records': academic_records,
            'skills_by_category': skills_by_category,
            'recent_achievements': achievements,
            'attendance': {
                'total_days': total_days,
                'present_days': present_days,
                'attendance_rate': round(attendance_rate, 2)
            }
        })
    
    except Student.DoesNotExist:
        return Response(
            {'error': 'Student not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for comprehensive student management."""
    
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['major', 'academic_year', 'is_active', 'gpa']
    search_fields = ['student_id', 'user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['student_id', 'gpa', 'enrollment_date', 'created_at']
    ordering = ['-created_at']
    pagination_class = PageNumberPagination
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'progress':
            return StudentProgressSerializer
        return StudentSerializer
    
    def get_queryset(self):
        """Filter students based on role and permissions."""
        user = self.request.user
        queryset = Student.objects.all()
        
        # Students can only see themselves
        if user.role == 'Student':
            queryset = queryset.filter(user=user)
        
        # Advisors can see their assigned students
        elif user.role == 'Advisor':
            # This would typically filter by advisor assignments
            # For now, show all students
            pass
        
        # Department admins and admins can see all students
        elif user.role in ['DepartmentAdmin', 'Admin']:
            pass  # No filtering
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update students."""
        serializer = StudentBulkUpdateSerializer(data=request.data)
        if serializer.is_valid():
            student_ids = serializer.validated_data['student_ids']
            updates = serializer.validated_data['updates']
            
            # Update students
            updated_count = Student.objects.filter(id__in=student_ids).update(**updates)
            
            return Response({
                'message': f'Successfully updated {updated_count} students.',
                'updated_count': updated_count
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Bulk delete students."""
        student_ids = request.data.get('student_ids', [])
        if not student_ids:
            return Response({
                'error': 'student_ids is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Support both student_id (string) and id (integer)
        deleted_count = 0
        try:
            # Try to filter by student_id first (string)
            students_by_id = Student.objects.filter(student_id__in=student_ids)
            if students_by_id.exists():
                deleted_count, _ = students_by_id.delete()
            else:
                # Try to filter by id (integer)
                try:
                    ids = [int(sid) for sid in student_ids]
                    deleted_count, _ = Student.objects.filter(id__in=ids).delete()
                except (ValueError, TypeError):
                    pass
        except Exception as e:
            return Response({
                'error': f'Failed to delete students: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'message': f'{deleted_count} students deleted successfully',
            'deleted_count': deleted_count
        })
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search students with advanced filtering."""
        serializer = StudentSearchSerializer(data=request.query_params)
        if serializer.is_valid():
            query = serializer.validated_data.get('query', '')
            major = serializer.validated_data.get('major')
            academic_year = serializer.validated_data.get('academic_year')
            is_active = serializer.validated_data.get('is_active')
            gpa_min = serializer.validated_data.get('gpa_min')
            gpa_max = serializer.validated_data.get('gpa_max')
            
            queryset = self.get_queryset()
            
            if query:
                queryset = queryset.filter(
                    Q(student_id__icontains=query) |
                    Q(user__first_name__icontains=query) |
                    Q(user__last_name__icontains=query) |
                    Q(user__email__icontains=query)
                )
            
            if major:
                queryset = queryset.filter(major__name__icontains=major)
            
            if academic_year:
                queryset = queryset.filter(academic_year=academic_year)
            
            if is_active is not None:
                queryset = queryset.filter(is_active=is_active)
            
            if gpa_min is not None:
                queryset = queryset.filter(gpa__gte=gpa_min)
            
            if gpa_max is not None:
                queryset = queryset.filter(gpa__lte=gpa_max)
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = StudentSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = StudentSerializer(queryset, many=True)
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get student statistics."""
        queryset = self.get_queryset()
        
        total_students = queryset.count()
        active_students = queryset.filter(is_active=True).count()
        inactive_students = queryset.filter(is_active=False).count()
        
        # Students by major
        students_by_major = {}
        for student in queryset.select_related('major'):
            if student.major:
                major_name = student.major.name
                students_by_major[major_name] = students_by_major.get(major_name, 0) + 1
        
        # Students by academic year
        students_by_academic_year = {}
        for student in queryset:
            year = student.academic_year
            students_by_academic_year[year] = students_by_academic_year.get(year, 0) + 1
        
        # Average GPA
        average_gpa = queryset.aggregate(avg_gpa=Avg('gpa'))['avg_gpa'] or 0.0
        
        # GPA distribution
        gpa_distribution = {
            'excellent': queryset.filter(gpa__gte=3.5).count(),
            'good': queryset.filter(gpa__gte=3.0, gpa__lt=3.5).count(),
            'satisfactory': queryset.filter(gpa__gte=2.5, gpa__lt=3.0).count(),
            'needs_improvement': queryset.filter(gpa__lt=2.5).count()
        }
        
        # Recent enrollments (last 30 days)
        recent_enrollments = queryset.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=30)
        ).count()
        
        statistics = {
            'total_students': total_students,
            'active_students': active_students,
            'inactive_students': inactive_students,
            'students_by_major': students_by_major,
            'students_by_academic_year': students_by_academic_year,
            'average_gpa': round(average_gpa, 2),
            'gpa_distribution': gpa_distribution,
            'recent_enrollments': recent_enrollments
        }
        
        serializer = StudentStatisticsSerializer(statistics)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Get student progress information."""
        student = self.get_object()
        serializer = StudentProgressSerializer(student)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def academic_records(self, request, pk=None):
        """Get student academic records."""
        student = self.get_object()
        records = student.academic_records.all().order_by('-semester')
        serializer = StudentAcademicRecordSerializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def skills(self, request, pk=None):
        """Get student skills."""
        student = self.get_object()
        skills = student.skills.all().order_by('-proficiency_level')
        serializer = StudentSkillSerializer(skills, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def achievements(self, request, pk=None):
        """Get student achievements."""
        student = self.get_object()
        achievements = student.achievements.all().order_by('-date_earned')
        serializer = StudentAchievementSerializer(achievements, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """Get student attendance."""
        student = self.get_object()
        attendance = student.attendance.all().order_by('-date')
        serializer = StudentAttendanceSerializer(attendance, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        """Get student notes."""
        student = self.get_object()
        notes = student.notes.all().order_by('-created_at')
        serializer = StudentNoteSerializer(notes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate student account."""
        student = self.get_object()
        student.is_active = True
        student.save()
        return Response({'message': 'Student activated successfully.'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate student account."""
        student = self.get_object()
        student.is_active = False
        student.save()
        return Response({'message': 'Student deactivated successfully.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def student_dashboard(request, student_id):
    """Get student dashboard data."""
    try:
        student = Student.objects.get(id=student_id)
        
        # Check permissions
        if request.user.role not in ['Admin', 'DepartmentAdmin', 'Advisor'] and request.user.id != student.user.id:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get student progress
        progress_serializer = StudentProgressSerializer(student)
        
        # Get recent academic records
        recent_records = student.academic_records.all().order_by('-semester')[:5]
        academic_records = StudentAcademicRecordSerializer(recent_records, many=True)
        
        # Get recent achievements
        recent_achievements = student.achievements.all().order_by('-date_earned')[:5]
        achievements = StudentAchievementSerializer(recent_achievements, many=True)
        
        # Get attendance summary
        attendance_records = student.attendance.all()
        total_days = attendance_records.count()
        present_days = attendance_records.filter(status='Present').count()
        attendance_rate = (present_days / total_days * 100) if total_days > 0 else 0
        
        dashboard_data = {
            'student': StudentSerializer(student).data,
            'progress': progress_serializer.data,
            'recent_academic_records': academic_records.data,
            'recent_achievements': achievements.data,
            'attendance_summary': {
                'total_days': total_days,
                'present_days': present_days,
                'attendance_rate': round(attendance_rate, 2)
            },
            'quick_stats': {
                'total_skills': student.skills.count(),
                'total_achievements': student.achievements.count(),
                'current_gpa': student.gpa,
                'credits_completed': student.completed_credits
            }
        }
        
        return Response(dashboard_data)
    
    except Student.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def export_students(request):
    """Export students data."""
    # This would typically generate and return a file
    # For now, return a placeholder response
    return Response({
        'message': 'Export functionality would be implemented here',
        'export_url': '/api/students/export/download/',
        'status': 'processing'
    })


class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for Student model with full CRUD operations."""
    
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.AllowAny]  # Temporarily allow anonymous access for testing
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student_id', 'first_name', 'last_name', 'email']
    ordering_fields = ['student_id', 'first_name', 'last_name', 'created_at']
    ordering = ['student_id']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StudentUpdateSerializer
        return StudentSerializer
    
    def get_queryset(self):
        """Filter students based on user role and permissions."""
        user = self.request.user
        queryset = Student.objects.all()
        
        # If user is not authenticated, return all students (for testing)
        if not user.is_authenticated:
            return queryset
        
        # Students can only see themselves
        if hasattr(user, 'role') and user.role == 'Student':
            queryset = queryset.filter(user=user)
        
        # Advisors can see students in their projects
        elif hasattr(user, 'role') and user.role == 'Advisor':
            try:
                # Get advisor instance
                advisor = Advisor.objects.get(user=user)
                # Get all project groups where this advisor is the advisor
                project_groups = ProjectGroup.objects.filter(advisor_name__icontains=user.get_full_name() or user.username)
                # Get all students in these project groups
                project_students = ProjectStudent.objects.filter(project_group__in=project_groups)
                student_ids = [ps.student.id for ps in project_students]
                queryset = queryset.filter(id__in=student_ids)
            except Advisor.DoesNotExist:
                # If advisor doesn't exist, return empty queryset
                queryset = queryset.none()
        
        # Department admins can see students in their department
        elif hasattr(user, 'role') and user.role == 'DepartmentAdmin':
            try:
                # Get advisor instance (DepartmentAdmin is also an Advisor)
                advisor = Advisor.objects.get(user=user)
                # Filter students by advisor's specialized majors if available
                if hasattr(advisor, 'specialized_major_ids') and advisor.specialized_major_ids:
                    # If advisor has specialized majors, filter by those
                    queryset = queryset.filter(major_id__in=advisor.specialized_major_ids)
                # If no specialized majors, DepartmentAdmin can see all students
                # (This can be customized based on business requirements)
            except Advisor.DoesNotExist:
                # If advisor doesn't exist, return all students for DepartmentAdmin
                pass
        
        # Admins can see all students
        elif hasattr(user, 'role') and user.role == 'Admin':
            pass
        
        return queryset