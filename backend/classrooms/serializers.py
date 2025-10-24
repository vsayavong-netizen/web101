from rest_framework import serializers
from .models import Classroom, ClassroomStudent, ClassroomSchedule


class ClassroomScheduleSerializer(serializers.ModelSerializer):
    """Serializer for ClassroomSchedule model."""
    
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    
    class Meta:
        model = ClassroomSchedule
        fields = [
            'id', 'day_of_week', 'start_time', 'end_time',
            'subject', 'instructor', 'instructor_name', 'created_at', 'updated_at'
        ]


class ClassroomStudentSerializer(serializers.ModelSerializer):
    """Serializer for ClassroomStudent model."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.username', read_only=True)
    
    class Meta:
        model = ClassroomStudent
        fields = [
            'id', 'student', 'student_id', 'student_name',
            'enrollment_date', 'is_active', 'created_at', 'updated_at'
        ]


class ClassroomSerializer(serializers.ModelSerializer):
    """Serializer for Classroom model."""
    
    major_name = serializers.CharField(source='major.name', read_only=True)
    major_abbreviation = serializers.CharField(source='major.abbreviation', read_only=True)
    students = ClassroomStudentSerializer(many=True, read_only=True)
    schedules = ClassroomScheduleSerializer(many=True, read_only=True)
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Classroom
        fields = [
            'id', 'name', 'major', 'major_name', 'major_abbreviation',
            'academic_year', 'semester', 'capacity', 'is_active',
            'building', 'room_number', 'student_count',
            'students', 'schedules', 'created_at', 'updated_at'
        ]
    
    def get_student_count(self, obj):
        """Get count of active students in this classroom."""
        return obj.students.filter(is_active=True).count()


class ClassroomListSerializer(serializers.ModelSerializer):
    """Simplified serializer for classroom list view."""
    
    major_name = serializers.CharField(source='major.name', read_only=True)
    major_abbreviation = serializers.CharField(source='major.abbreviation', read_only=True)
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Classroom
        fields = [
            'id', 'name', 'major', 'major_name', 'major_abbreviation',
            'academic_year', 'semester', 'capacity', 'is_active',
            'building', 'room_number', 'student_count', 'created_at'
        ]
    
    def get_student_count(self, obj):
        """Get count of active students in this classroom."""
        return obj.students.filter(is_active=True).count()


class ClassroomCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating classrooms."""
    
    class Meta:
        model = Classroom
        fields = [
            'name', 'major', 'academic_year', 'semester',
            'capacity', 'is_active', 'building', 'room_number'
        ]
    
    def validate(self, data):
        """Validate classroom data."""
        # Check for duplicate classroom name in same academic year and semester
        name = data.get('name')
        academic_year = data.get('academic_year')
        semester = data.get('semester')
        
        if self.instance:
            # Update case
            if Classroom.objects.filter(
                name=name, 
                academic_year=academic_year, 
                semester=semester
            ).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError(
                    "Classroom with this name already exists for the same academic year and semester."
                )
        else:
            # Create case
            if Classroom.objects.filter(
                name=name, 
                academic_year=academic_year, 
                semester=semester
            ).exists():
                raise serializers.ValidationError(
                    "Classroom with this name already exists for the same academic year and semester."
                )
        
        return data


class ClassroomEnrollmentSerializer(serializers.Serializer):
    """Serializer for classroom enrollment operations."""
    
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of student IDs to enroll"
    )
    action = serializers.ChoiceField(
        choices=['enroll', 'unenroll'],
        help_text="Action to perform: enroll or unenroll"
    )
    
    def validate_student_ids(self, value):
        """Validate student IDs."""
        if not value:
            raise serializers.ValidationError("At least one student ID is required.")
        return value


class ClassroomStatisticsSerializer(serializers.Serializer):
    """Serializer for classroom statistics."""
    
    total_classrooms = serializers.IntegerField()
    active_classrooms = serializers.IntegerField()
    total_students = serializers.IntegerField()
    average_classroom_size = serializers.FloatField()
    classrooms_by_major = serializers.DictField()
    classrooms_by_semester = serializers.DictField()