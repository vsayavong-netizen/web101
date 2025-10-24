"""
Student-specific middleware for student management and tracking.
"""

import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.utils import timezone
from django.core.cache import cache

logger = logging.getLogger(__name__)


class StudentAccessMiddleware(MiddlewareMixin):
    """
    Middleware for checking student access permissions.
    """
    
    def process_request(self, request):
        """Check student access permissions."""
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Check if user is accessing student data
        if '/api/students/' in request.path and request.method in ['GET', 'PUT', 'PATCH', 'DELETE']:
            # Extract student ID from URL
            path_parts = request.path.split('/')
            if len(path_parts) >= 4 and path_parts[3].isdigit():
                student_id = int(path_parts[3])
                if not self.has_student_access(request.user, student_id):
                    return JsonResponse({
                        'error': 'Access denied',
                        'message': 'You do not have access to this student data'
                    }, status=403)
        
        return None
    
    def has_student_access(self, user, student_id):
        """Check if user has access to student data."""
        try:
            from .models import Student
            
            student = Student.objects.get(id=student_id)
            
            # Admins and department admins have access to all students
            if user.role in ['Admin', 'DepartmentAdmin']:
                return True
            
            # Advisors have access to their assigned students
            if user.role == 'Advisor':
                # This would typically check if the advisor is assigned to the student
                # For now, allow all advisors to see all students
                return True
            
            # Students can only see their own data
            if user.role == 'Student' and student.user == user:
                return True
            
            return False
            
        except Student.DoesNotExist:
            return False


class StudentActivityMiddleware(MiddlewareMixin):
    """
    Middleware for tracking student-related activity.
    """
    
    def process_request(self, request):
        """Track student activity."""
        if hasattr(request, 'user') and request.user.is_authenticated:
            if '/api/students/' in request.path:
                self.track_student_activity(request)
    
    def track_student_activity(self, request):
        """Track student activity for analytics."""
        try:
            from analytics.models import AnalyticsMetric
            
            # Extract student ID from URL
            path_parts = request.path.split('/')
            student_id = None
            if len(path_parts) >= 4 and path_parts[3].isdigit():
                student_id = int(path_parts[3])
            
            AnalyticsMetric.objects.create(
                metric_name='student_activity',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'path': request.path,
                    'method': request.method,
                    'user_id': request.user.id,
                    'user_role': request.user.role,
                    'student_id': student_id,
                }
            )
        except Exception as e:
            logger.warning(f"Could not track student activity: {e}")


class StudentProgressMiddleware(MiddlewareMixin):
    """
    Middleware for tracking student progress and generating alerts.
    """
    
    def process_response(self, request, response):
        """Check student progress and generate alerts."""
        if hasattr(request, 'user') and request.user.is_authenticated:
            if '/api/students/' in request.path and request.method == 'GET':
                self.check_student_progress(request)
        
        return response
    
    def check_student_progress(self, request):
        """Check student progress and generate alerts if needed."""
        try:
            from .models import Student
            
            # Extract student ID from URL
            path_parts = request.path.split('/')
            if len(path_parts) >= 4 and path_parts[3].isdigit():
                student_id = int(path_parts[3])
                student = Student.objects.get(id=student_id)
                
                # Check if student is behind on progress
                if student.progress_percentage < 50:  # Less than 50% progress
                    self.generate_progress_alert(student)
                
                # Check if student has low GPA
                if student.gpa < 2.5:  # GPA below 2.5
                    self.generate_gpa_alert(student)
                
        except Student.DoesNotExist:
            pass
        except Exception as e:
            logger.warning(f"Could not check student progress: {e}")
    
    def generate_progress_alert(self, student):
        """Generate progress alert for student."""
        try:
            from notifications.models import Notification
            
            Notification.objects.create(
                user=student.user,
                title='Progress Alert',
                message=f'Your academic progress is below 50%. Please contact your advisor.',
                notification_type='warning',
                is_read=False
            )
        except Exception as e:
            logger.warning(f"Could not generate progress alert: {e}")
    
    def generate_gpa_alert(self, student):
        """Generate GPA alert for student."""
        try:
            from notifications.models import Notification
            
            Notification.objects.create(
                user=student.user,
                title='GPA Alert',
                message=f'Your GPA is below 2.5. Please contact your advisor for academic support.',
                notification_type='warning',
                is_read=False
            )
        except Exception as e:
            logger.warning(f"Could not generate GPA alert: {e}")
