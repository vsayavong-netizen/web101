from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class MilestoneTemplate(models.Model):
    """Template for project milestones."""
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    
    # Template metadata
    estimated_duration_days = models.IntegerField(default=30)
    is_mandatory = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'milestone_templates'
        verbose_name = 'Milestone Template'
        verbose_name_plural = 'Milestone Templates'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class MilestoneTask(models.Model):
    """Tasks within a milestone template."""
    
    template = models.ForeignKey(MilestoneTemplate, on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    duration_days = models.IntegerField(default=7)
    order = models.IntegerField(default=1)
    is_mandatory = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'milestone_tasks'
        verbose_name = 'Milestone Task'
        verbose_name_plural = 'Milestone Tasks'
        ordering = ['template', 'order']
    
    def __str__(self):
        return f"{self.template.name} - {self.name}"


class Milestone(models.Model):
    """Project milestone instance."""
    
    MILESTONE_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Submitted', 'Submitted'),
        ('Approved', 'Approved'),
        ('RequiresRevision', 'Requires Revision'),
    ]
    
    project_group = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, related_name='milestones')
    template = models.ForeignKey(MilestoneTemplate, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=MILESTONE_STATUS_CHOICES, default='Pending')
    
    # Dates
    due_date = models.DateField()
    submitted_date = models.DateTimeField(blank=True, null=True)
    approved_date = models.DateTimeField(blank=True, null=True)
    
    # Feedback
    feedback = models.TextField(blank=True, null=True)
    feedback_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='milestone_feedback')
    
    # Files
    submitted_file = models.JSONField(blank=True, null=True)  # Store file information
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'milestones'
        verbose_name = 'Milestone'
        verbose_name_plural = 'Milestones'
        ordering = ['project_group', 'due_date']
    
    def __str__(self):
        return f"{self.project_group.project_id} - {self.name}"
    
    @property
    def is_overdue(self):
        """Check if milestone is overdue."""
        return self.status == 'Pending' and timezone.now().date() > self.due_date
    
    @property
    def days_remaining(self):
        """Calculate days remaining until due date."""
        if self.status in ['Approved', 'Submitted']:
            return 0
        delta = self.due_date - timezone.now().date()
        return max(0, delta.days)


class MilestoneSubmission(models.Model):
    """Milestone submission details."""
    
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name='submissions')
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255, default='')
    file_size = models.BigIntegerField(default=0)
    file_type = models.CharField(max_length=100, default='')
    file_path = models.CharField(max_length=500, default='')
    submission_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'milestone_submissions'
        verbose_name = 'Milestone Submission'
        verbose_name_plural = 'Milestone Submissions'
        ordering = ['-submitted_at']
    
    def __str__(self):
        return f"{self.milestone.name} - {self.file_name}"


class MilestoneReview(models.Model):
    """Milestone review by advisors."""
    
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE)
    review_notes = models.TextField()
    score = models.FloatField(blank=True, null=True)
    max_score = models.FloatField(default=100.0)
    
    # Review criteria
    criteria_scores = models.JSONField(default=dict)  # Store detailed criteria scores
    
    # Timestamps
    reviewed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'milestone_reviews'
        verbose_name = 'Milestone Review'
        verbose_name_plural = 'Milestone Reviews'
        ordering = ['-reviewed_at']
        unique_together = ['milestone', 'reviewer']
    
    def __str__(self):
        return f"{self.milestone.name} - {self.reviewer.get_full_name()}"