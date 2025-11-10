from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Student, StudentAcademicRecord, StudentSkill, StudentAchievement,
    StudentAttendance, StudentNote
)

User = get_user_model()


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model."""
    
    user = serializers.SerializerMethodField()
    academic_records = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    achievements = serializers.SerializerMethodField()
    attendance_summary = serializers.SerializerMethodField()
    recent_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'student_id', 'major', 'classroom', 'academic_year',
            'enrollment_date', 'graduation_date', 'gpa', 'is_active',
            'total_credits', 'completed_credits', 'progress_percentage',
            'emergency_contact', 'emergency_phone', 'created_at', 'updated_at',
            'academic_records', 'skills', 'achievements', 'attendance_summary',
            'recent_notes'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'progress_percentage']
    
    def get_user(self, obj):
        """Get user information."""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'full_name': obj.user.get_full_name(),
            'role': obj.user.role,
            'is_active': obj.user.is_active
        }
    
    def get_academic_records(self, obj):
        """Get recent academic records."""
        records = obj.academic_records.all()[:5]  # Last 5 records
        return [
            {
                'id': record.id,
                'semester': record.semester,
                'academic_year': record.academic_year,
                'gpa': record.gpa,
                'credits_earned': record.credits_earned,
                'status': record.status,
                'created_at': record.created_at
            }
            for record in records
        ]
    
    def get_skills(self, obj):
        """Get student skills."""
        skills = obj.skills.all()
        return [
            {
                'id': skill.id,
                'skill_name': skill.skill_name,
                'category': skill.category,
                'proficiency_level': skill.proficiency_level,
                'description': skill.description,
                'is_verified': bool(skill.verified_by),
                'verified_at': skill.verified_at
            }
            for skill in skills
        ]
    
    def get_achievements(self, obj):
        """Get recent achievements."""
        achievements = obj.achievements.all()[:10]  # Last 10 achievements
        return [
            {
                'id': achievement.id,
                'title': achievement.title,
                'description': achievement.description,
                'achievement_type': achievement.achievement_type,
                'date_achieved': achievement.date_achieved,
                'organization': achievement.organization,
                'is_verified': achievement.is_verified
            }
            for achievement in achievements
        ]
    
    def get_attendance_summary(self, obj):
        """Get attendance summary."""
        attendance_records = obj.attendance_records.all()
        total_days = attendance_records.count()
        present_days = attendance_records.filter(status='present').count()
        absent_days = attendance_records.filter(status='absent').count()
        late_days = attendance_records.filter(status='late').count()
        
        attendance_rate = (present_days / total_days * 100) if total_days > 0 else 0
        
        return {
            'total_days': total_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'late_days': late_days,
            'attendance_rate': round(attendance_rate, 2)
        }
    
    def get_recent_notes(self, obj):
        """Get recent notes."""
        notes = obj.notes.filter(is_private=False).all()[:5]  # Last 5 public notes
        return [
            {
                'id': note.id,
                'note_type': note.note_type,
                'title': note.title,
                'content': note.content,
                'created_by': note.created_by.get_full_name(),
                'created_at': note.created_at
            }
            for note in notes
        ]


class StudentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new students."""
    
    user_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Student
        fields = [
            'user_id', 'student_id', 'major', 'classroom', 'academic_year',
            'enrollment_date', 'gpa', 'total_credits', 'completed_credits',
            'emergency_contact', 'emergency_phone'
        ]
    
    def create(self, validated_data):
        """Create a new student."""
        user_id = validated_data.pop('user_id', None)
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                # Check if user role is Student, if not, update it
                if user.role != 'Student':
                    user.role = 'Student'
                    user.save()
                student = Student.objects.create(user=user, **validated_data)
                return student
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    'user_id': f"User with id {user_id} not found."
                })
        else:
            raise serializers.ValidationError({
                'user_id': "user_id is required to create a student."
            })


class StudentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating student information."""
    
    major = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    classroom = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Student
        fields = [
            'major', 'classroom', 'academic_year', 'graduation_date', 'gpa',
            'is_active', 'total_credits', 'completed_credits',
            'emergency_contact', 'emergency_phone'
        ]
    
    def validate_major(self, value):
        """Handle major as either string or ID."""
        if value is None or value == '':
            return value
        
        # If it's a number (ID), try to get the major name
        try:
            major_id = int(value)
            # Try to import Major model
            try:
                from majors.models import Major
                major = Major.objects.filter(id=major_id).first()
                if major:
                    return major.name
            except ImportError:
                pass
        except (ValueError, TypeError):
            pass
        
        # Return as string
        return str(value)
    
    def validate_classroom(self, value):
        """Handle classroom as either string or ID."""
        if value is None or value == '':
            return value
        
        # If it's a number (ID), try to get the classroom name
        try:
            classroom_id = int(value)
            # Try to import Classroom model
            try:
                from classrooms.models import Classroom
                classroom = Classroom.objects.filter(id=classroom_id).first()
                if classroom:
                    return classroom.name
            except ImportError:
                pass
        except (ValueError, TypeError):
            pass
        
        # Return as string
        return str(value)


class StudentAcademicRecordSerializer(serializers.ModelSerializer):
    """Serializer for student academic records."""
    
    class Meta:
        model = StudentAcademicRecord
        fields = [
            'id', 'semester', 'academic_year', 'gpa', 'credits_earned',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StudentSkillSerializer(serializers.ModelSerializer):
    """Serializer for student skills."""
    
    verified_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentSkill
        fields = [
            'id', 'skill_name', 'category', 'proficiency_level',
            'description', 'verified_by_name', 'verified_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_verified_by_name(self, obj):
        """Get verifier's name."""
        return obj.verified_by.get_full_name() if obj.verified_by else None


