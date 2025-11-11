"""
Models for system monitoring and logging
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import json

User = get_user_model()


class SystemMetrics(models.Model):
    """Store system performance metrics"""
    
    METRIC_TYPES = [
        ('request_count', 'Request Count'),
        ('response_time', 'Response Time'),
        ('error_count', 'Error Count'),
        ('active_users', 'Active Users'),
        ('database_queries', 'Database Queries'),
        ('memory_usage', 'Memory Usage'),
        ('cpu_usage', 'CPU Usage'),
    ]
    
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    value = models.FloatField()
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    endpoint = models.CharField(max_length=200, blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'system_metrics'
        verbose_name = 'System Metric'
        verbose_name_plural = 'System Metrics'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_type', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.metric_type}: {self.value} at {self.timestamp}"


class RequestLog(models.Model):
    """Log all API requests for monitoring"""
    
    METHOD_CHOICES = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('PATCH', 'PATCH'),
        ('DELETE', 'DELETE'),
    ]
    
    timestamp = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    path = models.CharField(max_length=500)
    query_params = models.JSONField(default=dict, blank=True)
    status_code = models.IntegerField()
    response_time = models.FloatField(help_text='Response time in milliseconds')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='request_logs')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referer = models.CharField(max_length=500, blank=True)
    request_body = models.TextField(blank=True, null=True)
    response_size = models.IntegerField(help_text='Response size in bytes', null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'request_logs'
        verbose_name = 'Request Log'
        verbose_name_plural = 'Request Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['method', '-timestamp']),
            models.Index(fields=['status_code', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.method} {self.path} - {self.status_code} ({self.response_time}ms)"


class ErrorLog(models.Model):
    """Log errors and exceptions"""
    
    ERROR_LEVELS = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=10, choices=ERROR_LEVELS, default='ERROR')
    message = models.TextField()
    exception_type = models.CharField(max_length=200, blank=True)
    traceback = models.TextField(blank=True)
    path = models.CharField(max_length=500, blank=True)
    method = models.CharField(max_length=10, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='error_logs')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_errors')
    
    class Meta:
        db_table = 'error_logs'
        verbose_name = 'Error Log'
        verbose_name_plural = 'Error Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['level', '-timestamp']),
            models.Index(fields=['resolved', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.level}: {self.message[:50]}"


class HealthCheck(models.Model):
    """Store health check results"""
    
    STATUS_CHOICES = [
        ('healthy', 'Healthy'),
        ('degraded', 'Degraded'),
        ('unhealthy', 'Unhealthy'),
    ]
    
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    database_status = models.BooleanField(default=True)
    cache_status = models.BooleanField(default=True)
    redis_status = models.BooleanField(default=True)
    disk_usage = models.FloatField(help_text='Disk usage percentage', null=True, blank=True)
    memory_usage = models.FloatField(help_text='Memory usage percentage', null=True, blank=True)
    cpu_usage = models.FloatField(help_text='CPU usage percentage', null=True, blank=True)
    response_time = models.FloatField(help_text='Health check response time in milliseconds')
    details = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'health_checks'
        verbose_name = 'Health Check'
        verbose_name_plural = 'Health Checks'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['status', '-timestamp']),
        ]
    
    def __str__(self):
        return f"Health Check: {self.status} at {self.timestamp}"


class PerformanceMetric(models.Model):
    """Store detailed performance metrics"""
    
    endpoint = models.CharField(max_length=500)
    method = models.CharField(max_length=10)
    response_time = models.FloatField(help_text='Response time in milliseconds')
    database_time = models.FloatField(help_text='Database query time in milliseconds', null=True, blank=True)
    query_count = models.IntegerField(default=0)
    cache_hits = models.IntegerField(default=0)
    cache_misses = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'performance_metrics'
        verbose_name = 'Performance Metric'
        verbose_name_plural = 'Performance Metrics'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['endpoint', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.method} {self.endpoint}: {self.response_time}ms"
