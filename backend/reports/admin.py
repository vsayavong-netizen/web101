from django.contrib import admin
from .models import (
    Report, ReportTemplate, ReportData, ReportNote
)


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Admin interface for Report model."""
    
    list_display = ['name', 'report_type', 'academic_year', 'is_active', 'created_by', 'created_at']
    list_filter = ['report_type', 'academic_year', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'created_by__username']
    ordering = ['-created_at']


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    """Admin interface for ReportTemplate model."""
    
    list_display = ['name', 'template_type', 'is_active', 'created_at']
    list_filter = ['template_type', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']


@admin.register(ReportData)
class ReportDataAdmin(admin.ModelAdmin):
    """Admin interface for ReportData model."""
    
    list_display = ['report', 'data_type', 'recorded_at']
    list_filter = ['data_type', 'recorded_at']
    search_fields = ['report__name', 'data_type']
    ordering = ['-recorded_at']


@admin.register(ReportNote)
class ReportNoteAdmin(admin.ModelAdmin):
    """Admin interface for ReportNote model."""
    
    list_display = ['report', 'note_type', 'title', 'is_private', 'created_by', 'created_at']
    list_filter = ['note_type', 'is_private', 'created_at']
    search_fields = ['report__name', 'title', 'content', 'created_by__username']
    ordering = ['-created_at']
