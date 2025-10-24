"""
Core application signals for automated workflows.
"""

import logging
from django.db.models.signals import post_save, pre_save, post_delete, pre_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """Handle user creation and updates."""
    if created:
        logger.info(f"New user created: {instance.username}")
        
        # Send welcome email
        try:
            from final_project_management.utils import EmailUtils
            EmailUtils.send_notification_email(
                instance,
                f"Welcome to the Final Project Management System! Your account has been created successfully."
            )
        except Exception as e:
            logger.error(f"Error sending welcome email: {e}")
        
        # User profile creation removed as Profile model doesn't exist
    
    else:
        logger.info(f"User updated: {instance.username}")
        
        # Log user updates
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='user_updated',
                value=1,
                description=f"User updated: {instance.username} ({instance.role})"
            )
        except Exception as e:
            logger.error(f"Error logging user update: {e}")


@receiver(pre_save, sender=User)
def user_pre_save(sender, instance, **kwargs):
    """Handle user before save operations."""
    if instance.pk:
        try:
            old_instance = User.objects.get(pk=instance.pk)
            
            # Check if role changed
            if old_instance.role != instance.role:
                logger.info(f"User role changed: {instance.username} from {old_instance.role} to {instance.role}")
                
                # Log role change
                try:
                    from analytics.models import AnalyticsMetric
                    AnalyticsMetric.objects.create(
                        metric_name='user_role_changed',
                        value=1,
                        recorded_at=timezone.now(),
                        description={
                            'user_id': instance.id,
                            'old_role': old_instance.role,
                            'new_role': instance.role
                        }
                    )
                except Exception as e:
                    logger.error(f"Error logging role change: {e}")
            
            # Check if user was activated/deactivated
            if old_instance.is_active != instance.is_active:
                if instance.is_active:
                    logger.info(f"User activated: {instance.username}")
                else:
                    logger.info(f"User deactivated: {instance.username}")
                    
                    # Terminate all user sessions
                    try:
                        from accounts.models import UserSession
                        UserSession.objects.filter(user=instance, is_active=True).update(is_active=False)
                    except Exception as e:
                        logger.error(f"Error terminating user sessions: {e}")
        
        except User.DoesNotExist:
            pass


@receiver(post_delete, sender=User)
def user_post_delete(sender, instance, **kwargs):
    """Handle user deletion."""
    logger.info(f"User deleted: {instance.username}")
    
    # Log user deletion
    try:
        from analytics.models import AnalyticsMetric
        AnalyticsMetric.objects.create(
            metric_name='user_deleted',
            value=1,
            recorded_at=timezone.now(),
            description={
                'username': instance.username,
                'role': instance.role
            }
        )
    except Exception as e:
        logger.error(f"Error logging user deletion: {e}")


# System Health Monitoring Signals
# @receiver(post_save)
def system_health_monitor(sender, **kwargs):
    """Monitor system health and performance."""
    try:
        # Log model saves for analytics
        if hasattr(sender, '_meta') and sender._meta.app_label != 'contenttypes':
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='model_save',
                value=1,
                description=f"Model save: {sender._meta.app_label}.{sender._meta.model_name}"
            )
    except Exception as e:
        logger.error(f"Error in system health monitor: {e}")


# Database Connection Monitoring
# @receiver(post_save)
def database_connection_monitor(sender, **kwargs):
    """Monitor database connections and performance."""
    try:
        from django.db import connection
        
        # Log slow queries
        if len(connection.queries) > 10:  # More than 10 queries
            logger.warning(f"High query count detected: {len(connection.queries)} queries")
            
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='high_query_count',
                value=len(connection.queries),
                recorded_at=timezone.now(),
                description={
                    'model': f"{sender._meta.app_label}.{sender._meta.model_name}",
                    'query_count': len(connection.queries)
                }
            )
    except Exception as e:
        logger.error(f"Error in database connection monitor: {e}")


# Error Handling Signals
@receiver(post_save)
def error_handler(sender, **kwargs):
    """Handle errors and exceptions."""
    try:
        # Check for potential data integrity issues
        if hasattr(sender, '_meta'):
            model_name = f"{sender._meta.app_label}.{sender._meta.model_name}"
            
            # Log potential issues
            if model_name in ['accounts.User', 'students.Student', 'projects.ProjectGroup']:
                logger.info(f"Critical model updated: {model_name}")
                
                # Create system log
                try:
                    from settings.models import SystemLog
                    SystemLog.objects.create(
                        level='INFO',
                        message=f"Critical model updated: {model_name}",
                        module='signals',
                        action='model_update'
                    )
                except Exception as e:
                    logger.error(f"Error creating system log: {e}")
    except Exception as e:
        logger.error(f"Error in error handler: {e}")


# Performance Monitoring Signals
# @receiver(post_save)
def performance_monitor(sender, **kwargs):
    """Monitor system performance."""
    try:
        import time
        start_time = time.time()
        
        # Log performance metrics
        from analytics.models import AnalyticsMetric
        AnalyticsMetric.objects.create(
            metric_name='performance_metric',
            value=time.time() - start_time,
            recorded_at=timezone.now(),
            description={
                'model': f"{sender._meta.app_label}.{sender._meta.model_name}",
                'execution_time': time.time() - start_time
            }
        )
    except Exception as e:
        logger.error(f"Error in performance monitor: {e}")


