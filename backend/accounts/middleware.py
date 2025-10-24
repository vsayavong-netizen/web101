"""
Account-specific middleware for user management and authentication.
"""

import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache

User = get_user_model()
logger = logging.getLogger(__name__)


class UserSessionMiddleware(MiddlewareMixin):
    """
    Middleware for tracking user sessions and activity.
    """
    
    def process_request(self, request):
        """Track user session activity."""
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Update user session
            session_key = request.session.session_key
            if session_key:
                cache_key = f'user_session_{request.user.id}_{session_key}'
                session_data = cache.get(cache_key, {})
                session_data.update({
                    'last_activity': timezone.now().isoformat(),
                    'ip_address': self.get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown'),
                    'path': request.path,
                })
                cache.set(cache_key, session_data, 3600)  # 1 hour
    
    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserPermissionMiddleware(MiddlewareMixin):
    """
    Middleware for checking user permissions and role-based access.
    """
    
    def process_request(self, request):
        """Check user permissions for specific endpoints."""
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Define role-based access patterns
        admin_only_paths = [
            '/api/accounts/users/',
            '/api/students/statistics/',
            '/api/projects/statistics/',
            '/api/advisors/statistics/',
        ]
        
        advisor_only_paths = [
            '/api/students/',
            '/api/projects/',
        ]
        
        # Check admin access
        if any(request.path.startswith(path) for path in admin_only_paths):
            if request.user.role not in ['Admin', 'DepartmentAdmin']:
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'Admin privileges required'
                }, status=403)
        
        # Check advisor access
        if any(request.path.startswith(path) for path in advisor_only_paths):
            if request.user.role not in ['Admin', 'DepartmentAdmin', 'Advisor']:
                return JsonResponse({
                    'error': 'Access denied',
                    'message': 'Advisor privileges required'
                }, status=403)
        
        return None


class UserActivityMiddleware(MiddlewareMixin):
    """
    Middleware for tracking user activity and generating analytics.
    """
    
    def process_request(self, request):
        """Track user activity for analytics."""
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Track page views
            if request.method == 'GET':
                self.track_page_view(request)
            
            # Track API calls
            if request.path.startswith('/api/'):
                self.track_api_call(request)
    
    def track_page_view(self, request):
        """Track page view for analytics."""
        try:
            from analytics.models import AnalyticsMetric
            
            AnalyticsMetric.objects.create(
                metric_name='page_view',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'path': request.path,
                    'user_id': request.user.id,
                    'user_role': request.user.role,
                }
            )
        except Exception as e:
            logger.warning(f"Could not track page view: {e}")
    
    def track_api_call(self, request):
        """Track API call for analytics."""
        try:
            from analytics.models import AnalyticsMetric
            
            AnalyticsMetric.objects.create(
                metric_name='api_call',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'path': request.path,
                    'method': request.method,
                    'user_id': request.user.id,
                    'user_role': request.user.role,
                }
            )
        except Exception as e:
            logger.warning(f"Could not track API call: {e}")


class UserNotificationMiddleware(MiddlewareMixin):
    """
    Middleware for handling user notifications and alerts.
    """
    
    def process_response(self, request, response):
        """Add notification data to response."""
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                from notifications.models import Notification
                
                # Get unread notifications
                unread_notifications = Notification.objects.filter(
                    user=request.user,
                    is_read=False
                ).count()
                
                # Add notification count to response headers
                response['X-Unread-Notifications'] = str(unread_notifications)
                
            except Exception as e:
                logger.warning(f"Could not get notifications: {e}")
        
        return response
