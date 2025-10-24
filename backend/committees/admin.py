from django.contrib import admin
from .models import (
    Committee, CommitteeAssignment, CommitteeEvaluation, CommitteeMeeting,
    CommitteeMember, CommitteeNote
)


@admin.register(Committee)
class CommitteeAdmin(admin.ModelAdmin):
    """Admin interface for Committee model."""
    
    list_display = ['committee_id', 'name', 'committee_type', 'chairperson', 'is_active', 'established_date']
    list_filter = ['committee_type', 'is_active', 'established_date', 'created_at']
    search_fields = ['committee_id', 'name', 'chairperson__username']
    ordering = ['committee_id']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('committee_id', 'name', 'committee_type', 'description')
        }),
        ('Leadership', {
            'fields': ('chairperson',)
        }),
        ('Status', {
            'fields': ('is_active', 'established_date', 'dissolved_date')
        })
    )


@admin.register(CommitteeAssignment)
class CommitteeAssignmentAdmin(admin.ModelAdmin):
    """Admin interface for CommitteeAssignment model."""
    
    list_display = ['project_group', 'committee', 'assignment_type', 'assigned_date', 'is_completed']
    list_filter = ['assignment_type', 'is_completed', 'assigned_date']
    search_fields = ['project_group__project_id', 'committee__name']
    ordering = ['-assigned_date']


@admin.register(CommitteeEvaluation)
class CommitteeEvaluationAdmin(admin.ModelAdmin):
    """Admin interface for CommitteeEvaluation model."""
    
    list_display = ['assignment', 'evaluator', 'total_score', 'decision', 'evaluated_at']
    list_filter = ['decision', 'evaluated_at']
    search_fields = ['assignment__project_group__project_id', 'evaluator__username']
    ordering = ['-evaluated_at']


@admin.register(CommitteeMeeting)
class CommitteeMeetingAdmin(admin.ModelAdmin):
    """Admin interface for CommitteeMeeting model."""
    
    list_display = ['committee', 'meeting_date', 'meeting_time', 'meeting_room', 'is_completed']
    list_filter = ['is_completed', 'meeting_date', 'created_at']
    search_fields = ['committee__name', 'meeting_room']
    ordering = ['-meeting_date']


@admin.register(CommitteeMember)
class CommitteeMemberAdmin(admin.ModelAdmin):
    """Admin interface for CommitteeMember model."""
    
    list_display = ['committee', 'member', 'role', 'is_active', 'joined_date']
    list_filter = ['role', 'is_active', 'joined_date']
    search_fields = ['committee__name', 'member__username']
    ordering = ['-joined_date']


@admin.register(CommitteeNote)
class CommitteeNoteAdmin(admin.ModelAdmin):
    """Admin interface for CommitteeNote model."""
    
    list_display = ['committee', 'note_type', 'title', 'is_private', 'created_by', 'created_at']
    list_filter = ['note_type', 'is_private', 'created_at']
    search_fields = ['committee__name', 'title', 'content', 'created_by__username']
    ordering = ['-created_at']
