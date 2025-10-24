"""
Project models for the Final Project Management System
"""

from django.db import models
from django.core.validators import RegexValidator
from .base import BaseModel, UUIDModel


class ProjectStatus(models.TextChoices):
    PENDING = 'Pending', 'Pending'
    APPROVED = 'Approved', 'Approved'
    REJECTED = 'Rejected', 'Rejected'


class Project(BaseModel):
    """
    Project model representing final projects
    """
    project_id = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^P\d{2}\d{3}$',
                message='Project ID must be in format: P24001'
            )
        ],
        help_text="Project ID in format: P24001"
    )
    topic_lao = models.TextField(
        help_text="Project topic in Lao language"
    )
    topic_eng = models.TextField(
        help_text="Project topic in English"
    )
    advisor_name = models.CharField(
        max_length=100,
        help_text="Name of the supervising advisor"
    )
    advisor = models.ForeignKey(
        'advisors.Advisor',
        on_delete=models.PROTECT,
        related_name='supervised_projects',
        null=True,
        blank=True,
        help_text="Supervising advisor"
    )
    comment = models.TextField(
        blank=True,
        help_text="Additional comments about the project"
    )
    status = models.CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.PENDING,
        help_text="Project approval status"
    )
    
    # Committee assignments
    main_committee = models.ForeignKey(
        'advisors.Advisor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='main_committee_projects',
        help_text="Main committee member"
    )
    second_committee = models.ForeignKey(
        'advisors.Advisor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='second_committee_projects',
        help_text="Second committee member"
    )
    third_committee = models.ForeignKey(
        'advisors.Advisor',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='third_committee_projects',
        help_text="Third committee member"
    )
    
    # Defense scheduling
    defense_date = models.DateField(
        null=True,
        blank=True,
        help_text="Defense date"
    )
    defense_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Defense time"
    )
    defense_room = models.CharField(
        max_length=100,
        blank=True,
        help_text="Defense room"
    )
    
    # Scoring
    final_grade = models.CharField(
        max_length=10,
        blank=True,
        help_text="Final project grade"
    )
    main_advisor_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Main advisor score"
    )
    main_committee_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Main committee score"
    )
    second_committee_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Second committee score"
    )
    third_committee_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Third committee score"
    )
    
    # Additional fields
    detailed_scores = models.JSONField(
        null=True,
        blank=True,
        help_text="Detailed scoring breakdown"
    )

    class Meta:
        db_table = 'projects_project'
        indexes = [
            models.Index(fields=['project_id']),
            models.Index(fields=['academic_year']),
            models.Index(fields=['status']),
            models.Index(fields=['advisor']),
            models.Index(fields=['defense_date']),
        ]

    def __str__(self):
        return f"{self.project_id} - {self.topic_eng}"

    def get_students(self):
        """Get all students in this project"""
        return self.projectgroup.students.all()

    def get_student_names(self):
        """Get comma-separated student names"""
        students = self.get_students()
        return ", ".join([s.full_name for s in students])

    def get_committee_members(self):
        """Get all committee members"""
        members = []
        if self.main_committee:
            members.append(('main', self.main_committee))
        if self.second_committee:
            members.append(('second', self.second_committee))
        if self.third_committee:
            members.append(('third', self.third_committee))
        return members

    def is_scheduled(self):
        """Check if defense is scheduled"""
        return all([self.defense_date, self.defense_time, self.defense_room])

    def get_final_score(self):
        """Calculate final score based on settings"""
        # This would use scoring settings to calculate final score
        # Implementation depends on scoring settings model
        return None

    def get_milestones(self):
        """Get all milestones for this project"""
        return self.milestones.all().order_by('due_date')

    def get_pending_milestones(self):
        """Get pending milestones"""
        return self.milestones.filter(status='Pending')

    def get_submitted_milestones(self):
        """Get submitted milestones awaiting review"""
        return self.milestones.filter(status='Submitted')

    def get_log_entries(self):
        """Get all log entries for this project"""
        return self.log_entries.all().order_by('-created_at')

    def get_recent_activity(self, days=7):
        """Get recent activity for this project"""
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=days)
        return self.log_entries.filter(created_at__gte=cutoff_date)

    def can_be_edited_by(self, user):
        """Check if user can edit this project"""
        if user.is_admin():
            return True
        
        if user.is_advisor() and self.advisor == user.advisor_profile:
            return True
            
        if user.is_student():
            student = user.student_profile
            return student in self.get_students()
            
        return False

    def can_be_viewed_by(self, user):
        """Check if user can view this project"""
        if user.is_admin():
            return True
            
        if user.is_advisor():
            advisor = user.advisor_profile
            return (
                self.advisor == advisor or
                self.main_committee == advisor or
                self.second_committee == advisor or
                self.third_committee == advisor
            )
            
        if user.is_student():
            student = user.student_profile
            return student in self.get_students()
            
        return False


class ProjectGroup(BaseModel):
    """
    Project group model linking projects with students
    """
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name='projectgroup'
    )
    students = models.ManyToManyField(
        'students.Student',
        related_name='projectgroups',
        help_text="Students in this project group"
    )

    class Meta:
        db_table = 'projects_projectgroup'
        indexes = [
            models.Index(fields=['academic_year']),
        ]

    def __str__(self):
        return f"{self.project.project_id} - {self.get_student_names()}"

    def get_student_names(self):
        """Get comma-separated student names"""
        return ", ".join([s.full_name for s in self.students.all()])

    def get_student_count(self):
        """Get number of students in this group"""
        return self.students.count()

    def add_student(self, student):
        """Add student to project group"""
        if student.academic_year != self.academic_year:
            raise ValueError("Student academic year must match project academic year")
        self.students.add(student)

    def remove_student(self, student):
        """Remove student from project group"""
        self.students.remove(student)

    def can_add_more_students(self, max_students=2):
        """Check if more students can be added"""
        return self.get_student_count() < max_students
