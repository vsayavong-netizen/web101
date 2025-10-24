"""
Major models for the Final Project Management System
"""

from django.db import models
from .base import BaseModel


class Major(BaseModel):
    """
    Major model representing university majors
    """
    name = models.CharField(
        max_length=200,
        help_text="Full name of the major"
    )
    abbreviation = models.CharField(
        max_length=20,
        help_text="Abbreviation for the major (e.g., IBM, BM, MK)"
    )

    class Meta:
        db_table = 'majors_major'
        indexes = [
            models.Index(fields=['academic_year']),
            models.Index(fields=['name']),
        ]
        unique_together = ['name', 'academic_year']

    def __str__(self):
        return f"{self.name} ({self.abbreviation})"

    def get_student_count(self):
        """Get number of students in this major for current academic year"""
        return self.students.filter(academic_year=self.academic_year).count()

    def get_project_count(self):
        """Get number of projects in this major for current academic year"""
        return self.projects.filter(academic_year=self.academic_year).count()

    def get_advisor_count(self):
        """Get number of advisors specialized in this major"""
        return self.specialized_advisors.filter(academic_year=self.academic_year).count()

    def get_statistics(self):
        """Get major statistics for current academic year"""
        return {
            'student_count': self.get_student_count(),
            'project_count': self.get_project_count(),
            'advisor_count': self.get_advisor_count(),
            'classroom_count': self.classrooms.filter(academic_year=self.academic_year).count(),
        }

    def copy_to_new_year(self, new_year):
        """Copy major to new academic year"""
        new_major = Major.objects.create(
            name=self.name,
            abbreviation=self.abbreviation,
            academic_year=new_year
        )
        return new_major
