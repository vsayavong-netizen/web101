from rest_framework import serializers
from .models import ProjectFile, FileVersion, FileDownload, FileShare
from accounts.models import User
from projects.models import ProjectGroup


class ProjectFileSerializer(serializers.ModelSerializer):
    """Serializer for ProjectFile model."""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_size_human = serializers.CharField(read_only=True)
    project_id = serializers.CharField(source='project.project_id', read_only=True)
    
    class Meta:
        model = ProjectFile
        fields = [
            'id', 'project', 'project_id', 'uploaded_by', 'uploaded_by_name',
            'file_name', 'file_type', 'file_size', 'file_size_human',
            'file_path', 'mime_type', 'description', 'is_public',
            'download_count', 'checksum', 'version', 'is_latest',
            'uploaded_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'updated_at', 'download_count']


class ProjectFileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating ProjectFile."""
    
    class Meta:
        model = ProjectFile
        fields = [
            'project', 'file_name', 'file_type', 'file_size',
            'file_path', 'mime_type', 'description', 'is_public'
        ]


class ProjectFileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating ProjectFile."""
    
    class Meta:
        model = ProjectFile
        fields = [
            'file_name', 'description', 'is_public'
        ]


class FileVersionSerializer(serializers.ModelSerializer):
    """Serializer for FileVersion model."""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = FileVersion
        fields = [
            'id', 'file', 'version_number', 'file_path', 'file_size',
            'uploaded_by', 'uploaded_by_name', 'change_notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FileDownloadSerializer(serializers.ModelSerializer):
    """Serializer for FileDownload model."""
    
    downloaded_by_name = serializers.CharField(source='downloaded_by.get_full_name', read_only=True)
    file_name = serializers.CharField(source='file.file_name', read_only=True)
    
    class Meta:
        model = FileDownload
        fields = [
            'id', 'file', 'file_name', 'downloaded_by', 'downloaded_by_name',
            'ip_address', 'user_agent', 'downloaded_at'
        ]
        read_only_fields = ['id', 'downloaded_at']


class FileShareSerializer(serializers.ModelSerializer):
    """Serializer for FileShare model."""
    
    shared_by_name = serializers.CharField(source='shared_by.get_full_name', read_only=True)
    file_name = serializers.CharField(source='file.file_name', read_only=True)
    allowed_users_names = serializers.StringRelatedField(source='allowed_users', many=True, read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    is_download_limit_reached = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = FileShare
        fields = [
            'id', 'file', 'file_name', 'shared_by', 'shared_by_name',
            'share_type', 'allowed_users', 'allowed_users_names',
            'expires_at', 'password', 'download_limit', 'current_downloads',
            'is_expired', 'is_download_limit_reached',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'current_downloads']


class FileShareCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating FileShare."""
    
    class Meta:
        model = FileShare
        fields = [
            'file', 'share_type', 'allowed_users', 'expires_at',
            'password', 'download_limit'
        ]


class FileUploadSerializer(serializers.Serializer):
    """Serializer for file upload."""
    
    file = serializers.FileField()
    file_type = serializers.ChoiceField(choices=ProjectFile.FILE_TYPES)
    description = serializers.CharField(required=False, allow_blank=True)
    is_public = serializers.BooleanField(default=False)
    project_id = serializers.CharField()


class FileDownloadRequestSerializer(serializers.Serializer):
    """Serializer for file download request."""
    
    file_id = serializers.UUIDField()
    password = serializers.CharField(required=False, allow_blank=True)


class FileSearchSerializer(serializers.Serializer):
    """Serializer for file search."""
    
    query = serializers.CharField(required=False)
    file_type = serializers.ChoiceField(choices=ProjectFile.FILE_TYPES, required=False)
    project_id = serializers.CharField(required=False)
    uploaded_by = serializers.IntegerField(required=False)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    is_public = serializers.BooleanField(required=False)


class FileStatisticsSerializer(serializers.Serializer):
    """Serializer for file statistics."""
    
    total_files = serializers.IntegerField()
    total_size = serializers.IntegerField()
    files_by_type = serializers.DictField()
    files_by_project = serializers.DictField()
    recent_uploads = serializers.ListField()
    top_downloaded = serializers.ListField()
    storage_usage = serializers.DictField()
