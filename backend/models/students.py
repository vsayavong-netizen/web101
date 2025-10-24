"""
Student models for the Final Project Management System
"""

from django.db import models
from django.core.validators import RegexValidator
from .base import BaseModel


class Gender(models.TextChoices):
    MALE = 'Male', 'Male'
    FEMALE = 'Female', 'Female'
    MONK = 'Monk', 'Monk'


class StudentStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    APPROVED = 'Approved', 'Approved'


class Student(BaseModel):
    """
    Student model representing university students
    """
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    student_id = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\d{3}[A-Z]\d{4}/\d{2}$',
                message='Student ID must be in format: 155N1000/21'
            )
        ],
        help_text="Student ID in format: 155N1000/21"
    )
    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        help_text="Student gender"
    )
    name = models.CharField(
        max_length=100,
        help_text="Student first name"
    )
    surname = models.CharField(
        max_length=100,
        help_text="Student last name"
    )
    major = models.ForeignKey(
        'majors.Major',
        on_delete=models.PROTECT,
        related_name='students',
        help_text="Student's major"
    )
    classroom = models.ForeignKey(
        'classrooms.Classroom',
        on_delete=models.PROTECT,
        related_name='students',
        help_text="Student's classroom"
    )
    tel = models.CharField(
        max_length=20,
        blank=True,
        help_text="Student telephone number"
    )
    email = models.EmailField(
        blank=True,
        help_text="Student email address"
    )
    status = models.CharField(
        max_length=20,
        choices=StudentStatus.choices,
        default=StudentStatus.PENDING,
        help_text="Student approval status"
    )

    class Meta:
        db_table = 'students_student'
        indexes = [
            models.Index(fields=['student_id']),
            models.Index(fields=['academic_year']),
            models.Index(fields=['major']),
            models.Index(fields=['status']),
        ]
        unique_together = ['user', 'academic_year']

    def __str__(self):
        return f"{self.student_id} - {self.name} {self.surname}"

    @property
    def full_name(self):
        return f"{self.name} {self.surname}"

    def get_active_projects(self):
        """Get all active projects for this student"""
        return self.projectgroup_set.filter(
            project__academic_year=self.academic_year,
            project__status__in=['Pending', 'Approved']
        )

    def can_register_project(self):
        """Check if student can register a new project"""
        active_projects = self.get_active_projects()
        return not active_projects.exists()

    def get_project_count(self):
        """Get total number of projects for this student"""
        return self.projectgroup_set.filter(
            project__academic_year=self.academic_year
        ).count()
