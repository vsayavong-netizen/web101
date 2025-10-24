"""
User management serializers
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from accounts.models import User
from students.models import Student
from advisors.models import Advisor
from majors.models import Major
from classrooms.models import Classroom


class StudentSerializer(serializers.ModelSerializer):
    """
    Student serializer for CRUD operations
    """
    full_name = serializers.SerializerMethodField()
    major_name = serializers.CharField(source='major.name', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    project_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'user', 'student_id', 'gender', 'name', 'surname',
            'full_name', 'major', 'major_name', 'classroom', 'classroom_name',
            'tel', 'email', 'status', 'academic_year', 'project_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'academic_year', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.full_name

    def get_project_count(self, obj):
        return obj.get_project_count()

    def validate_student_id(self, value):
        """Validate student ID format"""
        if Student.objects.filter(student_id=value).exists():
            raise serializers.ValidationError("Student ID already exists.")
        return value

    def validate_email(self, value):
        """Validate email uniqueness"""
        if value and Student.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def create(self, validated_data):
        """Create student with user account"""
        # Create user account first
        user_data = {
            'username': validated_data.get('student_id'),
            'email': validated_data.get('email', ''),
            'first_name': validated_data.get('name', ''),
            'last_name': validated_data.get('surname', ''),
            'role': 'student',
            'academic_year': validated_data.get('academic_year'),
            'is_active': True
        }
        
        user = User.objects.create_user(**user_data)
        validated_data['user'] = user
        
        return super().create(validated_data)


class StudentUpdateSerializer(serializers.ModelSerializer):
    """
    Student update serializer
    """
    full_name = serializers.SerializerMethodField()
    major_name = serializers.CharField(source='major.name', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'student_id', 'gender', 'name', 'surname',
            'full_name', 'major', 'major_name', 'classroom', 'classroom_name',
            'tel', 'email', 'status', 'academic_year'
        ]
        read_only_fields = ['id', 'student_id', 'academic_year']

    def get_full_name(self, obj):
        return obj.full_name

    def validate_email(self, value):
        """Validate email uniqueness excluding current instance"""
        if value and Student.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Email already exists.")
        return value


class AdvisorSerializer(serializers.ModelSerializer):
    """
    Advisor serializer for CRUD operations
    """
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    specialized_major_names = serializers.SerializerMethodField()
    current_project_count = serializers.SerializerMethodField()
    workload_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Advisor
        fields = [
            'id', 'user', 'user_id', 'username', 'email', 'name',
            'quota', 'main_committee_quota', 'second_committee_quota',
            'third_committee_quota', 'is_department_admin',
            'specialized_majors', 'specialized_major_names',
            'current_project_count', 'workload_summary',
            'academic_year', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'academic_year', 'created_at', 'updated_at']

    def get_specialized_major_names(self, obj):
        return [major.name for major in obj.specialized_majors.all()]

    def get_current_project_count(self, obj):
        return obj.get_current_project_count()

    def get_workload_summary(self, obj):
        return obj.get_workload_summary()

    def create(self, validated_data):
        """Create advisor with user account"""
        # Create user account first
        user_data = {
            'username': validated_data.get('name').replace(' ', '.').lower(),
            'email': f"{validated_data.get('name').replace(' ', '.').lower()}@university.edu",
            'first_name': validated_data.get('name').split()[0] if ' ' in validated_data.get('name') else validated_data.get('name'),
            'last_name': ' '.join(validated_data.get('name').split()[1:]) if ' ' in validated_data.get('name') else '',
            'role': 'advisor',
            'academic_year': validated_data.get('academic_year'),
            'is_active': True
        }
        
        user = User.objects.create_user(**user_data)
        validated_data['user'] = user
        
        return super().create(validated_data)


class AdvisorUpdateSerializer(serializers.ModelSerializer):
    """
    Advisor update serializer
    """
    specialized_major_names = serializers.SerializerMethodField()
    current_project_count = serializers.SerializerMethodField()
    workload_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Advisor
        fields = [
            'id', 'name', 'quota', 'main_committee_quota',
            'second_committee_quota', 'third_committee_quota',
            'is_department_admin', 'specialized_majors',
            'specialized_major_names', 'current_project_count',
            'workload_summary', 'academic_year'
        ]
        read_only_fields = ['id', 'academic_year']

    def get_specialized_major_names(self, obj):
        return [major.name for major in obj.specialized_majors.all()]

    def get_current_project_count(self, obj):
        return obj.get_current_project_count()

    def get_workload_summary(self, obj):
        return obj.get_workload_summary()


class UserSerializer(serializers.ModelSerializer):
    """
    User serializer for user management
    """
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    last_login_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'academic_year',
            'is_active', 'is_ai_assistant_enabled', 'must_change_password',
            'last_login', 'last_login_formatted', 'last_login_ip',
            'date_joined', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'last_login', 'last_login_ip', 'date_joined',
            'created_at', 'updated_at'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_last_login_formatted(self, obj):
        if obj.last_login:
            return obj.last_login.strftime('%Y-%m-%d %H:%M:%S')
        return None


class UserCreateSerializer(serializers.ModelSerializer):
    """
    User creation serializer
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'academic_year',
            'is_active', 'is_ai_assistant_enabled'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    User update serializer
    """
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'is_active',
            'is_ai_assistant_enabled', 'must_change_password'
        ]

    def validate_email(self, value):
        """Validate email uniqueness excluding current instance"""
        if value and User.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("Email already exists.")
        return value


class BulkStudentUpdateSerializer(serializers.Serializer):
    """
    Bulk student update serializer
    """
    student_ids = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of student IDs to update"
    )
    updates = serializers.DictField(
        help_text="Fields to update for all students"
    )

    def validate_student_ids(self, value):
        """Validate that all student IDs exist"""
        existing_ids = Student.objects.filter(
            student_id__in=value
        ).values_list('student_id', flat=True)
        
        missing_ids = set(value) - set(existing_ids)
        if missing_ids:
            raise serializers.ValidationError(
                f"Student IDs not found: {', '.join(missing_ids)}"
            )
        return value

    def validate_updates(self, value):
        """Validate update fields"""
        allowed_fields = [
            'status', 'major', 'classroom', 'tel', 'email',
            'is_ai_assistant_enabled'
        ]
        
        invalid_fields = set(value.keys()) - set(allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                f"Invalid fields: {', '.join(invalid_fields)}"
            )
        return value


class BulkAdvisorUpdateSerializer(serializers.Serializer):
    """
    Bulk advisor update serializer
    """
    advisor_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of advisor IDs to update"
    )
    updates = serializers.DictField(
        help_text="Fields to update for all advisors"
    )

    def validate_advisor_ids(self, value):
        """Validate that all advisor IDs exist"""
        existing_ids = Advisor.objects.filter(
            id__in=value
        ).values_list('id', flat=True)
        
        missing_ids = set(value) - set(existing_ids)
        if missing_ids:
            raise serializers.ValidationError(
                f"Advisor IDs not found: {', '.join(map(str, missing_ids))}"
            )
        return value

    def validate_updates(self, value):
        """Validate update fields"""
        allowed_fields = [
            'quota', 'main_committee_quota', 'second_committee_quota',
            'third_committee_quota', 'is_department_admin',
            'specialized_majors', 'is_ai_assistant_enabled'
        ]
        
        invalid_fields = set(value.keys()) - set(allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(
                f"Invalid fields: {', '.join(invalid_fields)}"
            )
        return value


class UserStatisticsSerializer(serializers.Serializer):
    """
    User statistics serializer
    """
    total_users = serializers.IntegerField()
    total_students = serializers.IntegerField()
    total_advisors = serializers.IntegerField()
    total_admins = serializers.IntegerField()
    active_users = serializers.IntegerField()
    inactive_users = serializers.IntegerField()
    users_by_role = serializers.DictField()
    users_by_academic_year = serializers.DictField()
    recent_registrations = serializers.IntegerField()
    users_requiring_password_change = serializers.IntegerField()


class StudentStatisticsSerializer(serializers.Serializer):
    """
    Student statistics serializer
    """
    total_students = serializers.IntegerField()
    approved_students = serializers.IntegerField()
    pending_students = serializers.IntegerField()
    students_with_projects = serializers.IntegerField()
    students_without_projects = serializers.IntegerField()
    students_by_major = serializers.DictField()
    students_by_gender = serializers.DictField()
    students_by_classroom = serializers.DictField()


class AdvisorStatisticsSerializer(serializers.Serializer):
    """
    Advisor statistics serializer
    """
    total_advisors = serializers.IntegerField()
    department_admins = serializers.IntegerField()
    regular_advisors = serializers.IntegerField()
    overloaded_advisors = serializers.IntegerField()
    advisors_by_workload = serializers.DictField()
    committee_positions = serializers.DictField()
    specialized_majors_distribution = serializers.DictField()