# Cache Management Signals
@receiver(post_save)
def cache_manager(sender, **kwargs):
    """Manage cache invalidation."""
    try:
        from django.core.cache import cache
        
        # Clear related caches
        if hasattr(sender, '_meta'):
            model_name = f"{sender._meta.app_label}.{sender._meta.model_name}"
            
            # Clear user-related caches
            if model_name == 'accounts.User':
                cache.delete(f'user_{sender.id}')
                cache.delete_pattern(f'user_session_{sender.id}_*')
            
            # Clear project-related caches
            elif model_name == 'projects.ProjectGroup':
                cache.delete(f'project_{sender.id}')
                cache.delete_pattern(f'project_students_{sender.id}_*')
            
            # Clear student-related caches
            elif model_name == 'students.Student':
                cache.delete(f'student_{sender.id}')
                cache.delete_pattern(f'student_projects_{sender.id}_*')
    except Exception as e:
        logger.error(f"Error in cache manager: {e}")


# Notification Signals
@receiver(post_save)
def notification_manager(sender, **kwargs):
    """Manage automated notifications."""
    try:
        if hasattr(sender, '_meta'):
            model_name = f"{sender._meta.app_label}.{sender._meta.model_name}"
            
            # Send notifications for critical updates
            if model_name == 'accounts.User' and kwargs.get('created'):
                # New user notification
                try:
                    from notifications.models import Notification
                    from django.contrib.auth import get_user_model
                    
                    User = get_user_model()
                    admin_users = User.objects.filter(role__in=['Admin', 'DepartmentAdmin'])
                    
                    for admin in admin_users:
                        Notification.objects.create(
                            recipient_id=str(admin.id),
                            recipient_type='user',
                            title='New User Registration',
                            message=f'A new user has registered: {sender.username}',
                            notification_type='info'
                        )
                except Exception as e:
                    logger.error(f"Error creating new user notification: {e}")
            
            elif model_name == 'projects.ProjectGroup':
                # Project update notification
                try:
                    from notifications.models import Notification
                    
                    # Notify project advisor
                    if hasattr(sender, 'advisor') and sender.advisor:
                        Notification.objects.create(
                            recipient_id=str(sender.advisor.id),
                            recipient_type='user',
                            title='Project Updated',
                            message=f'Project "{sender.name}" has been updated',
                            notification_type='info'
                        )
                except Exception as e:
                    logger.error(f"Error creating project notification: {e}")
    except Exception as e:
        logger.error(f"Error in notification manager: {e}")


# Audit Trail Signals
@receiver(post_save)
def audit_trail(sender, **kwargs):
    """Create audit trail for model changes."""
    try:
        if hasattr(sender, '_meta'):
            model_name = f"{sender._meta.app_label}.{sender._meta.model_name}"
            
            # Create audit log for critical models
            if model_name in ['accounts.User', 'students.Student', 'projects.ProjectGroup']:
                try:
                    from settings.models import SystemLog
                    SystemLog.objects.create(
                        level='INFO',
                        message=f"Model {model_name} updated",
                        module='audit',
                        action='model_update',
                        details={
                            'model': model_name,
                            'instance_id': sender.id,
                            'created': kwargs.get('created', False)
                        }
                    )
                except Exception as e:
                    logger.error(f"Error creating audit log: {e}")
    except Exception as e:
        logger.error(f"Error in audit trail: {e}")


# Data Validation Signals
@receiver(pre_save)
def data_validator(sender, **kwargs):
    """Validate data before saving."""
    try:
        if hasattr(sender, '_meta'):
            model_name = f"{sender._meta.app_label}.{sender._meta.model_name}"
            
            # Validate user data
            if model_name == 'accounts.User':
                if hasattr(sender, 'email') and sender.email:
                    from final_project_management.utils import StringUtils
                    if not StringUtils.is_valid_email(sender.email):
                        raise ValueError("Invalid email format")
            
            # Validate student data
            elif model_name == 'students.Student':
                if hasattr(sender, 'gpa') and sender.gpa:
                    if not (0.0 <= sender.gpa <= 4.0):
                        raise ValueError("GPA must be between 0.0 and 4.0")
            
            # Validate project data
            elif model_name == 'projects.ProjectGroup':
                if hasattr(sender, 'start_date') and hasattr(sender, 'end_date'):
                    if sender.start_date and sender.end_date and sender.start_date > sender.end_date:
                        raise ValueError("Start date cannot be after end date")
    except Exception as e:
        logger.error(f"Error in data validator: {e}")
        raise


# Cleanup Signals
@receiver(post_delete)
def cleanup_manager(sender, **kwargs):
    """Handle cleanup operations after deletion."""
    try:
        if hasattr(sender, '_meta'):
            model_name = f"{sender._meta.app_label}.{sender._meta.model_name}"
            
            # Cleanup user-related data
            if model_name == 'accounts.User':
                try:
                    from accounts.models import UserSession, PasswordResetToken
                    UserSession.objects.filter(user=sender).delete()
                    PasswordResetToken.objects.filter(user=sender).delete()
                except Exception as e:
                    logger.error(f"Error cleaning up user data: {e}")
            
            # Cleanup project-related data
            elif model_name == 'projects.ProjectGroup':
                try:
                    from projects.models import ProjectFile, CommunicationLog
                    ProjectFile.objects.filter(project_group=sender).delete()
                    CommunicationLog.objects.filter(project_group=sender).delete()
                except Exception as e:
                    logger.error(f"Error cleaning up project data: {e}")
    except Exception as e:
        logger.error(f"Error in cleanup manager: {e}")
