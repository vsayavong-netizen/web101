from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Report(models.Model):
    """Report configuration and metadata."""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    report_type = models.CharField(max_length=50, default='general')
    academic_year = models.CharField(max_length=10, default='2024-2025')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reports'
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class ReportTemplate(models.Model):
    """Report template configuration."""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    template_type = models.CharField(max_length=50, default='general')
    template_content = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'report_templates'
        verbose_name = 'Report Template'
        verbose_name_plural = 'Report Templates'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ReportData(models.Model):
    """Report data storage."""
    
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='data')
    data_type = models.CharField(max_length=50, default='general')
    data_content = models.JSONField()
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'report_data'
        verbose_name = 'Report Data'
        verbose_name_plural = 'Report Data'
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.report.name} - {self.data_type}"


class ReportNote(models.Model):
    """Notes and comments about reports."""
    
    NOTE_TYPES = [
        ('comment', 'Comment'),
        ('review', 'Review'),
        ('general', 'General Note'),
    ]
    
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='notes')
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='report_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'report_notes'
        verbose_name = 'Report Note'
        verbose_name_plural = 'Report Notes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.report.name} - {self.title}"
