from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django.db.models import Q, Count, Sum
from django.utils import timezone
import os
import hashlib
from .models import ProjectFile, FileVersion, FileDownload, FileShare
from .serializers import (
    ProjectFileSerializer, ProjectFileCreateSerializer, ProjectFileUpdateSerializer,
    FileVersionSerializer, FileDownloadSerializer, FileShareSerializer,
    FileShareCreateSerializer, FileUploadSerializer, FileDownloadRequestSerializer,
    FileSearchSerializer, FileStatisticsSerializer
)
from projects.models import ProjectGroup
from accounts.models import User


class ProjectFileListView(generics.ListCreateAPIView):
    """List and create project files."""
    
    serializer_class = ProjectFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = ProjectFile.objects.select_related('project', 'uploaded_by')
        
        # Filter by project if provided
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project__project_id=project_id)
        
        # Filter by file type if provided
        file_type = self.request.query_params.get('file_type')
        if file_type:
            queryset = queryset.filter(file_type=file_type)
        
        # Filter by user if provided
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(uploaded_by_id=user_id)
        
        # Search by file name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(file_name__icontains=search)
        
        return queryset.order_by('-uploaded_at')


class ProjectFileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a project file."""
    
    serializer_class = ProjectFileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ProjectFile.objects.select_related('project', 'uploaded_by')


class FileVersionListView(generics.ListAPIView):
    """List file versions."""
    
    serializer_class = FileVersionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        file_id = self.kwargs['file_id']
        return FileVersion.objects.filter(file_id=file_id).select_related('uploaded_by')


class FileDownloadListView(generics.ListAPIView):
    """List file downloads."""
    
    serializer_class = FileDownloadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        file_id = self.kwargs['file_id']
        return FileDownload.objects.filter(file_id=file_id).select_related('downloaded_by')


class FileShareListView(generics.ListCreateAPIView):
    """List and create file shares."""
    
    serializer_class = FileShareSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        file_id = self.kwargs['file_id']
        return FileShare.objects.filter(file_id=file_id).select_related('shared_by', 'file')


class FileShareDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a file share."""
    
    serializer_class = FileShareSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return FileShare.objects.select_related('shared_by', 'file')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_file(request):
    """Upload a file to a project."""
    serializer = FileUploadSerializer(data=request.data)
    if serializer.is_valid():
        file = serializer.validated_data['file']
        file_type = serializer.validated_data['file_type']
        description = serializer.validated_data.get('description', '')
        is_public = serializer.validated_data.get('is_public', False)
        project_id = serializer.validated_data['project_id']
        
        try:
            project = ProjectGroup.objects.get(project_id=project_id)
        except ProjectGroup.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate file path
        file_path = f"uploads/{project_id}/{file_type}/{file.name}"
        
        # Calculate file size and checksum
        file_size = file.size
        file.seek(0)
        file_content = file.read()
        checksum = hashlib.sha256(file_content).hexdigest()
        
        # Create project file
        project_file = ProjectFile.objects.create(
            project=project,
            uploaded_by=request.user,
            file_name=file.name,
            file_type=file_type,
            file_size=file_size,
            file_path=file_path,
            mime_type=file.content_type,
            description=description,
            is_public=is_public,
            checksum=checksum
        )
        
        # Save file to disk
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        return Response(ProjectFileSerializer(project_file).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_file(request, file_id):
    """Download a file."""
    try:
        project_file = ProjectFile.objects.get(id=file_id)
    except ProjectFile.DoesNotExist:
        raise Http404("File not found")
    
    # Check permissions
    if not project_file.is_public and project_file.uploaded_by != request.user:
        # Check if user has access to the project
        if not project_file.project.students.filter(id=request.user.id).exists():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Track download
    FileDownload.objects.create(
        file=project_file,
        downloaded_by=request.user,
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT')
    )
    
    # Update download count
    project_file.download_count += 1
    project_file.save()
    
    # Return file
    if os.path.exists(project_file.file_path):
        return FileResponse(
            open(project_file.file_path, 'rb'),
            as_attachment=True,
            filename=project_file.file_name
        )
    else:
        return Response({'error': 'File not found on disk'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def search_files(request):
    """Search files."""
    serializer = FileSearchSerializer(data=request.data)
    if serializer.is_valid():
        queryset = ProjectFile.objects.select_related('project', 'uploaded_by')
        
        # Apply filters
        if serializer.validated_data.get('query'):
            queryset = queryset.filter(file_name__icontains=serializer.validated_data['query'])
        
        if serializer.validated_data.get('file_type'):
            queryset = queryset.filter(file_type=serializer.validated_data['file_type'])
        
        if serializer.validated_data.get('project_id'):
            queryset = queryset.filter(project__project_id=serializer.validated_data['project_id'])
        
        if serializer.validated_data.get('uploaded_by'):
            queryset = queryset.filter(uploaded_by_id=serializer.validated_data['uploaded_by'])
        
        if serializer.validated_data.get('is_public') is not None:
            queryset = queryset.filter(is_public=serializer.validated_data['is_public'])
        
        # Date filters
        if serializer.validated_data.get('date_from'):
            queryset = queryset.filter(uploaded_at__gte=serializer.validated_data['date_from'])
        
        if serializer.validated_data.get('date_to'):
            queryset = queryset.filter(uploaded_at__lte=serializer.validated_data['date_to'])
        
        # Order by upload date
        queryset = queryset.order_by('-uploaded_at')
        
        return Response(ProjectFileSerializer(queryset, many=True).data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def file_statistics(request):
    """Get file statistics."""
    # Total files and size
    total_files = ProjectFile.objects.count()
    total_size = ProjectFile.objects.aggregate(Sum('file_size'))['file_size__sum'] or 0
    
    # Files by type
    files_by_type = ProjectFile.objects.values('file_type').annotate(count=Count('id'))
    files_by_type = {item['file_type']: item['count'] for item in files_by_type}
    
    # Files by project
    files_by_project = ProjectFile.objects.values('project__project_id').annotate(count=Count('id'))
    files_by_project = {item['project__project_id']: item['count'] for item in files_by_project}
    
    # Recent uploads
    recent_uploads = ProjectFile.objects.select_related('project', 'uploaded_by').order_by('-uploaded_at')[:10]
    recent_uploads = ProjectFileSerializer(recent_uploads, many=True).data
    
    # Top downloaded files
    top_downloaded = ProjectFile.objects.order_by('-download_count')[:10]
    top_downloaded = ProjectFileSerializer(top_downloaded, many=True).data
    
    # Storage usage
    storage_usage = {
        'total_size': total_size,
        'total_size_human': f"{total_size / (1024**3):.2f} GB",
        'files_count': total_files,
        'average_file_size': total_size / total_files if total_files > 0 else 0
    }
    
    statistics = {
        'total_files': total_files,
        'total_size': total_size,
        'files_by_type': files_by_type,
        'files_by_project': files_by_project,
        'recent_uploads': recent_uploads,
        'top_downloaded': top_downloaded,
        'storage_usage': storage_usage
    }
    
    return Response(statistics)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_file_share(request):
    """Create a file share."""
    serializer = FileShareCreateSerializer(data=request.data)
    if serializer.is_valid():
        file_share = serializer.save(shared_by=request.user)
        return Response(FileShareSerializer(file_share).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_file(request, file_id):
    """Delete a file."""
    try:
        project_file = ProjectFile.objects.get(id=file_id)
    except ProjectFile.DoesNotExist:
        return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check permissions
    if project_file.uploaded_by != request.user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Delete file from disk
    if os.path.exists(project_file.file_path):
        os.remove(project_file.file_path)
    
    # Delete database record
    project_file.delete()
    
    return Response({'message': 'File deleted successfully'}, status=status.HTTP_200_OK)
