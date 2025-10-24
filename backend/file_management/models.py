from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
import uuid
import os

User = get_user_model()


def get_upload_path(instance, filename):
    """Generate upload path for files."""
    return f"uploads/{instance.project_id}/{instance.file_type}/{filename}"


class ProjectFile(models.Model):
    """Project file model for file uploads."""
    
    FILE_TYPES = [
        ('milestone', 'Milestone Submission'),
        ('pre_defense', 'Pre-Defense File'),
        ('post_defense', 'Post-Defense File'),
        ('final_report', 'Final Report'),
        ('presentation', 'Presentation'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, related_name='file_management_files')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, choices=FILE_TYPES)
    file_size = models.BigIntegerField()
    file_path = models.CharField(max_length=500)
    mime_type = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    download_count = models.IntegerField(default=0)
    
    # File metadata
    checksum = models.CharField(max_length=64, blank=True, null=True)
    version = models.IntegerField(default=1)
    is_latest = models.BooleanField(default=True)
    
    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'file_management_project_files'
        verbose_name = 'Project File'
        verbose_name_plural = 'Project Files'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['project', 'file_type']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.project.project_id} - {self.file_name}"
    
    @property
    def file_size_human(self):
        """Return human readable file size."""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024.0:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024.0
        return f"{self.file_size:.1f} TB"


class FileVersion(models.Model):
    """File version history."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(ProjectFile, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    change_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'file_versions'
        verbose_name = 'File Version'
        verbose_name_plural = 'File Versions'
        ordering = ['-created_at']
        unique_together = ['file', 'version_number']
    
    def __str__(self):
        return f"{self.file.file_name} v{self.version_number}"


class FileDownload(models.Model):
    """File download tracking."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(ProjectFile, on_delete=models.CASCADE, related_name='downloads')
    downloaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='file_downloads')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    
    # Timestamps
    downloaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'file_downloads'
        verbose_name = 'File Download'
        verbose_name_plural = 'File Downloads'
        ordering = ['-downloaded_at']
    
    def __str__(self):
        return f"{self.file.file_name} - {self.downloaded_by.get_full_name()}"


class FileShare(models.Model):
    """File sharing permissions."""
    
    SHARE_TYPES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('restricted', 'Restricted'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(ProjectFile, on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_files')
    share_type = models.CharField(max_length=20, choices=SHARE_TYPES, default='private')
    allowed_users = models.ManyToManyField(User, related_name='shared_file_access', blank=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    password = models.CharField(max_length=100, blank=True, null=True)
    download_limit = models.IntegerField(blank=True, null=True)
    current_downloads = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'file_shares'
        verbose_name = 'File Share'
        verbose_name_plural = 'File Shares'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.file.file_name} - {self.share_type}"
    
    @property
    def is_expired(self):
        """Check if share is expired."""
        if self.expires_at:
            return self.expires_at < models.DateTimeField(auto_now=True).auto_now
        return False
    
    @property
    def is_download_limit_reached(self):
        """Check if download limit is reached."""
        if self.download_limit:
            return self.current_downloads >= self.download_limit
        return False
