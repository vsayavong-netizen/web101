"""
Account-specific signals for automated workflows.
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
def user_created_handler(sender, instance, created, **kwargs):
    """Handle user creation."""
    if created:
        logger.info(f"New user created: {instance.username}")
        
        # User profile creation removed as Profile model doesn't exist
        
        # Send welcome email
        try:
            from final_project_management.utils import EmailUtils
            EmailUtils.send_notification_email(
                instance,
                f"Welcome to the Final Project Management System! Your account has been created successfully."
            )
        except Exception as e:
            logger.error(f"Error sending welcome email: {e}")
        
        # Create user session (only if not in test environment)
        if not hasattr(instance, '_state') or not instance._state.adding:
            try:
                from .models import UserSession
                import uuid
                UserSession.objects.create(
                    user=instance,
                    session_key=str(uuid.uuid4()),
                    ip_address='127.0.0.1',  # Default IP
                    user_agent='System',
                    is_active=True
                )
            except Exception as e:
                logger.error(f"Error creating user session: {e}")
        
        # Log user creation
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='user_created',
                value=1,
                description=f"User created: {instance.username} ({instance.role})"
            )
        except Exception as e:
            logger.error(f"Error logging user creation: {e}")


@receiver(pre_save, sender=User)
def user_pre_save_handler(sender, instance, **kwargs):
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
                
                # Send role change notification
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        recipient_id=str(instance.id),
                        recipient_type='user',
                        title='Role Changed',
                        message=f'Your role has been changed to {instance.get_role_display()}',
                        notification_type='info'
                    )
                except Exception as e:
                    logger.error(f"Error creating role change notification: {e}")
            
            # Check if user was activated/deactivated
            if old_instance.is_active != instance.is_active:
                if instance.is_active:
                    logger.info(f"User activated: {instance.username}")
                    
                    # Send activation email
                    try:
                        from final_project_management.utils import EmailUtils
                        EmailUtils.send_notification_email(
                            instance,
                            "Your account has been activated. You can now log in to the system."
                        )
                    except Exception as e:
                        logger.error(f"Error sending activation email: {e}")
                else:
                    logger.info(f"User deactivated: {instance.username}")
                    
                    # Terminate all user sessions
                    try:
                        from .models import UserSession
                        UserSession.objects.filter(user=instance, is_active=True).update(is_active=False)
                    except Exception as e:
                        logger.error(f"Error terminating user sessions: {e}")
                    
                    # Send deactivation email
                    try:
                        from final_project_management.utils import EmailUtils
                        EmailUtils.send_notification_email(
                            instance,
                            "Your account has been deactivated. Please contact the administrator if you believe this is an error."
                        )
                    except Exception as e:
                        logger.error(f"Error sending deactivation email: {e}")
            
            # Check if email changed
            if old_instance.email != instance.email:
                logger.info(f"User email changed: {instance.username}")
                
                # Send email change notification
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        recipient_id=str(instance.id),
                        recipient_type='user',
                        title='Email Changed',
                        message=f'Your email has been changed to {instance.email}',
                        notification_type='warning'
                    )
                except Exception as e:
                    logger.error(f"Error creating email change notification: {e}")
        
        except User.DoesNotExist:
            pass


@receiver(post_save, sender=User)
def user_updated_handler(sender, instance, created, **kwargs):
    """Handle user updates."""
    if not created:
        logger.info(f"User updated: {instance.username}")
        
        # Log user update
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='user_updated',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'user_id': instance.id,
                    'username': instance.username,
                    'role': instance.role
                }
            )
        except Exception as e:
            logger.error(f"Error logging user update: {e}")


@receiver(post_delete, sender=User)
def user_deleted_handler(sender, instance, **kwargs):
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
                'role': instance.role,
                'email': instance.email
            }
        )
    except Exception as e:
        logger.error(f"Error logging user deletion: {e}")


# UserSession signals
@receiver(post_save, sender='accounts.UserSession')
def user_session_created_handler(sender, instance, created, **kwargs):
    """Handle user session creation."""
    if created:
        logger.info(f"User session created: {instance.user.username}")
        
        # Log session creation
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='user_session_created',
                value=1,
                description=f"Session created for user {instance.user.username}"
            )
        except Exception as e:
            logger.error(f"Error logging session creation: {e}")


@receiver(post_save, sender='accounts.UserSession')
def user_session_updated_handler(sender, instance, created, **kwargs):
    """Handle user session updates."""
    if not created:
        logger.info(f"User session updated: {instance.user.username}")
        
        # Log session update
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='user_session_updated',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'user_id': instance.user.id,
                    'is_active': instance.is_active
                }
            )
        except Exception as e:
            logger.error(f"Error logging session update: {e}")


# PasswordResetToken signals
@receiver(post_save, sender='accounts.PasswordResetToken')
def password_reset_token_created_handler(sender, instance, created, **kwargs):
    """Handle password reset token creation."""
    if created:
        logger.info(f"Password reset token created for: {instance.user.username}")
        
        # Send password reset email
        try:
            from final_project_management.utils import EmailUtils
            EmailUtils.send_notification_email(
                instance.user,
                f"A password reset has been requested for your account. If you did not request this, please ignore this email."
            )
        except Exception as e:
            logger.error(f"Error sending password reset email: {e}")
        
        # Log password reset request
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='password_reset_requested',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'user_id': instance.user.id,
                    'token': instance.token
                }
            )
        except Exception as e:
            logger.error(f"Error logging password reset request: {e}")


@receiver(post_save, sender='accounts.PasswordResetToken')
def password_reset_token_used_handler(sender, instance, created, **kwargs):
    """Handle password reset token usage."""
    if not created and instance.is_used:
        logger.info(f"Password reset token used: {instance.user.username}")
        
        # Log password reset completion
        try:
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='password_reset_completed',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'user_id': instance.user.id,
                    'token': instance.token
                }
            )
        except Exception as e:
            logger.error(f"Error logging password reset completion: {e}")


# Profile signals - removed as Profile model doesn't exist


# User activity monitoring
@receiver(post_save)
def user_activity_monitor(sender, **kwargs):
    """Monitor user activity across all models."""
    try:
        if hasattr(sender, '_meta') and sender._meta.app_label == 'accounts':
            # Log user activity
            from analytics.models import AnalyticsMetric
            AnalyticsMetric.objects.create(
                metric_name='user_activity',
                value=1,
                recorded_at=timezone.now(),
                description={
                    'model': f"{sender._meta.app_label}.{sender._meta.model_name}",
                    'action': 'save'
                }
            )
    except Exception as e:
        logger.error(f"Error in user activity monitor: {e}")


# User permission changes
@receiver(pre_save, sender=User)
def user_permission_change_handler(sender, instance, **kwargs):
    """Handle user permission changes."""
    if instance.pk:
        try:
            old_instance = User.objects.get(pk=instance.pk)
            
            # Check if permissions changed
            if old_instance.is_staff != instance.is_staff or old_instance.is_superuser != instance.is_superuser:
                logger.info(f"User permissions changed: {instance.username}")
                
                # Log permission change
                try:
                    from analytics.models import AnalyticsMetric
                    AnalyticsMetric.objects.create(
                        metric_name='user_permissions_changed',
                        value=1,
                        recorded_at=timezone.now(),
                        description={
                            'user_id': instance.id,
                            'old_is_staff': old_instance.is_staff,
                            'new_is_staff': instance.is_staff,
                            'old_is_superuser': old_instance.is_superuser,
                            'new_is_superuser': instance.is_superuser
                        }
                    )
                except Exception as e:
                    logger.error(f"Error logging permission change: {e}")
                
                # Send permission change notification
                try:
                    from notifications.models import Notification
                    Notification.objects.create(
                        recipient_id=str(instance.id),
                        recipient_type='user',
                        title='Permissions Changed',
                        message='Your account permissions have been updated',
                        notification_type='info'
                    )
                except Exception as e:
                    logger.error(f"Error creating permission change notification: {e}")
        
        except User.DoesNotExist:
            pass


# User data validation
@receiver(pre_save, sender=User)
def user_data_validator(sender, instance, **kwargs):
    """Validate user data before saving."""
    try:
        # Validate email format
        if instance.email:
            from final_project_management.utils import StringUtils
            if not StringUtils.is_valid_email(instance.email):
                raise ValueError("Invalid email format")
        
        # Validate username
        if instance.username:
            if len(instance.username) < 3:
                raise ValueError("Username must be at least 3 characters long")
        
        # Validate role
        if instance.role:
            valid_roles = ['Admin', 'DepartmentAdmin', 'Advisor', 'Student']
            if instance.role not in valid_roles:
                raise ValueError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
    except Exception as e:
        logger.error(f"Error in user data validator: {e}")
        raise


# User cleanup
@receiver(post_delete, sender=User)
def user_cleanup_handler(sender, instance, **kwargs):
    """Handle user cleanup after deletion."""
    try:
        # Clean up user sessions
        from .models import UserSession
        UserSession.objects.filter(user=instance).delete()
        
        # Clean up password reset tokens
        from .models import PasswordResetToken
        PasswordResetToken.objects.filter(user=instance).delete()
        
        # User profile cleanup removed as Profile model doesn't exist
        
        logger.info(f"User cleanup completed for: {instance.username}")
    except Exception as e:
        logger.error(f"Error in user cleanup: {e}")


# User notification preferences
@receiver(post_save, sender=User)
def user_notification_preferences_handler(sender, instance, created, **kwargs):
    """Handle user notification preferences."""
    if created:
        try:
            from notifications.models import NotificationPreference
            NotificationPreference.objects.get_or_create(
                user_id=instance.id,
                defaults={
                    'email_notifications': True,
                    'push_notifications': True,
                    'sms_notifications': False
                }
            )
            logger.info(f"Notification preferences created for: {instance.username}")
        except Exception as e:
            logger.error(f"Error creating notification preferences: {e}")
