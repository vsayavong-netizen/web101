"""
Classroom models for the Final Project Management System
"""

from django.db import models
from .base import BaseModel


class Classroom(BaseModel):
    """
    Classroom model representing university classrooms
    """
    name = models.CharField(
        max_length=50,
        help_text="Classroom name (e.g., IBM-4A, BM-4B)"
    )
    major = models.ForeignKey(
        'majors.Major',
        on_delete=models.CASCADE,
        related_name='classrooms',
        help_text="Major this classroom belongs to"
    )
    major_name = models.CharField(
        max_length=200,
        help_text="Major name for display purposes"
    )

    class Meta:
        db_table = 'classrooms_classroom'
        indexes = [
            models.Index(fields=['academic_year']),
            models.Index(fields=['major']),
            models.Index(fields=['name']),
        ]
        unique_together = ['name', 'academic_year']

    def __str__(self):
        return f"{self.name} - {self.major_name}"

    def get_student_count(self):
        """Get number of students in this classroom"""
        return self.students.filter(academic_year=self.academic_year).count()

    def get_project_count(self):
        """Get number of projects from this classroom"""
        return self.students.filter(
            academic_year=self.academic_year,
            projectgroup__isnull=False
        ).count()

    def get_statistics(self):
        """Get classroom statistics"""
        return {
            'student_count': self.get_student_count(),
            'project_count': self.get_project_count(),
            'major': self.major_name,
        }

    def copy_to_new_year(self, new_year):
        """Copy classroom to new academic year"""
        new_classroom = Classroom.objects.create(
            name=self.name,
            major=self.major,
            major_name=self.major_name,
            academic_year=new_year
        )
        return new_classroom
