from rest_framework import serializers
from .models import (
    MilestoneTemplate, MilestoneTask, Milestone,
    MilestoneSubmission, MilestoneReview
)


class MilestoneTaskSerializer(serializers.ModelSerializer):
    """Serializer for MilestoneTask model."""
    
    class Meta:
        model = MilestoneTask
        fields = [
            'id', 'template', 'name', 'description', 'duration_days',
            'order', 'is_mandatory', 'created_at', 'updated_at'
        ]


class MilestoneTemplateSerializer(serializers.ModelSerializer):
    """Serializer for MilestoneTemplate model."""
    
    tasks = MilestoneTaskSerializer(many=True, read_only=True)
    
    class Meta:
        model = MilestoneTemplate
        fields = [
            'id', 'name', 'description', 'is_active',
            'estimated_duration_days', 'is_mandatory',
            'tasks', 'created_at', 'updated_at'
        ]


class MilestoneSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for MilestoneSubmission model."""
    
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    
    class Meta:
        model = MilestoneSubmission
        fields = [
            'id', 'milestone', 'submitted_by', 'submitted_by_name',
            'file_name', 'file_size', 'file_type', 'file_path',
            'submission_notes', 'submitted_at'
        ]


class MilestoneReviewSerializer(serializers.ModelSerializer):
    """Serializer for MilestoneReview model."""
    
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    
    class Meta:
        model = MilestoneReview
        fields = [
            'id', 'milestone', 'reviewer', 'reviewer_name',
            'review_notes', 'score', 'max_score', 'criteria_scores',
            'reviewed_at', 'updated_at'
        ]


class MilestoneSerializer(serializers.ModelSerializer):
    """Serializer for Milestone model."""
    
    project_id = serializers.CharField(source='project_group.project_id', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    feedback_by_name = serializers.CharField(source='feedback_by.get_full_name', read_only=True)
    submissions = MilestoneSubmissionSerializer(many=True, read_only=True)
    reviews = MilestoneReviewSerializer(many=True, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Milestone
        fields = [
            'id', 'project_group', 'project_id', 'template', 'template_name',
            'name', 'description', 'status', 'due_date', 'submitted_date',
            'approved_date', 'feedback', 'feedback_by', 'feedback_by_name',
            'submitted_file', 'is_overdue', 'days_remaining',
            'submissions', 'reviews', 'created_at', 'updated_at'
        ]


class MilestoneListSerializer(serializers.ModelSerializer):
    """Simplified serializer for milestone list view."""
    
    project_id = serializers.CharField(source='project_group.project_id', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Milestone
        fields = [
            'id', 'project_group', 'project_id', 'template', 'template_name',
            'name', 'status', 'due_date', 'submitted_date', 'approved_date',
            'is_overdue', 'days_remaining', 'created_at'
        ]


class MilestoneCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating milestones."""
    
    class Meta:
        model = Milestone
        fields = [
            'project_group', 'template', 'name', 'description',
            'due_date', 'status'
        ]
    
    def validate(self, data):
        """Validate milestone data."""
        # Check if project group exists and is active
        project_group = data.get('project_group')
        if project_group and not project_group.is_active:
            raise serializers.ValidationError("Project group is not active.")
        
        # Check if template is active
        template = data.get('template')
        if template and not template.is_active:
            raise serializers.ValidationError("Milestone template is not active.")
        
        return data


class MilestoneStatisticsSerializer(serializers.Serializer):
    """Serializer for milestone statistics."""
    
    total_milestones = serializers.IntegerField()
    pending_milestones = serializers.IntegerField()
    submitted_milestones = serializers.IntegerField()
    approved_milestones = serializers.IntegerField()
    overdue_count = serializers.IntegerField()
    milestones_by_status = serializers.DictField()