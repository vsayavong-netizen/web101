"""
Account-specific utility functions and helper classes.
"""

import logging
from typing import Dict, List, Optional, Any
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from datetime import timedelta

User = get_user_model()
logger = logging.getLogger(__name__)


class UserUtils:
    """Utility class for user operations."""
    
    @staticmethod
    def create_user(
        username: str,
        email: str,
        password: str,
        first_name: str = '',
        last_name: str = '',
        role: str = 'Student',
        **kwargs
    ) -> Optional[User]:
        """Create a new user."""
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=role,
                **kwargs
            )
            logger.info(f"User created: {user.username}")
            return user
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Get user by email address."""
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def get_user_by_username(username: str) -> Optional[User]:
        """Get user by username."""
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def search_users(query: str, role: str = None) -> List[User]:
        """Search users by query."""
        users = User.objects.all()
        
        if query:
            users = users.filter(
                Q(username__icontains=query) |
                Q(email__icontains=query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query)
            )
        
        if role:
            users = users.filter(role=role)
        
        return users
    
    @staticmethod
    def get_users_by_role(role: str) -> List[User]:
        """Get all users by role."""
        return User.objects.filter(role=role, is_active=True)
    
    @staticmethod
    def get_active_users() -> List[User]:
        """Get all active users."""
        return User.objects.filter(is_active=True)
    
    @staticmethod
    def get_inactive_users() -> List[User]:
        """Get all inactive users."""
        return User.objects.filter(is_active=False)
    
    @staticmethod
    def get_users_by_academic_year(academic_year: str) -> List[User]:
        """Get users by academic year."""
        return User.objects.filter(current_academic_year=academic_year, is_active=True)
    
    @staticmethod
    def update_user_profile(user: User, **kwargs) -> bool:
        """Update user profile."""
        try:
            for key, value in kwargs.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            user.save()
            return True
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return False
    
    @staticmethod
    def deactivate_user(user: User) -> bool:
        """Deactivate user account."""
        try:
            user.is_active = False
            user.save()
            logger.info(f"User deactivated: {user.username}")
            return True
        except Exception as e:
            logger.error(f"Error deactivating user: {e}")
            return False
    
    @staticmethod
    def activate_user(user: User) -> bool:
        """Activate user account."""
        try:
            user.is_active = True
            user.save()
            logger.info(f"User activated: {user.username}")
            return True
        except Exception as e:
            logger.error(f"Error activating user: {e}")
            return False


class PasswordUtils:
    """Utility class for password operations."""
    
    @staticmethod
    def generate_password_reset_token(user: User) -> str:
        """Generate password reset token."""
        from .models import PasswordResetToken
        
        # Delete existing tokens for user
        PasswordResetToken.objects.filter(user=user).delete()
        
        # Create new token
        token = PasswordResetToken.objects.create(user=user)
        return token.token
    
    @staticmethod
    def validate_password_reset_token(token: str) -> Optional[User]:
        """Validate password reset token."""
        try:
            from .models import PasswordResetToken
            
            reset_token = PasswordResetToken.objects.get(token=token, is_used=False)
            if reset_token.is_expired():
                return None
            return reset_token.user
        except PasswordResetToken.DoesNotExist:
            return None
    
    @staticmethod
    def mark_token_used(token: str) -> bool:
        """Mark password reset token as used."""
        try:
            from .models import PasswordResetToken
            
            reset_token = PasswordResetToken.objects.get(token=token)
            reset_token.is_used = True
            reset_token.save()
            return True
        except PasswordResetToken.DoesNotExist:
            return False
    
    @staticmethod
    def send_password_reset_email(user: User, token: str) -> bool:
        """Send password reset email."""
        try:
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            
            subject = "Password Reset Request"
            message = f"""
            Hello {user.get_full_name()},
            
            You have requested a password reset for your account.
            Please click the link below to reset your password:
            
            {reset_url}
            
            This link will expire in 24 hours.
            
            If you did not request this password reset, please ignore this email.
            
            Best regards,
            Final Project Management System
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False
            )
            return True
        except Exception as e:
            logger.error(f"Error sending password reset email: {e}")
            return False


class SessionUtils:
    """Utility class for session operations."""
    
    @staticmethod
    def create_user_session(user: User, ip_address: str, user_agent: str) -> bool:
        """Create user session."""
        try:
            from .models import UserSession
            
            UserSession.objects.create(
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
                is_active=True
            )
            return True
        except Exception as e:
            logger.error(f"Error creating user session: {e}")
            return False
    
    @staticmethod
    def get_user_sessions(user: User) -> List[Any]:
        """Get user sessions."""
        try:
            from .models import UserSession
            return UserSession.objects.filter(user=user).order_by('-created_at')
        except Exception as e:
            logger.error(f"Error getting user sessions: {e}")
            return []
    
    @staticmethod
    def terminate_user_sessions(user: User) -> int:
        """Terminate all user sessions."""
        try:
            from .models import UserSession
            
            sessions = UserSession.objects.filter(user=user, is_active=True)
            count = sessions.count()
            sessions.update(is_active=False)
            return count
        except Exception as e:
            logger.error(f"Error terminating user sessions: {e}")
            return 0
    
    @staticmethod
    def terminate_session(session_id: int) -> bool:
        """Terminate specific session."""
        try:
            from .models import UserSession
            
            session = UserSession.objects.get(id=session_id)
            session.is_active = False
            session.save()
            return True
        except UserSession.DoesNotExist:
            return False
        except Exception as e:
            logger.error(f"Error terminating session: {e}")
            return False


