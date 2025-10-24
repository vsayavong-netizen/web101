from django.contrib import admin
from .models import ProjectFile, FileVersion, FileDownload, FileShare


@admin.register(ProjectFile)
class ProjectFileAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'project', 'file_type', 'file_size_human', 'uploaded_by', 'uploaded_at']
    list_filter = ['file_type', 'is_public', 'uploaded_at']
    search_fields = ['file_name', 'project__project_id', 'uploaded_by__username']
    readonly_fields = ['id', 'checksum', 'download_count', 'uploaded_at', 'updated_at']
    ordering = ['-uploaded_at']
    
    fieldsets = (
        ('File Information', {
            'fields': ('id', 'project', 'uploaded_by', 'file_name', 'file_type')
        }),
        ('File Details', {
            'fields': ('file_size', 'file_path', 'mime_type', 'description', 'is_public')
        }),
        ('Metadata', {
            'fields': ('checksum', 'version', 'is_latest', 'download_count')
        }),
        ('Timestamps', {
            'fields': ('uploaded_at', 'updated_at')
        }),
    )


@admin.register(FileVersion)
class FileVersionAdmin(admin.ModelAdmin):
    list_display = ['file', 'version_number', 'file_size', 'uploaded_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['file__file_name', 'uploaded_by__username']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']


@admin.register(FileDownload)
class FileDownloadAdmin(admin.ModelAdmin):
    list_display = ['file', 'downloaded_by', 'ip_address', 'downloaded_at']
    list_filter = ['downloaded_at']
    search_fields = ['file__file_name', 'downloaded_by__username', 'ip_address']
    readonly_fields = ['id', 'downloaded_at']
    ordering = ['-downloaded_at']


@admin.register(FileShare)
class FileShareAdmin(admin.ModelAdmin):
    list_display = ['file', 'shared_by', 'share_type', 'expires_at', 'created_at']
    list_filter = ['share_type', 'created_at']
    search_fields = ['file__file_name', 'shared_by__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
