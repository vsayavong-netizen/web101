from django.contrib import admin
from .models import (
    SystemSettings, AcademicYear, SystemLog, SystemNote
)


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """Admin interface for SystemSettings model."""
    
    list_display = ['setting_name', 'setting_value', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['setting_name', 'setting_value', 'description']
    ordering = ['setting_name']


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    """Admin interface for AcademicYear model."""
    
    list_display = ['year', 'is_active', 'start_date', 'end_date', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['year', 'description']
    ordering = ['-year']


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    """Admin interface for SystemLog model."""
    
    list_display = ['log_level', 'message', 'user', 'created_at']
    list_filter = ['log_level', 'created_at']
    search_fields = ['message', 'user__username']
    ordering = ['-created_at']


@admin.register(SystemNote)
class SystemNoteAdmin(admin.ModelAdmin):
    """Admin interface for SystemNote model."""
    
    list_display = ['note_type', 'title', 'is_private', 'created_by', 'created_at']
    list_filter = ['note_type', 'is_private', 'created_at']
    search_fields = ['title', 'content', 'created_by__username']
    ordering = ['-created_at']