class StudentAchievementSerializer(serializers.ModelSerializer):
    """Serializer for student achievements."""
    
    verified_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentAchievement
        fields = [
            'id', 'title', 'description', 'achievement_type', 'date_achieved',
            'organization', 'certificate_url', 'is_verified', 'verified_by_name',
            'verified_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_verified_by_name(self, obj):
        """Get verifier's name."""
        return obj.verified_by.get_full_name() if obj.verified_by else None


class StudentAttendanceSerializer(serializers.ModelSerializer):
    """Serializer for student attendance."""
    
    recorded_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentAttendance
        fields = [
            'id', 'date', 'subject', 'status', 'notes',
            'recorded_by_name', 'recorded_at'
        ]
        read_only_fields = ['id', 'recorded_at']
    
    def get_recorded_by_name(self, obj):
        """Get recorder's name."""
        return obj.recorded_by.get_full_name() if obj.recorded_by else None


class StudentNoteSerializer(serializers.ModelSerializer):
    """Serializer for student notes."""
    
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentNote
        fields = [
            'id', 'note_type', 'title', 'content', 'is_private',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        """Get creator's name."""
        return obj.created_by.get_full_name()


class StudentBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating students."""
    
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of student IDs to update"
    )
    updates = serializers.DictField(
        help_text="Dictionary of fields to update"
    )
    
    def validate_updates(self, value):
        """Validate update fields."""
        allowed_fields = [
            'major', 'classroom', 'academic_year', 'is_active',
            'total_credits', 'completed_credits'
        ]
        
        for field in value.keys():
            if field not in allowed_fields:
                raise serializers.ValidationError(f"Field '{field}' is not allowed for bulk update.")
        
        return value


class StudentSearchSerializer(serializers.Serializer):
    """Serializer for student search parameters."""
    
    query = serializers.CharField(required=False, help_text="Search query")
    major = serializers.CharField(required=False, help_text="Filter by major")
    classroom = serializers.CharField(required=False, help_text="Filter by classroom")
    academic_year = serializers.CharField(required=False, help_text="Filter by academic year")
    is_active = serializers.BooleanField(required=False, help_text="Filter by active status")
    gpa_min = serializers.FloatField(required=False, help_text="Minimum GPA")
    gpa_max = serializers.FloatField(required=False, help_text="Maximum GPA")


class StudentBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk student updates."""
    
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    updates = serializers.DictField()
    
    def validate_student_ids(self, value):
        """Validate student IDs exist."""
        existing_ids = Student.objects.filter(id__in=value).values_list('id', flat=True)
        missing_ids = set(value) - set(existing_ids)
        if missing_ids:
            raise serializers.ValidationError(f"Students not found: {list(missing_ids)}")
        return value
    
    def validate_updates(self, value):
        """Validate update fields."""
        allowed_fields = [
            'is_active', 'academic_year', 'classroom'
        ]
        invalid_fields = set(value.keys()) - set(allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(f"Invalid fields: {list(invalid_fields)}")
        return value


class StudentStatisticsSerializer(serializers.Serializer):
    """Serializer for student statistics."""
    
    total_students = serializers.IntegerField()
    active_students = serializers.IntegerField()
    inactive_students = serializers.IntegerField()
    students_by_major = serializers.DictField()
    students_by_academic_year = serializers.DictField()
    average_gpa = serializers.FloatField()
    gpa_distribution = serializers.DictField()
    recent_enrollments = serializers.IntegerField()


class StudentProgressSerializer(serializers.ModelSerializer):
    """Serializer for student progress tracking."""
    
    user = serializers.SerializerMethodField()
    major = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    credits_remaining = serializers.SerializerMethodField()
    estimated_graduation = serializers.SerializerMethodField()
    academic_performance = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'user', 'major', 'academic_year',
            'enrollment_date', 'gpa', 'is_active', 'total_credits',
            'completed_credits', 'progress_percentage', 'credits_remaining',
            'estimated_graduation', 'academic_performance'
        ]
        read_only_fields = ['id', 'student_id']
    
    def get_user(self, obj):
        """Get user information."""
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'email': obj.user.email,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'full_name': obj.user.get_full_name()
        }
    
    def get_major(self, obj):
        """Get major information."""
        if obj.major:
            return {
                'id': obj.major.id,
                'name': obj.major.name,
                'abbreviation': obj.major.abbreviation,
                'degree_level': obj.major.degree_level
            }
        return None
    
    def get_progress_percentage(self, obj):
        """Calculate progress percentage."""
        if obj.total_credits > 0:
            return round((obj.completed_credits / obj.total_credits) * 100, 2)
        return 0.0
    
    def get_credits_remaining(self, obj):
        """Calculate credits remaining."""
        return max(0, obj.total_credits - obj.completed_credits)
    
    def get_estimated_graduation(self, obj):
        """Estimate graduation date."""
        if obj.completed_credits > 0 and obj.total_credits > 0:
            credits_per_semester = 15  # Average credits per semester
            remaining_credits = obj.total_credits - obj.completed_credits
            semesters_remaining = remaining_credits / credits_per_semester
            from datetime import datetime, timedelta
            estimated_date = datetime.now() + timedelta(days=semesters_remaining * 180)
            return estimated_date.strftime('%Y-%m-%d')
        return None
    
    def get_academic_performance(self, obj):
        """Get academic performance summary."""
        from django.db.models import Avg, Count
        records = obj.academic_records.all()
        if records.exists():
            avg_gpa = records.aggregate(avg_gpa=Avg('gpa'))['avg_gpa']
            total_credits = records.aggregate(total=Count('credits_completed'))['total']
            return {
                'average_gpa': round(avg_gpa or 0, 2),
                'total_credits_earned': total_credits or 0,
                'semesters_completed': records.count()
            }
        return {
            'average_gpa': 0.0,
            'total_credits_earned': 0,
            'semesters_completed': 0
        }
