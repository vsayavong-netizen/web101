from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Advisor, AdvisorSpecialization, AdvisorWorkload, AdvisorPerformance,
    AdvisorAvailability, AdvisorNote
)

User = get_user_model()


class AdvisorSerializer(serializers.ModelSerializer):
    """Serializer for Advisor model."""
    
    user = serializers.SerializerMethodField()
    specializations = serializers.SerializerMethodField()
    specializedMajorIds = serializers.SerializerMethodField()  # For frontend compatibility
    current_workload = serializers.SerializerMethodField()
    performance_summary = serializers.SerializerMethodField()
    recent_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = Advisor
        fields = [
            'id', 'user', 'advisor_id', 'quota', 'main_committee_quota',
            'second_committee_quota', 'third_committee_quota', 'academic_title',
            'department', 'office_location', 'office_hours', 'phone_extension',
            'office_phone', 'research_interests', 'qualifications',
            'experience_years', 'is_active', 'is_department_admin',
            'created_at', 'updated_at', 'specializations', 'specializedMajorIds',
            'current_workload', 'performance_summary', 'recent_notes'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
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
    
    def get_specializations(self, obj):
        """Get advisor specializations."""
        specializations = obj.specializations.all()
        return [
            {
                'id': spec.id,
                'major': spec.major,
                'expertise_level': spec.expertise_level,
                'description': spec.description
            }
            for spec in specializations
        ]
    
    def get_specializedMajorIds(self, obj):
        """Get specialized major IDs for frontend compatibility."""
        from majors.models import Major
        specializations = obj.specializations.all()
        major_ids = []
        for spec in specializations:
            try:
                # Try to find major by name
                major = Major.objects.filter(name__icontains=spec.major).first()
                if major:
                    major_ids.append(major.id)
            except:
                pass
        # If no specializations, return all major IDs (allow advisor to supervise all majors)
        if not major_ids:
            major_ids = list(Major.objects.values_list('id', flat=True))
        return major_ids
    
    def get_current_workload(self, obj):
        """Get current workload information."""
        # TODO: Implement actual workload calculation
        return {
            'supervising_projects': 0,
            'main_committee_projects': 0,
            'second_committee_projects': 0,
            'third_committee_projects': 0,
            'total_projects': 0,
            'is_overloaded': False,
            'utilization_rate': 0.0
        }
    
    def get_performance_summary(self, obj):
        """Get performance summary."""
        # TODO: Implement performance calculation
        return {
            'average_score': 0.0,
            'completion_rate': 0.0,
            'satisfaction_score': 0.0,
            'response_time': 0.0
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


class AdvisorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new advisors."""
    
    user_id = serializers.IntegerField(write_only=True)
    specialization_majors = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="List of major names for specializations"
    )
    
    class Meta:
        model = Advisor
        fields = [
            'user_id', 'advisor_id', 'quota', 'main_committee_quota',
            'second_committee_quota', 'third_committee_quota', 'academic_title',
            'department', 'office_location', 'office_hours', 'phone_extension',
            'office_phone', 'research_interests', 'qualifications',
            'experience_years', 'is_department_admin', 'specialization_majors'
        ]
    
    def create(self, validated_data):
        """Create a new advisor."""
        user_id = validated_data.pop('user_id')
        specialization_majors = validated_data.pop('specialization_majors', [])
        
        try:
            user = User.objects.get(id=user_id, role='Advisor')
            advisor = Advisor.objects.create(user=user, **validated_data)
            
            # Create specializations
            for major in specialization_majors:
                AdvisorSpecialization.objects.create(
                    advisor=advisor,
                    major=major
                )
            
            return advisor
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found or not an advisor.")


class AdvisorUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating advisor information."""
    
    class Meta:
        model = Advisor
        fields = [
            'quota', 'main_committee_quota', 'second_committee_quota',
            'third_committee_quota', 'academic_title', 'department',
            'office_location', 'office_hours', 'phone_extension',
            'office_phone', 'research_interests', 'qualifications',
            'experience_years', 'is_active', 'is_department_admin'
        ]


class AdvisorSpecializationSerializer(serializers.ModelSerializer):
    """Serializer for advisor specializations."""
    
    class Meta:
        model = AdvisorSpecialization
        fields = [
            'id', 'major', 'expertise_level', 'description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AdvisorWorkloadSerializer(serializers.ModelSerializer):
    """Serializer for advisor workload."""
    
    class Meta:
        model = AdvisorWorkload
        fields = [
            'id', 'academic_year', 'semester', 'supervising_projects',
            'main_committee_projects', 'second_committee_projects',
            'third_committee_projects', 'total_projects',
            'supervising_capacity', 'main_committee_capacity',
            'second_committee_capacity', 'third_committee_capacity',
            'supervising_utilization', 'main_committee_utilization',
            'second_committee_utilization', 'third_committee_utilization',
            'overall_utilization', 'recorded_at'
        ]
        read_only_fields = ['id', 'recorded_at']


class AdvisorPerformanceSerializer(serializers.ModelSerializer):
    """Serializer for advisor performance."""
    
    class Meta:
        model = AdvisorPerformance
        fields = [
            'id', 'academic_year', 'projects_completed', 'average_project_score',
            'student_satisfaction_score', 'response_time_hours',
            'on_time_completion_rate', 'quality_score', 'innovation_score',
            'recorded_at'
        ]
        read_only_fields = ['id', 'recorded_at']


class AdvisorAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for advisor availability."""
    
    class Meta:
        model = AdvisorAvailability
        fields = [
            'id', 'date', 'is_available', 'reason', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AdvisorNoteSerializer(serializers.ModelSerializer):
    """Serializer for advisor notes."""
    
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdvisorNote
        fields = [
            'id', 'note_type', 'title', 'content', 'is_private',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        """Get creator's name."""
        return obj.created_by.get_full_name()


class AdvisorBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating advisors."""
    
    advisor_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of advisor IDs to update"
    )
    updates = serializers.DictField(
        help_text="Dictionary of fields to update"
    )
    
    def validate_updates(self, value):
        """Validate update fields."""
        allowed_fields = [
            'quota', 'main_committee_quota', 'second_committee_quota',
            'third_committee_quota', 'is_active', 'is_department_admin'
        ]
        
        for field in value.keys():
            if field not in allowed_fields:
                raise serializers.ValidationError(f"Field '{field}' is not allowed for bulk update.")
        
        return value


class AdvisorSearchSerializer(serializers.Serializer):
    """Serializer for advisor search parameters."""
    
    query = serializers.CharField(required=False, help_text="Search query")
    department = serializers.CharField(required=False, help_text="Filter by department")
    specialization = serializers.CharField(required=False, help_text="Filter by specialization")
    is_active = serializers.BooleanField(required=False, help_text="Filter by active status")
    is_available = serializers.BooleanField(required=False, help_text="Filter by availability")
    quota_min = serializers.IntegerField(required=False, help_text="Minimum quota")
    quota_max = serializers.IntegerField(required=False, help_text="Maximum quota")


class AdvisorWorkloadSummarySerializer(serializers.Serializer):
    """Serializer for advisor workload summary."""
    
    advisor_id = serializers.CharField()
    advisor_name = serializers.CharField()
    current_load = serializers.IntegerField()
    quota = serializers.IntegerField()
    utilization_rate = serializers.FloatField()
    is_overloaded = serializers.BooleanField()
    specializations = serializers.ListField(child=serializers.CharField())
    performance_score = serializers.FloatField()
    availability_status = serializers.CharField()


class AdvisorBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk advisor updates."""
    
    advisor_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1
    )
    updates = serializers.DictField()
    
    def validate_advisor_ids(self, value):
        """Validate advisor IDs exist."""
        existing_ids = Advisor.objects.filter(id__in=value).values_list('id', flat=True)
        missing_ids = set(value) - set(existing_ids)
        if missing_ids:
            raise serializers.ValidationError(f"Advisors not found: {list(missing_ids)}")
        return value
    
    def validate_updates(self, value):
        """Validate update fields."""
        allowed_fields = [
            'is_active', 'is_department_admin', 'department', 'academic_title'
        ]
        invalid_fields = set(value.keys()) - set(allowed_fields)
        if invalid_fields:
            raise serializers.ValidationError(f"Invalid fields: {list(invalid_fields)}")
        return value


class AdvisorSearchSerializer(serializers.Serializer):
    """Serializer for advisor search."""
    
    query = serializers.CharField(max_length=100)
    department = serializers.CharField(required=False)
    academic_title = serializers.CharField(required=False)
    is_active = serializers.BooleanField(required=False)
    specialization = serializers.CharField(required=False)
    
    def validate_query(self, value):
        """Validate search query."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Search query must be at least 2 characters.")
        return value.strip()


class AdvisorStatisticsSerializer(serializers.Serializer):
    """Serializer for advisor statistics."""
    
    total_advisors = serializers.IntegerField()
    active_advisors = serializers.IntegerField()
    inactive_advisors = serializers.IntegerField()
    advisors_by_department = serializers.DictField()
    advisors_by_academic_title = serializers.DictField()
    average_workload = serializers.FloatField()
    overloaded_advisors = serializers.IntegerField()
    recent_advisor_additions = serializers.IntegerField()


class AdvisorWorkloadAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for advisor workload analysis."""
    
    user = serializers.SerializerMethodField()
    current_workload = serializers.SerializerMethodField()
    workload_history = serializers.SerializerMethodField()
    capacity_utilization = serializers.SerializerMethodField()
    workload_trend = serializers.SerializerMethodField()
    recommendations = serializers.SerializerMethodField()
    
    class Meta:
        model = Advisor
        fields = [
            'id', 'user', 'department', 'academic_title', 'quota',
            'current_workload', 'workload_history', 'capacity_utilization',
            'workload_trend', 'recommendations'
        ]
        read_only_fields = ['id']
    
    def get_user(self, obj):
        """Get user information."""
        return {
            'id': obj.user.id,
            'name': obj.user.get_full_name(),
            'email': obj.user.email,
            'is_active': obj.user.is_active
        }
    
    def get_current_workload(self, obj):
        """Get current workload information."""
        current_workload = obj.workloads.filter(is_current=True).first()
        if current_workload:
            return {
                'current_students': current_workload.current_students,
                'max_capacity': current_workload.max_capacity,
                'workload_percentage': current_workload.workload_percentage,
                'academic_year': current_workload.academic_year,
                'semester': current_workload.semester
            }
        return None
    
    def get_workload_history(self, obj):
        """Get workload history."""
        workloads = obj.workloads.all().order_by('-academic_year', '-semester')[:10]
        return [
            {
                'academic_year': w.academic_year,
                'semester': w.semester,
                'current_students': w.current_students,
                'max_capacity': w.max_capacity,
                'workload_percentage': w.workload_percentage,
                'created_at': w.created_at
            }
            for w in workloads
        ]
    
    def get_capacity_utilization(self, obj):
        """Calculate capacity utilization."""
        current_workload = obj.workloads.filter(is_current=True).first()
        if current_workload:
            return {
                'utilization_percentage': current_workload.workload_percentage,
                'available_capacity': current_workload.max_capacity - current_workload.current_students,
                'is_overloaded': current_workload.workload_percentage > 100
            }
        return None
    
    def get_workload_trend(self, obj):
        """Calculate workload trend."""
        workloads = obj.workloads.all().order_by('academic_year', 'semester')
        if workloads.count() >= 2:
            recent = workloads.last()
            previous = workloads[workloads.count()-2]
            trend = recent.workload_percentage - previous.workload_percentage
            return {
                'trend_direction': 'increasing' if trend > 0 else 'decreasing' if trend < 0 else 'stable',
                'trend_percentage': abs(trend),
                'recent_workload': recent.workload_percentage,
                'previous_workload': previous.workload_percentage
            }
        return None
    
    def get_recommendations(self, obj):
        """Get workload recommendations."""
        current_workload = obj.workloads.filter(is_current=True).first()
        if not current_workload:
            return []
        
        recommendations = []
        if current_workload.workload_percentage > 100:
            recommendations.append("Advisor is overloaded - consider redistributing students")
        elif current_workload.workload_percentage > 80:
            recommendations.append("Advisor is approaching capacity - monitor workload")
        elif current_workload.workload_percentage < 50:
            recommendations.append("Advisor has capacity for additional students")
        
        return recommendations


class AdvisorPerformanceAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for advisor performance analysis."""
    
    user = serializers.SerializerMethodField()
    performance_metrics = serializers.SerializerMethodField()
    performance_history = serializers.SerializerMethodField()
    performance_trend = serializers.SerializerMethodField()
    performance_ranking = serializers.SerializerMethodField()
    improvement_suggestions = serializers.SerializerMethodField()
    
    class Meta:
        model = Advisor
        fields = [
            'id', 'user', 'department', 'academic_title',
            'performance_metrics', 'performance_history', 'performance_trend',
            'performance_ranking', 'improvement_suggestions'
        ]
        read_only_fields = ['id']
    
    def get_user(self, obj):
        """Get user information."""
        return {
            'id': obj.user.id,
            'name': obj.user.get_full_name(),
            'email': obj.user.email
        }
    
    def get_performance_metrics(self, obj):
        """Get current performance metrics."""
        latest_performance = obj.performance_records.order_by('-academic_year').first()
        if latest_performance:
            return {
                'student_satisfaction_score': latest_performance.student_satisfaction_score,
                'project_completion_rate': latest_performance.project_completion_rate,
                'average_project_grade': latest_performance.average_project_grade,
                'total_projects_supervised': latest_performance.total_projects_supervised,
                'academic_year': latest_performance.academic_year
            }
        return None
    
    def get_performance_history(self, obj):
        """Get performance history."""
        performances = obj.performance_records.all().order_by('-academic_year')[:5]
        return [
            {
                'academic_year': p.academic_year,
                'student_satisfaction_score': p.student_satisfaction_score,
                'project_completion_rate': p.project_completion_rate,
                'average_project_grade': p.average_project_grade,
                'total_projects_supervised': p.total_projects_supervised
            }
            for p in performances
        ]
    
    def get_performance_trend(self, obj):
        """Calculate performance trend."""
        performances = obj.performance_records.all().order_by('academic_year')
        if performances.count() >= 2:
            recent = performances.last()
            previous = performances[performances.count()-2]
            satisfaction_trend = recent.student_satisfaction_score - previous.student_satisfaction_score
            completion_trend = recent.project_completion_rate - previous.project_completion_rate
            return {
                'satisfaction_trend': 'improving' if satisfaction_trend > 0 else 'declining' if satisfaction_trend < 0 else 'stable',
                'completion_trend': 'improving' if completion_trend > 0 else 'declining' if completion_trend < 0 else 'stable',
                'satisfaction_change': satisfaction_trend,
                'completion_change': completion_trend
            }
        return None
    
    def get_performance_ranking(self, obj):
        """Get performance ranking among advisors."""
        # This would typically involve comparing with other advisors
        # For now, return a placeholder
        return {
            'satisfaction_rank': 1,
            'completion_rank': 1,
            'overall_rank': 1,
            'total_advisors': 1
        }
    
    def get_improvement_suggestions(self, obj):
        """Get improvement suggestions."""
        latest_performance = obj.performance_records.order_by('-academic_year').first()
        if not latest_performance:
            return []
        
        suggestions = []
        if latest_performance.student_satisfaction_score < 4.0:
            suggestions.append("Focus on improving student communication and support")
        if latest_performance.project_completion_rate < 90:
            suggestions.append("Review project management processes and student guidance")
        if latest_performance.average_project_grade < 3.5:
            suggestions.append("Provide additional academic support and resources")
        
        return suggestions
