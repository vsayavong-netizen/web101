from rest_framework import serializers
from .models import Major, MajorSpecialization, MajorRequirement


class MajorRequirementSerializer(serializers.ModelSerializer):
    """Serializer for MajorRequirement model."""
    
    class Meta:
        model = MajorRequirement
        fields = [
            'id', 'requirement_type', 'requirement_value', 
            'description', 'is_mandatory', 'created_at', 'updated_at'
        ]


class MajorSpecializationSerializer(serializers.ModelSerializer):
    """Serializer for MajorSpecialization model."""
    
    class Meta:
        model = MajorSpecialization
        fields = [
            'id', 'name', 'description', 'is_active', 
            'created_at', 'updated_at'
        ]


class MajorSerializer(serializers.ModelSerializer):
    """Serializer for Major model."""
    
    specializations = MajorSpecializationSerializer(many=True, read_only=True)
    requirements = MajorRequirementSerializer(many=True, read_only=True)
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Major
        fields = [
            'id', 'name', 'abbreviation', 'description', 'degree_level',
            'is_active', 'student_count', 'specializations', 'requirements',
            'created_at', 'updated_at'
        ]
    
    def get_student_count(self, obj):
        """Get count of students in this major."""
        return obj.students.count() if hasattr(obj, 'students') else 0


class MajorListSerializer(serializers.ModelSerializer):
    """Simplified serializer for major list view."""
    
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Major
        fields = [
            'id', 'name', 'abbreviation', 'degree_level',
            'is_active', 'student_count', 'created_at'
        ]
    
    def get_student_count(self, obj):
        """Get count of students in this major."""
        return obj.students.count() if hasattr(obj, 'students') else 0


class MajorCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating majors."""
    
    class Meta:
        model = Major
        fields = [
            'name', 'abbreviation', 'description', 'degree_level', 'is_active'
        ]
    
    def validate_abbreviation(self, value):
        """Validate abbreviation uniqueness."""
        if self.instance:
            if Major.objects.filter(abbreviation=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Abbreviation already exists.")
        else:
            if Major.objects.filter(abbreviation=value).exists():
                raise serializers.ValidationError("Abbreviation already exists.")
        return value.upper()


class MajorStatisticsSerializer(serializers.Serializer):
    """Serializer for major statistics."""
    
    total_majors = serializers.IntegerField()
    active_majors = serializers.IntegerField()
    total_students = serializers.IntegerField()
    students_by_major = serializers.DictField()
    majors_by_degree_level = serializers.DictField()