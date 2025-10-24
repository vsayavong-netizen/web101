"""
Core utility functions and helper classes for the Final Project Management system.
"""

import os
import json
import hashlib
import secrets
import string
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.core.cache import cache
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class DateTimeUtils:
    """Utility class for date and time operations."""
    
    @staticmethod
    def now():
        """Get current timezone-aware datetime."""
        return timezone.now()
    
    @staticmethod
    def today():
        """Get current date."""
        return timezone.now().date()
    
    @staticmethod
    def format_datetime(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
        """Format datetime to string."""
        return dt.strftime(format_str)
    
    @staticmethod
    def parse_datetime(date_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> datetime:
        """Parse string to datetime."""
        return datetime.strptime(date_str, format_str)
    
    @staticmethod
    def add_days(dt: datetime, days: int) -> datetime:
        """Add days to datetime."""
        return dt + timedelta(days=days)
    
    @staticmethod
    def add_months(dt: datetime, months: int) -> datetime:
        """Add months to datetime."""
        year = dt.year + (dt.month + months - 1) // 12
        month = (dt.month + months - 1) % 12 + 1
        day = min(dt.day, [31, 29 if year % 4 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
        return dt.replace(year=year, month=month, day=day)
    
    @staticmethod
    def get_academic_year(date: datetime = None) -> str:
        """Get academic year for a given date."""
        if date is None:
            date = timezone.now()
        
        if date.month >= 8:  # August or later
            return f"{date.year}-{date.year + 1}"
        else:  # Before August
            return f"{date.year - 1}-{date.year}"
    
    @staticmethod
    def get_semester(date: datetime = None) -> str:
        """Get semester for a given date."""
        if date is None:
            date = timezone.now()
        
        if date.month in [8, 9, 10, 11, 12, 1]:  # Fall semester
            return "Fall"
        elif date.month in [2, 3, 4, 5]:  # Spring semester
            return "Spring"
        else:  # Summer semester
            return "Summer"


class StringUtils:
    """Utility class for string operations."""
    
    @staticmethod
    def generate_random_string(length: int = 32) -> str:
        """Generate a random string of specified length."""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    def generate_hash(text: str, algorithm: str = 'sha256') -> str:
        """Generate hash of text using specified algorithm."""
        hash_obj = hashlib.new(algorithm)
        hash_obj.update(text.encode('utf-8'))
        return hash_obj.hexdigest()
    
    @staticmethod
    def slugify(text: str) -> str:
        """Convert text to URL-friendly slug."""
        import re
        text = text.lower()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text)
        return text.strip('-')
    
    @staticmethod
    def truncate(text: str, length: int = 100, suffix: str = '...') -> str:
        """Truncate text to specified length."""
        if len(text) <= length:
            return text
        return text[:length - len(suffix)] + suffix
    
    @staticmethod
    def extract_emails(text: str) -> List[str]:
        """Extract email addresses from text."""
        import re
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return re.findall(email_pattern, text)
    
    @staticmethod
    def is_valid_email(email: str) -> bool:
        """Check if email is valid."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None


class FileUtils:
    """Utility class for file operations."""
    
    @staticmethod
    def get_file_extension(filename: str) -> str:
        """Get file extension from filename."""
        return os.path.splitext(filename)[1].lower()
    
    @staticmethod
    def get_file_size(file_path: str) -> int:
        """Get file size in bytes."""
        return os.path.getsize(file_path)
    
    @staticmethod
    def is_allowed_file_type(filename: str, allowed_types: List[str]) -> bool:
        """Check if file type is allowed."""
        extension = FileUtils.get_file_extension(filename)
        return extension in allowed_types
    
    @staticmethod
    def generate_unique_filename(original_filename: str) -> str:
        """Generate unique filename to avoid conflicts."""
        name, ext = os.path.splitext(original_filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_string = StringUtils.generate_random_string(8)
        return f"{name}_{timestamp}_{random_string}{ext}"
    
    @staticmethod
    def get_media_url(file_path: str) -> str:
        """Get media URL for file."""
        return f"{settings.MEDIA_URL}{file_path}"
    
    @staticmethod
    def delete_file(file_path: str) -> bool:
        """Delete file from filesystem."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception as e:
            logger.error(f"Error deleting file {file_path}: {e}")
        return False


class EmailUtils:
    """Utility class for email operations."""
    
    @staticmethod
    def send_email(
        subject: str,
        message: str,
        recipient_list: List[str],
        from_email: str = None,
        html_message: str = None
    ) -> bool:
        """Send email to recipients."""
        try:
            if from_email is None:
                from_email = settings.DEFAULT_FROM_EMAIL
            
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False
            )
            return True
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    @staticmethod
    def send_template_email(
        template_name: str,
        context: Dict[str, Any],
        subject: str,
        recipient_list: List[str],
        from_email: str = None
    ) -> bool:
        """Send email using template."""
        try:
            html_message = render_to_string(f'emails/{template_name}.html', context)
            text_message = render_to_string(f'emails/{template_name}.txt', context)
            
            return EmailUtils.send_email(
                subject=subject,
                message=text_message,
                recipient_list=recipient_list,
                from_email=from_email,
                html_message=html_message
            )
        except Exception as e:
            logger.error(f"Error sending template email: {e}")
            return False
    
    @staticmethod
    def send_notification_email(user: User, notification: str) -> bool:
        """Send notification email to user."""
        subject = "New Notification"
        message = f"Hello {user.get_full_name()},\n\n{notification}\n\nBest regards,\nFinal Project Management System"
        
        return EmailUtils.send_email(
            subject=subject,
            message=message,
            recipient_list=[user.email]
        )


class CacheUtils:
    """Utility class for cache operations."""
    
    @staticmethod
    def get(key: str, default: Any = None) -> Any:
        """Get value from cache."""
        return cache.get(key, default)
    
    @staticmethod
    def set(key: str, value: Any, timeout: int = 300) -> bool:
        """Set value in cache."""
        try:
            cache.set(key, value, timeout)
            return True
        except Exception as e:
            logger.error(f"Error setting cache {key}: {e}")
            return False
    
    @staticmethod
    def delete(key: str) -> bool:
        """Delete key from cache."""
        try:
            cache.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error deleting cache {key}: {e}")
            return False
    
    @staticmethod
    def get_or_set(key: str, callable_func, timeout: int = 300) -> Any:
        """Get value from cache or set it using callable."""
        return cache.get_or_set(key, callable_func, timeout)
    
    @staticmethod
    def clear_pattern(pattern: str) -> int:
        """Clear cache keys matching pattern."""
        try:
            # This is a simplified implementation
            # In production, you might want to use Redis with pattern matching
            return 0
        except Exception as e:
            logger.error(f"Error clearing cache pattern {pattern}: {e}")
            return 0


class ValidationUtils:
    """Utility class for validation operations."""
    
    @staticmethod
    def validate_password(password: str) -> Dict[str, Any]:
        """Validate password strength."""
        result = {
            'valid': True,
            'errors': []
        }
        
        if len(password) < 8:
            result['valid'] = False
            result['errors'].append('Password must be at least 8 characters long')
        
        if not any(c.isupper() for c in password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one uppercase letter')
        
        if not any(c.islower() for c in password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one lowercase letter')
        
        if not any(c.isdigit() for c in password):
            result['valid'] = False
            result['errors'].append('Password must contain at least one digit')
        
        return result
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format."""
        return StringUtils.is_valid_email(email)
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone number format."""
        import re
        pattern = r'^\+?1?\d{9,15}$'
        return re.match(pattern, phone) is not None
    
    @staticmethod
    def validate_gpa(gpa: float) -> bool:
        """Validate GPA value."""
        return 0.0 <= gpa <= 4.0
    
    @staticmethod
    def validate_academic_year(year: str) -> bool:
        """Validate academic year format."""
        import re
        pattern = r'^\d{4}-\d{4}$'
        return re.match(pattern, year) is not None


class DataUtils:
    """Utility class for data operations."""
    
    @staticmethod
    def paginate_queryset(queryset, page: int = 1, page_size: int = 20):
        """Paginate queryset."""
        from django.core.paginator import Paginator
        
        paginator = Paginator(queryset, page_size)
        return paginator.get_page(page)
    
    @staticmethod
    def serialize_queryset(queryset, serializer_class, many: bool = True):
        """Serialize queryset using serializer."""
        serializer = serializer_class(queryset, many=many)
        return serializer.data
    
    @staticmethod
    def bulk_create_objects(model_class, data_list: List[Dict[str, Any]]) -> List[Any]:
        """Bulk create objects."""
        try:
            objects = [model_class(**data) for data in data_list]
            return model_class.objects.bulk_create(objects)
        except Exception as e:
            logger.error(f"Error bulk creating objects: {e}")
            return []
    
    @staticmethod
    def bulk_update_objects(model_class, data_list: List[Dict[str, Any]], update_fields: List[str]) -> int:
        """Bulk update objects."""
        try:
            objects = []
            for data in data_list:
                obj = model_class.objects.get(id=data['id'])
                for field in update_fields:
                    if field in data:
                        setattr(obj, field, data[field])
                objects.append(obj)
            
            return model_class.objects.bulk_update(objects, update_fields)
        except Exception as e:
            logger.error(f"Error bulk updating objects: {e}")
            return 0
    
    @staticmethod
    def export_to_csv(queryset, fields: List[str], filename: str) -> str:
        """Export queryset to CSV file."""
        import csv
        
        file_path = os.path.join(settings.MEDIA_ROOT, 'exports', filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fields)
            writer.writeheader()
            
            for obj in queryset:
                row = {}
                for field in fields:
                    if hasattr(obj, field):
                        value = getattr(obj, field)
                        if hasattr(value, 'strftime'):  # datetime object
                            row[field] = value.strftime('%Y-%m-%d %H:%M:%S')
                        else:
                            row[field] = str(value)
                    else:
                        row[field] = ''
                writer.writerow(row)
        
        return file_path


class SecurityUtils:
    """Utility class for security operations."""
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate secure random token."""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using Django's password hasher."""
        from django.contrib.auth.hashers import make_password
        return make_password(password)
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify password against hash."""
        from django.contrib.auth.hashers import check_password
        return check_password(password, hashed)
    
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitize user input."""
        import html
        return html.escape(text)
    
    @staticmethod
    def generate_api_key() -> str:
        """Generate API key."""
        return f"api_{StringUtils.generate_random_string(32)}"
    
    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """Validate API key format."""
        return api_key.startswith('api_') and len(api_key) > 35


class NotificationUtils:
    """Utility class for notification operations."""
    
    @staticmethod
    def create_notification(
        user: User,
        title: str,
        message: str,
        notification_type: str = 'info',
        is_read: bool = False
    ) -> bool:
        """Create notification for user."""
        try:
            from notifications.models import Notification
            
            Notification.objects.create(
                recipient_id=str(user.id),
                recipient_type='user',
                title=title,
                message=message,
                notification_type=notification_type,
                is_read=is_read
            )
            return True
        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            return False
    
    @staticmethod
    def send_bulk_notification(
        users: List[User],
        title: str,
        message: str,
        notification_type: str = 'info'
    ) -> int:
        """Send notification to multiple users."""
        try:
            from notifications.models import Notification
            
            notifications = []
            for user in users:
                notifications.append(Notification(
                    recipient_id=str(user.id),
                    recipient_type='user',
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    is_read=False
                ))
            
            return len(Notification.objects.bulk_create(notifications))
        except Exception as e:
            logger.error(f"Error sending bulk notification: {e}")
            return 0
    
    @staticmethod
    def mark_notifications_read(user: User, notification_ids: List[int] = None) -> int:
        """Mark notifications as read."""
        try:
            from notifications.models import Notification
            
            queryset = Notification.objects.filter(recipient_id=str(user.id), is_read=False)
            if notification_ids:
                queryset = queryset.filter(id__in=notification_ids)
            
            return queryset.update(is_read=True)
        except Exception as e:
            logger.error(f"Error marking notifications as read: {e}")
            return 0


class AnalyticsUtils:
    """Utility class for analytics operations."""
    
    @staticmethod
    def track_event(
        event_name: str,
        user: User = None,
        metadata: Dict[str, Any] = None
    ) -> bool:
        """Track analytics event."""
        try:
            from analytics.models import AnalyticsMetric
            
            AnalyticsMetric.objects.create(
                metric_name=event_name,
                value=1,
                recorded_at=timezone.now(),
                description={
                    'user_id': user.id if user else None,
                    'user_role': user.role if user else None,
                    **(metadata or {})
                }
            )
            return True
        except Exception as e:
            logger.error(f"Error tracking event: {e}")
            return False
    
    @staticmethod
    def get_user_activity(user: User, days: int = 30) -> Dict[str, Any]:
        """Get user activity for specified days."""
        try:
            from analytics.models import AnalyticsMetric
            
            start_date = timezone.now() - timedelta(days=days)
            metrics = AnalyticsMetric.objects.filter(
                timestamp__gte=start_date,
                metadata__user_id=user.id
            )
            
            return {
                'total_events': metrics.count(),
                'events_by_type': metrics.values('name').annotate(count=models.Count('id')),
                'recent_activity': metrics.order_by('-timestamp')[:10]
            }
        except Exception as e:
            logger.error(f"Error getting user activity: {e}")
            return {}


class SystemUtils:
    """Utility class for system operations."""
    
    @staticmethod
    def get_system_info() -> Dict[str, Any]:
        """Get system information."""
        return {
            'django_version': settings.DATABASES['default']['ENGINE'],
            'python_version': f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
            'debug_mode': settings.DEBUG,
            'timezone': str(timezone.get_current_timezone()),
            'current_time': timezone.now().isoformat(),
        }
    
    @staticmethod
    def check_database_connection() -> bool:
        """Check database connection."""
        try:
            from django.db import connection
            connection.ensure_connection()
            return True
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return False
    
    @staticmethod
    def get_database_stats() -> Dict[str, Any]:
        """Get database statistics."""
        try:
            from django.db import connection
            
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
                table_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()))")
                db_size = cursor.fetchone()[0]
            
            return {
                'table_count': table_count,
                'database_size': db_size,
                'connection_status': 'connected'
            }
        except Exception as e:
            logger.error(f"Error getting database stats: {e}")
            return {'connection_status': 'error', 'error': str(e)}
