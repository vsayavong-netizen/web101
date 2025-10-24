from django.contrib import admin
from .models import (
    AnalyticsDashboard, AnalyticsReport, AnalyticsMetric, AnalyticsNote
)


@admin.register(AnalyticsDashboard)
class AnalyticsDashboardAdmin(admin.ModelAdmin):
    """Admin interface for AnalyticsDashboard model."""
    
    list_display = ['name', 'dashboard_type', 'is_active', 'created_by', 'created_at']
    list_filter = ['dashboard_type', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'created_by__username']
    ordering = ['name']


@admin.register(AnalyticsReport)
class AnalyticsReportAdmin(admin.ModelAdmin):
    """Admin interface for AnalyticsReport model."""
    
    list_display = ['name', 'report_type', 'academic_year', 'is_active', 'created_by', 'created_at']
    list_filter = ['report_type', 'academic_year', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'created_by__username']
    ordering = ['-created_at']


@admin.register(AnalyticsMetric)
class AnalyticsMetricAdmin(admin.ModelAdmin):
    """Admin interface for AnalyticsMetric model."""
    
    list_display = ['metric_name', 'metric_type', 'value', 'academic_year', 'recorded_at']
    list_filter = ['metric_type', 'academic_year', 'recorded_at']
    search_fields = ['metric_name', 'description']
    ordering = ['-recorded_at']


@admin.register(AnalyticsNote)
class AnalyticsNoteAdmin(admin.ModelAdmin):
    """Admin interface for AnalyticsNote model."""
    
    list_display = ['note_type', 'title', 'is_private', 'created_by', 'created_at']
    list_filter = ['note_type', 'is_private', 'created_at']
    search_fields = ['title', 'content', 'created_by__username']
    ordering = ['-created_at']
