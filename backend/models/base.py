"""
Base models for the Final Project Management System
Provides common functionality for all models
"""

from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
import uuid


class AcademicYearModel(models.Model):
    """
    Abstract base model for all academic year-specific data
    Provides multi-year support for the system
    """
    academic_year = models.CharField(
        max_length=4,
        help_text="Academic year (e.g., 2024)",
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        # Validate academic year format
        if not self.academic_year.isdigit() or len(self.academic_year) != 4:
            raise ValueError("Academic year must be a 4-digit year")
        super().save(*args, **kwargs)


class TimestampedModel(models.Model):
    """
    Abstract base model for timestamped data
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """
    Abstract base model for UUID primary keys
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class User(AbstractUser):
    """
    Custom User model with role-based access control
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('advisor', 'Advisor'),
        ('student', 'Student'),
        ('dept_admin', 'Department Admin'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        help_text="User role for access control"
    )
    academic_year = models.CharField(
        max_length=4,
        help_text="Current academic year",
        db_index=True
    )
    must_change_password = models.BooleanField(
        default=False,
        help_text="Force user to change password on next login"
    )
    is_ai_assistant_enabled = models.BooleanField(
        default=True,
        help_text="Enable AI assistant features for this user"
    )
    last_login_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of last login"
    )

    class Meta:
        db_table = 'users_user'
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['academic_year']),
            models.Index(fields=['username']),
        ]

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    def is_admin(self):
        return self.role == 'admin'

    def is_advisor(self):
        return self.role == 'advisor'

    def is_student(self):
        return self.role == 'student'

    def is_department_admin(self):
        return self.role == 'dept_admin'

    def can_access_academic_year(self, year):
        """Check if user can access data for specific academic year"""
        if self.is_admin():
            return True
        return self.academic_year == year


class SoftDeleteModel(models.Model):
    """
    Abstract base model for soft delete functionality
    """
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """Soft delete implementation"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(using=using)

    def hard_delete(self, using=None, keep_parents=False):
        """Hard delete implementation"""
        super().delete(using=using, keep_parents=keep_parents)


class AuditModel(models.Model):
    """
    Abstract base model for audit trail
    """
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created'
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated'
    )

    class Meta:
        abstract = True


class BaseModel(AcademicYearModel, TimestampedModel, AuditModel):
    """
    Base model combining all common functionality
    """
    class Meta:
        abstract = True
