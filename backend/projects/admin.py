from django.contrib import admin
from .models import (
    ProjectGroup, StatusHistory, ProjectStudent, ProjectFile,
    CommunicationLog, ProjectHealthCheck, TopicSimilarity
)


@admin.register(ProjectGroup)
class ProjectGroupAdmin(admin.ModelAdmin):
    """Admin interface for ProjectGroup model."""
    
    list_display = ['project_id', 'topic_eng', 'advisor_name', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'advisor_name']
    search_fields = ['project_id', 'topic_eng', 'advisor_name']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('project_id', 'topic_lao', 'topic_eng', 'advisor_name', 'comment', 'status')
        }),
        ('Committee', {
            'fields': ('main_committee_id', 'second_committee_id', 'third_committee_id')
        }),
        ('Defense', {
            'fields': ('defense_date', 'defense_time', 'defense_room')
        }),
        ('Scoring', {
            'fields': ('final_grade', 'main_advisor_score', 'main_committee_score', 'second_committee_score', 'third_committee_score')
        }),
        ('AI Analysis', {
            'fields': ('similarity_info', 'project_health_status')
        })
    )


@admin.register(StatusHistory)
class StatusHistoryAdmin(admin.ModelAdmin):
    """Admin interface for StatusHistory model."""
    
    list_display = ['project_group', 'old_status', 'new_status', 'changed_by', 'changed_at']
    list_filter = ['old_status', 'new_status', 'changed_at']
    search_fields = ['project_group__project_id', 'changed_by__username']
    ordering = ['-changed_at']


@admin.register(ProjectStudent)
class ProjectStudentAdmin(admin.ModelAdmin):
    """Admin interface for ProjectStudent model."""
    
    list_display = ['project_group', 'student', 'is_primary', 'joined_at']
    list_filter = ['is_primary', 'joined_at']
    search_fields = ['project_group__project_id', 'student__username']
    ordering = ['-joined_at']


@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    """Admin interface for ProjectFile model."""
    
    list_display = ['project_group', 'file_name', 'file_size', 'uploaded_by', 'uploaded_at']
    list_filter = ['file_type', 'is_public', 'uploaded_at']
    search_fields = ['project_group__project_id', 'file_name', 'uploaded_by__username']
    ordering = ['-uploaded_at']


@admin.register(CommunicationLog)
class CommunicationLogAdmin(admin.ModelAdmin):
    """Admin interface for CommunicationLog model."""
    
    list_display = ['project_group', 'author', 'message_type', 'is_public', 'created_at']
    list_filter = ['message_type', 'is_public', 'created_at']
    search_fields = ['project_group__project_id', 'author__username', 'message']
    ordering = ['-created_at']


@admin.register(ProjectHealthCheck)
class ProjectHealthCheckAdmin(admin.ModelAdmin):
    """Admin interface for ProjectHealthCheck model."""
    
    list_display = ['project_group', 'health_status', 'analyzed_at', 'analyzed_by_ai']
    list_filter = ['health_status', 'analyzed_by_ai', 'analyzed_at']
    search_fields = ['project_group__project_id', 'summary']
    ordering = ['-analyzed_at']


@admin.register(TopicSimilarity)
class TopicSimilarityAdmin(admin.ModelAdmin):
    """Admin interface for TopicSimilarity model."""
    
    list_display = ['project_group', 'similar_project_id', 'similarity_percentage', 'analyzed_at']
    list_filter = ['analyzed_at']
    search_fields = ['project_group__project_id', 'similar_project_id', 'reason']
    ordering = ['-analyzed_at']
