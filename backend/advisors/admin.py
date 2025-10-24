from django.contrib import admin
from .models import (
    Advisor, AdvisorSpecialization, AdvisorWorkload, AdvisorPerformance,
    AdvisorAvailability, AdvisorNote
)


@admin.register(Advisor)
class AdvisorAdmin(admin.ModelAdmin):
    """Admin interface for Advisor model."""
    
    list_display = ['user', 'advisor_id', 'quota', 'department', 'is_active', 'is_department_admin']
    list_filter = ['department', 'is_active', 'is_department_admin', 'created_at']
    search_fields = ['user__username', 'advisor_id', 'department']
    ordering = ['advisor_id']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'advisor_id', 'academic_title', 'department', 'office_location')
        }),
        ('Quotas', {
            'fields': ('quota', 'main_committee_quota', 'second_committee_quota', 'third_committee_quota')
        }),
        ('Contact', {
            'fields': ('office_hours', 'phone_extension', 'office_phone')
        }),
        ('Professional', {
            'fields': ('research_interests', 'qualifications', 'experience_years')
        }),
        ('Status', {
            'fields': ('is_active', 'is_department_admin')
        })
    )


@admin.register(AdvisorSpecialization)
class AdvisorSpecializationAdmin(admin.ModelAdmin):
    """Admin interface for AdvisorSpecialization model."""
    
    list_display = ['advisor', 'major', 'expertise_level', 'created_at']
    list_filter = ['expertise_level', 'created_at']
    search_fields = ['advisor__advisor_id', 'major']
    ordering = ['advisor', 'major']


@admin.register(AdvisorWorkload)
class AdvisorWorkloadAdmin(admin.ModelAdmin):
    """Admin interface for AdvisorWorkload model."""
    
    list_display = ['advisor', 'academic_year', 'semester', 'total_projects', 'overall_utilization', 'recorded_at']
    list_filter = ['academic_year', 'semester', 'recorded_at']
    search_fields = ['advisor__advisor_id']
    ordering = ['-academic_year', '-semester']


@admin.register(AdvisorPerformance)
class AdvisorPerformanceAdmin(admin.ModelAdmin):
    """Admin interface for AdvisorPerformance model."""
    
    list_display = ['advisor', 'academic_year', 'projects_completed', 'average_project_score', 'student_satisfaction_score']
    list_filter = ['academic_year', 'recorded_at']
    search_fields = ['advisor__advisor_id']
    ordering = ['-academic_year']


@admin.register(AdvisorAvailability)
class AdvisorAvailabilityAdmin(admin.ModelAdmin):
    """Admin interface for AdvisorAvailability model."""
    
    list_display = ['advisor', 'date', 'is_available', 'created_at']
    list_filter = ['is_available', 'date', 'created_at']
    search_fields = ['advisor__advisor_id', 'reason']
    ordering = ['-date']


@admin.register(AdvisorNote)
class AdvisorNoteAdmin(admin.ModelAdmin):
    """Admin interface for AdvisorNote model."""
    
    list_display = ['advisor', 'note_type', 'title', 'is_private', 'created_by', 'created_at']
    list_filter = ['note_type', 'is_private', 'created_at']
    search_fields = ['advisor__advisor_id', 'title', 'content', 'created_by__username']
    ordering = ['-created_at']
