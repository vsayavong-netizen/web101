from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.contrib.auth import get_user_model

from .models import Classroom, ClassroomStudent, ClassroomSchedule
from .serializers import (
    ClassroomSerializer, ClassroomListSerializer, ClassroomCreateUpdateSerializer,
    ClassroomStudentSerializer, ClassroomScheduleSerializer,
    ClassroomEnrollmentSerializer, ClassroomStatisticsSerializer
)

User = get_user_model()


class ClassroomListView(generics.ListCreateAPIView):
    """List and create classrooms."""
    
    queryset = Classroom.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'major__name', 'building', 'room_number']
    ordering_fields = ['name', 'academic_year', 'semester', 'created_at']
    ordering = ['academic_year', 'semester', 'name']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ClassroomListSerializer
        return ClassroomCreateUpdateSerializer
    
    def get_queryset(self):
        """Filter classrooms based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by academic year
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        # Filter by semester
        semester = self.request.query_params.get('semester')
        if semester:
            queryset = queryset.filter(semester=semester)
        
        # Filter by major
        major_id = self.request.query_params.get('major_id')
        if major_id:
            queryset = queryset.filter(major_id=major_id)
        
        # Filter active classrooms
        active_only = self.request.query_params.get('active_only', 'true').lower() == 'true'
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        return queryset


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a classroom."""
    
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ClassroomCreateUpdateSerializer
        return ClassroomSerializer


class ClassroomStudentListView(generics.ListCreateAPIView):
    """List and manage classroom students."""
    
    serializer_class = ClassroomStudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__first_name', 'student__last_name', 'student__username']
    ordering_fields = ['enrollment_date', 'student__first_name']
    ordering = ['student__first_name']
    
    def get_queryset(self):
        """Filter by classroom if specified."""
        queryset = ClassroomStudent.objects.all()
        classroom_id = self.request.query_params.get('classroom_id')
        
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)
        
        # Filter active enrollments
        active_only = self.request.query_params.get('active_only', 'true').lower() == 'true'
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        return queryset


class ClassroomScheduleListView(generics.ListCreateAPIView):
    """List and manage classroom schedules."""
    
    serializer_class = ClassroomScheduleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['subject', 'instructor__first_name', 'instructor__last_name']
    ordering_fields = ['day_of_week', 'start_time', 'subject']
    ordering = ['day_of_week', 'start_time']
    
    def get_queryset(self):
        """Filter by classroom if specified."""
        queryset = ClassroomSchedule.objects.all()
        classroom_id = self.request.query_params.get('classroom_id')
        
        if classroom_id:
            queryset = queryset.filter(classroom_id=classroom_id)
        
        return queryset


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def classroom_statistics(request):
    """Get classroom statistics."""
    
    # Basic counts
    total_classrooms = Classroom.objects.count()
    active_classrooms = Classroom.objects.filter(is_active=True).count()
    
    # Student statistics
    total_students = ClassroomStudent.objects.filter(is_active=True).count()
    average_classroom_size = Classroom.objects.annotate(
        student_count=Count('students', filter=Q(students__is_active=True))
    ).aggregate(avg_size=Avg('student_count'))['avg_size'] or 0
    
    # Classrooms by major
    classrooms_by_major = {}
    for classroom in Classroom.objects.filter(is_active=True):
        major_name = classroom.major.name
        classrooms_by_major[major_name] = classrooms_by_major.get(major_name, 0) + 1
    
    # Classrooms by semester
    classrooms_by_semester = {}
    for classroom in Classroom.objects.filter(is_active=True):
        semester = f"{classroom.academic_year} - {classroom.semester}"
        classrooms_by_semester[semester] = classrooms_by_semester.get(semester, 0) + 1
    
    statistics = {
        'total_classrooms': total_classrooms,
        'active_classrooms': active_classrooms,
        'total_students': total_students,
        'average_classroom_size': round(average_classroom_size, 2),
        'classrooms_by_major': classrooms_by_major,
        'classrooms_by_semester': classrooms_by_semester
    }
    
    serializer = ClassroomStatisticsSerializer(statistics)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def classroom_enrollment(request, classroom_id):
    """Enroll or unenroll students in a classroom."""
    
    try:
        classroom = Classroom.objects.get(id=classroom_id)
    except Classroom.DoesNotExist:
        return Response(
            {'error': 'Classroom not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = ClassroomEnrollmentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    student_ids = serializer.validated_data['student_ids']
    action = serializer.validated_data['action']
    
    # Validate students exist
    students = User.objects.filter(id__in=student_ids, role='Student')
    if students.count() != len(student_ids):
        return Response(
            {'error': 'Some student IDs are invalid'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if action == 'enroll':
        # Enroll students
        enrolled_count = 0
        for student in students:
            enrollment, created = ClassroomStudent.objects.get_or_create(
                classroom=classroom,
                student=student,
                defaults={'is_active': True}
            )
            if created:
                enrolled_count += 1
        
        return Response({
            'message': f'Successfully enrolled {enrolled_count} students',
            'enrolled_count': enrolled_count
        })
    
    elif action == 'unenroll':
        # Unenroll students
        unenrolled_count = ClassroomStudent.objects.filter(
            classroom=classroom,
            student__in=students
        ).update(is_active=False)
        
        return Response({
            'message': f'Successfully unenrolled {unenrolled_count} students',
            'unenrolled_count': unenrolled_count
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def classroom_dropdown(request):
    """Get classrooms for dropdown selection."""
    
    academic_year = request.query_params.get('academic_year')
    semester = request.query_params.get('semester')
    
    queryset = Classroom.objects.filter(is_active=True)
    
    if academic_year:
        queryset = queryset.filter(academic_year=academic_year)
    if semester:
        queryset = queryset.filter(semester=semester)
    
    queryset = queryset.order_by('name')
    serializer = ClassroomListSerializer(queryset, many=True)
    
    return Response(serializer.data)