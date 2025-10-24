"""
Project-specific middleware for project management and tracking.
"""

import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.utils import timezone
from django.core.cache import cache

logger = logging.getLogger(__name__)


class ProjectAccessMiddleware(MiddlewareMixin):
    """
    Middleware for checking project access permissions.
    """
    
    def process_request(self, request):
        """Check project access permissions."""
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Check if user is accessing a specific project
        if '/api/projects/' in request.path and request.method in ['GET', 'PUT', 'PATCH', 'DELETE']:
            # Extract project ID from URL
            path_parts = request.path.split('/')
            if len(path_parts) >= 4 and path_parts[3].isdigit():
                project_id = int(path_parts[3])
                if not self.has_project_access(request.user, project_id):
                    return JsonResponse({
                        'error': 'Access denied',
                        'message': 'You do not have access to this project'
                    }, status=403)
        
        return None
    
    def has_project_access(self, user, project_id):
        """Check if user has access to the project."""
        try:
            from .models import ProjectGroup
            
            project = ProjectGroup.objects.get(id=project_id)
            
            # Admins and department admins have access to all projects
            if user.role in ['Admin', 'DepartmentAdmin']:
                return True
            
            # Advisors have access to their assigned projects
            if user.role == 'Advisor' and project.advisor == user:
                return True
            
            # Students have access to their own projects
            if user.role == 'Student':
                return project.students.filter(user=user).exists()
            
            return False
            
        except ProjectGroup.DoesNotExist:
            return False


class ProjectActivityMiddleware(MiddlewareMixin):
    """
    Middleware for tracking project-related activity.
    """
    
    def process_request(self, request):
        """Track project activity."""
        if hasattr(request, 'user') and request.user.is_authenticated:
            if '/api/projects/' in request.path:
                self.track_project_activity(request)
    
    def track_project_activity(self, request):
        """Track project activity for analytics."""
        try:
            from analytics.models import AnalyticsMetric
            
            # Extract project ID from URL
            path_parts = request.path.split('/')
            project_id = None
            if len(path_parts) >= 4 and path_parts[3].isdigit():
                project_id = int(path_parts[3])
            
            AnalyticsMetric.objects.create(
                metric_name='project_activity',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'path': request.path,
                    'method': request.method,
                    'user_id': request.user.id,
                    'user_role': request.user.role,
                    'project_id': project_id,
                }
            )
        except Exception as e:
            logger.warning(f"Could not track project activity: {e}")


class ProjectStatusMiddleware(MiddlewareMixin):
    """
    Middleware for checking project status and enforcing business rules.
    """
    
    def process_request(self, request):
        """Check project status before allowing modifications."""
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Check if user is modifying a project
        if '/api/projects/' in request.path and request.method in ['PUT', 'PATCH', 'DELETE']:
            path_parts = request.path.split('/')
            if len(path_parts) >= 4 and path_parts[3].isdigit():
                project_id = int(path_parts[3])
                if not self.can_modify_project(request.user, project_id):
                    return JsonResponse({
                        'error': 'Project modification not allowed',
                        'message': 'This project cannot be modified in its current status'
                    }, status=400)
        
        return None
    
    def can_modify_project(self, user, project_id):
        """Check if project can be modified."""
        try:
            from .models import ProjectGroup
            
            project = ProjectGroup.objects.get(id=project_id)
            
            # Completed projects cannot be modified
            if project.status == 'completed':
                return False
            
            # Only admins can modify archived projects
            if project.status == 'archived' and user.role not in ['Admin', 'DepartmentAdmin']:
                return False
            
            return True
            
        except ProjectGroup.DoesNotExist:
            return False
