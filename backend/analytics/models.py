from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class AnalyticsDashboard(models.Model):
    """Analytics dashboard configuration."""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    dashboard_type = models.CharField(max_length=50, default='general')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_analytics_dashboards')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_dashboards'
        verbose_name = 'Analytics Dashboard'
        verbose_name_plural = 'Analytics Dashboards'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class AnalyticsReport(models.Model):
    """Analytics report configuration."""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    report_type = models.CharField(max_length=50, default='general')
    academic_year = models.CharField(max_length=10, default='2024-2025')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_analytics_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_reports'
        verbose_name = 'Analytics Report'
        verbose_name_plural = 'Analytics Reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class AnalyticsMetric(models.Model):
    """Analytics metric data."""
    
    metric_name = models.CharField(max_length=200)
    metric_type = models.CharField(max_length=50, default='general')
    value = models.FloatField()
    academic_year = models.CharField(max_length=10, default='2024-2025')
    description = models.TextField(blank=True, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'analytics_metrics'
        verbose_name = 'Analytics Metric'
        verbose_name_plural = 'Analytics Metrics'
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.metric_name}: {self.value}"


class AnalyticsNote(models.Model):
    """Notes and comments about analytics."""
    
    NOTE_TYPES = [
        ('insight', 'Insight'),
        ('recommendation', 'Recommendation'),
        ('general', 'General Note'),
    ]
    
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'analytics_notes'
        verbose_name = 'Analytics Note'
        verbose_name_plural = 'Analytics Notes'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
