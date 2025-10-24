from django.contrib import admin
from .models import (
    MilestoneTemplate, MilestoneTask, Milestone, 
    MilestoneSubmission, MilestoneReview
)


@admin.register(MilestoneTemplate)
class MilestoneTemplateAdmin(admin.ModelAdmin):
    """Admin interface for MilestoneTemplate model."""
    
    list_display = ['name', 'estimated_duration_days', 'is_mandatory', 'is_active', 'created_at']
    list_filter = ['is_mandatory', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']


@admin.register(MilestoneTask)
class MilestoneTaskAdmin(admin.ModelAdmin):
    """Admin interface for MilestoneTask model."""
    
    list_display = ['template', 'name', 'duration_days', 'order', 'is_mandatory', 'created_at']
    list_filter = ['is_mandatory', 'template', 'created_at']
    search_fields = ['template__name', 'name', 'description']
    ordering = ['template', 'order']


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    """Admin interface for Milestone model."""
    
    list_display = ['project_group', 'name', 'status', 'due_date', 'submitted_date', 'created_at']
    list_filter = ['status', 'due_date', 'created_at']
    search_fields = ['project_group__project_id', 'name', 'description']
    ordering = ['project_group', 'due_date']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('project_group', 'template', 'name', 'description', 'status')
        }),
        ('Dates', {
            'fields': ('due_date', 'submitted_date', 'approved_date')
        }),
        ('Feedback', {
            'fields': ('feedback', 'feedback_by')
        }),
        ('Files', {
            'fields': ('submitted_file',)
        })
    )


@admin.register(MilestoneSubmission)
class MilestoneSubmissionAdmin(admin.ModelAdmin):
    """Admin interface for MilestoneSubmission model."""
    
    list_display = ['milestone', 'submitted_by', 'file_name', 'file_size', 'submitted_at']
    list_filter = ['submitted_at', 'milestone__status']
    search_fields = ['milestone__name', 'submitted_by__first_name', 'submitted_by__last_name', 'file_name']
    ordering = ['-submitted_at']


@admin.register(MilestoneReview)
class MilestoneReviewAdmin(admin.ModelAdmin):
    """Admin interface for MilestoneReview model."""
    
    list_display = ['milestone', 'reviewer', 'score', 'max_score', 'reviewed_at']
    list_filter = ['reviewed_at', 'milestone__status']
    search_fields = ['milestone__name', 'reviewer__first_name', 'reviewer__last_name', 'review_notes']
    ordering = ['-reviewed_at']