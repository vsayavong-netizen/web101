"""
Advisor models for the Final Project Management System
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .base import BaseModel


class Advisor(BaseModel):
    """
    Advisor model representing university advisors
    """
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='advisor_profile'
    )
    name = models.CharField(
        max_length=100,
        help_text="Advisor full name"
    )
    quota = models.PositiveIntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Maximum number of projects this advisor can supervise"
    )
    main_committee_quota = models.PositiveIntegerField(
        default=3,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Maximum number of main committee positions"
    )
    second_committee_quota = models.PositiveIntegerField(
        default=3,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Maximum number of second committee positions"
    )
    third_committee_quota = models.PositiveIntegerField(
        default=3,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="Maximum number of third committee positions"
    )
    is_department_admin = models.BooleanField(
        default=False,
        help_text="Whether this advisor is a department administrator"
    )
    specialized_majors = models.ManyToManyField(
        'majors.Major',
        related_name='specialized_advisors',
        blank=True,
        help_text="Majors this advisor specializes in"
    )

    class Meta:
        db_table = 'advisors_advisor'
        indexes = [
            models.Index(fields=['academic_year']),
            models.Index(fields=['name']),
            models.Index(fields=['is_department_admin']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"

    def get_current_project_count(self):
        """Get current number of supervised projects"""
        return self.supervised_projects.filter(
            academic_year=self.academic_year,
            status__in=['Pending', 'Approved']
        ).count()

    def get_committee_count(self, committee_type):
        """Get current committee count for specific type"""
        field_map = {
            'main': 'main_committee_projects',
            'second': 'second_committee_projects', 
            'third': 'third_committee_projects'
        }
        
        if committee_type not in field_map:
            return 0
            
        return getattr(self, field_map[committee_type]).filter(
            academic_year=self.academic_year
        ).count()

    def can_supervise_more_projects(self):
        """Check if advisor can supervise more projects"""
        return self.get_current_project_count() < self.quota

    def can_join_committee(self, committee_type):
        """Check if advisor can join committee of specific type"""
        quota_map = {
            'main': self.main_committee_quota,
            'second': self.second_committee_quota,
            'third': self.third_committee_quota
        }
        
        if committee_type not in quota_map:
            return False
            
        current_count = self.get_committee_count(committee_type)
        return current_count < quota_map[committee_type]

    def get_workload_summary(self):
        """Get advisor workload summary"""
        return {
            'supervised_projects': self.get_current_project_count(),
            'main_committee': self.get_committee_count('main'),
            'second_committee': self.get_committee_count('second'),
            'third_committee': self.get_committee_count('third'),
            'quota_remaining': self.quota - self.get_current_project_count(),
        }

    def is_overloaded(self):
        """Check if advisor is overloaded"""
        return (
            self.get_current_project_count() > self.quota or
            self.get_committee_count('main') > self.main_committee_quota or
            self.get_committee_count('second') > self.second_committee_quota or
            self.get_committee_count('third') > self.third_committee_quota
        )

    def get_managed_majors(self):
        """Get majors this advisor can manage (for department admins)"""
        if self.is_department_admin:
            return self.specialized_majors.all()
        return []

    def can_manage_major(self, major):
        """Check if advisor can manage specific major"""
        if self.is_department_admin:
            return major in self.specialized_majors.all()
        return False