class UserStatsUtils:
    """Utility class for user statistics."""
    
    @staticmethod
    def get_user_statistics() -> Dict[str, Any]:
        """Get user statistics."""
        try:
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            inactive_users = User.objects.filter(is_active=False).count()
            
            # Users by role
            users_by_role = {}
            for role in ['Admin', 'DepartmentAdmin', 'Advisor', 'Student']:
                users_by_role[role] = User.objects.filter(role=role).count()
            
            # Recent registrations (last 30 days)
            recent_registrations = User.objects.filter(
                date_joined__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            # Last login stats
            last_login_stats = {
                'never_logged_in': User.objects.filter(last_login__isnull=True).count(),
                'logged_in_last_week': User.objects.filter(
                    last_login__gte=timezone.now() - timedelta(days=7)
                ).count(),
                'logged_in_last_month': User.objects.filter(
                    last_login__gte=timezone.now() - timedelta(days=30)
                ).count()
            }
            
            return {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': inactive_users,
                'users_by_role': users_by_role,
                'recent_registrations': recent_registrations,
                'last_login_stats': last_login_stats
            }
        except Exception as e:
            logger.error(f"Error getting user statistics: {e}")
            return {}
    
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
                'events_by_type': list(metrics.values('name').annotate(count=models.Count('id'))),
                'recent_activity': list(metrics.order_by('-timestamp')[:10].values())
            }
        except Exception as e:
            logger.error(f"Error getting user activity: {e}")
            return {}


class UserPermissionUtils:
    """Utility class for user permission operations."""
    
    @staticmethod
    def can_access_user_data(current_user: User, target_user: User) -> bool:
        """Check if current user can access target user data."""
        # Users can always access their own data
        if current_user == target_user:
            return True
        
        # Admins can access all data
        if current_user.role == 'Admin':
            return True
        
        # Department admins can access students and advisors
        if current_user.role == 'DepartmentAdmin':
            return target_user.role in ['Student', 'Advisor', 'DepartmentAdmin']
        
        # Advisors can access students
        if current_user.role == 'Advisor':
            return target_user.role == 'Student'
        
        # Students can only access their own data
        return False
    
    @staticmethod
    def can_manage_users(user: User) -> bool:
        """Check if user can manage other users."""
        return user.role in ['Admin', 'DepartmentAdmin']
    
    @staticmethod
    def can_access_admin_panel(user: User) -> bool:
        """Check if user can access admin panel."""
        return user.role in ['Admin', 'DepartmentAdmin']
    
    @staticmethod
    def can_view_statistics(user: User) -> bool:
        """Check if user can view statistics."""
        return user.role in ['Admin', 'DepartmentAdmin', 'Advisor']


class UserNotificationUtils:
    """Utility class for user notification operations."""
    
    @staticmethod
    def send_welcome_email(user: User) -> bool:
        """Send welcome email to new user."""
        try:
            subject = "Welcome to Final Project Management System"
            message = f"""
            Hello {user.get_full_name()},
            
            Welcome to the Final Project Management System!
            
            Your account has been created successfully.
            Username: {user.username}
            Email: {user.email}
            Role: {user.get_role_display()}
            
            Please log in to start using the system.
            
            Best regards,
            Final Project Management System
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False
            )
            return True
        except Exception as e:
            logger.error(f"Error sending welcome email: {e}")
            return False
    
    @staticmethod
    def send_account_activation_email(user: User) -> bool:
        """Send account activation email."""
        try:
            subject = "Account Activated"
            message = f"""
            Hello {user.get_full_name()},
            
            Your account has been activated successfully.
            You can now log in to the system.
            
            Best regards,
            Final Project Management System
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False
            )
            return True
        except Exception as e:
            logger.error(f"Error sending activation email: {e}")
            return False
    
    @staticmethod
    def send_account_deactivation_email(user: User) -> bool:
        """Send account deactivation email."""
        try:
            subject = "Account Deactivated"
            message = f"""
            Hello {user.get_full_name()},
            
            Your account has been deactivated.
            Please contact the administrator if you believe this is an error.
            
            Best regards,
            Final Project Management System
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False
            )
            return True
        except Exception as e:
            logger.error(f"Error sending deactivation email: {e}")
            return False
