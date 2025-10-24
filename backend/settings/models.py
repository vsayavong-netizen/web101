from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class SystemSettings(models.Model):
    """System-wide settings configuration."""
    
    setting_name = models.CharField(max_length=200, unique=True)
    setting_value = models.TextField()
    setting_type = models.CharField(max_length=50, default='string')
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'
        ordering = ['setting_name']
    
    def __str__(self):
        return self.setting_name


class AcademicYear(models.Model):
    """Academic year configuration."""
    
    year = models.CharField(max_length=10, unique=True)  # e.g., "2024-2025"
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'academic_years'
        verbose_name = 'Academic Year'
        verbose_name_plural = 'Academic Years'
        ordering = ['-year']
    
    def __str__(self):
        return self.year


class SystemLog(models.Model):
    """System logging for audit and debugging."""
    
    LOG_LEVELS = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    ]
    
    log_level = models.CharField(max_length=10, choices=LOG_LEVELS, default='INFO')
    message = models.TextField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='system_logs')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'system_logs'
        verbose_name = 'System Log'
        verbose_name_plural = 'System Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.log_level}: {self.message[:50]}"


class SystemNote(models.Model):
    """System-wide notes and documentation."""
    
    NOTE_TYPES = [
        ('documentation', 'Documentation'),
        ('maintenance', 'Maintenance Note'),
        ('general', 'General Note'),
    ]
    
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='system_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_notes'
        verbose_name = 'System Note'
        verbose_name_plural = 'System Notes'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
