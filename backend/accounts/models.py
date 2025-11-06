from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Extended User model with additional fields for the application."""
    
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('DepartmentAdmin', 'Department Admin'),
        ('Advisor', 'Advisor'),
        ('Student', 'Student'),
    ]
    
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Monk', 'Monk'),
    ]
    
    # Basic user information
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Student')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_ai_assistant_enabled = models.BooleanField(default=True)
    must_change_password = models.BooleanField(default=False)
    last_activity = models.DateTimeField(blank=True, null=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    
    # Academic year tracking
    current_academic_year = models.CharField(max_length=10, default='2024-2025')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.username
        
    def is_admin(self):
        """Check if user is an admin."""
        return self.role == 'Admin' or self.is_superuser
        
    def is_advisor(self):
        """Check if user is an advisor."""
        return self.role == 'Advisor'
        
    def is_department_admin(self):
        """Check if user is a department admin."""
        return self.role == 'DepartmentAdmin'
    
    def is_student(self):
        """Check if user is a student."""
        return self.role == 'Student'
    
    def can_access_academic_year(self, academic_year):
        """Check if user can access data for specific academic year."""
        # Admins can access all years
        if self.is_admin():
            return True
        # For now, allow access to current academic year
        return academic_year == self.current_academic_year or not academic_year


class UserSession(models.Model):
    """Track user sessions for security and analytics."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
    
    def __str__(self):
        return f"{self.user.username} - {self.session_key}"


class PasswordResetToken(models.Model):
    """Store password reset tokens."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=100, unique=True)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'password_reset_tokens'
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
    
    def __str__(self):
        return f"{self.user.username} - {self.token[:10]}..."
    
    def is_expired(self):
        """Check if the token has expired."""
        return timezone.now() > self.expires_at
