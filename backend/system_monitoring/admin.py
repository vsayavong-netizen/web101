"""
Admin interface for system monitoring
"""
from django.contrib import admin
from .models import (
    SystemMetrics, RequestLog, ErrorLog, HealthCheck, PerformanceMetric
)


@admin.register(SystemMetrics)
class SystemMetricsAdmin(admin.ModelAdmin):
    list_display = ['metric_type', 'value', 'endpoint', 'user', 'timestamp']
    list_filter = ['metric_type', 'timestamp']
    search_fields = ['endpoint', 'user__username']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(RequestLog)
class RequestLogAdmin(admin.ModelAdmin):
    list_display = ['method', 'path', 'status_code', 'response_time', 'user', 'timestamp']
    list_filter = ['method', 'status_code', 'timestamp']
    search_fields = ['path', 'ip_address', 'user__username']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(ErrorLog)
class ErrorLogAdmin(admin.ModelAdmin):
    list_display = ['level', 'message', 'exception_type', 'resolved', 'user', 'timestamp']
    list_filter = ['level', 'resolved', 'timestamp']
    search_fields = ['message', 'exception_type', 'path', 'user__username']
    readonly_fields = ['timestamp', 'resolved_at']
    date_hierarchy = 'timestamp'
    actions = ['mark_as_resolved']
    
    def mark_as_resolved(self, request, queryset):
        queryset.update(resolved=True, resolved_by=request.user)
    mark_as_resolved.short_description = "Mark selected errors as resolved"


@admin.register(HealthCheck)
class HealthCheckAdmin(admin.ModelAdmin):
    list_display = ['status', 'database_status', 'cache_status', 'redis_status', 'timestamp']
    list_filter = ['status', 'timestamp']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(PerformanceMetric)
class PerformanceMetricAdmin(admin.ModelAdmin):
    list_display = ['endpoint', 'method', 'response_time', 'database_time', 'query_count', 'timestamp']
    list_filter = ['method', 'timestamp']
    search_fields = ['endpoint']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
