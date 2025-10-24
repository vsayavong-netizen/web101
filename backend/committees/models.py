from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Committee(models.Model):
    """Committee model for project evaluation."""
    
    COMMITTEE_TYPES = [
        ('main', 'Main Committee'),
        ('second', 'Second Committee'),
        ('third', 'Third Committee'),
    ]
    
    committee_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    committee_type = models.CharField(max_length=20, choices=COMMITTEE_TYPES)
    description = models.TextField(blank=True, null=True)
    
    # Committee members
    chairperson = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='chaired_committees')
    members = models.ManyToManyField(User, related_name='committee_members', blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    established_date = models.DateField(default=timezone.now)
    dissolved_date = models.DateField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'committees'
        verbose_name = 'Committee'
        verbose_name_plural = 'Committees'
        ordering = ['committee_id']
    
    def __str__(self):
        return f"{self.committee_id} - {self.name}"


class CommitteeAssignment(models.Model):
    """Assignment of committees to projects."""
    
    project_group = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, related_name='committee_assignments')
    committee = models.ForeignKey(Committee, on_delete=models.CASCADE, related_name='assignments')
    assignment_type = models.CharField(max_length=20, choices=Committee.COMMITTEE_TYPES)
    assigned_date = models.DateField(default=timezone.now)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Evaluation details
    evaluation_date = models.DateField(blank=True, null=True)
    evaluation_time = models.TimeField(blank=True, null=True)
    evaluation_room = models.CharField(max_length=100, blank=True, null=True)
    
    # Status
    is_completed = models.BooleanField(default=False)
    completion_date = models.DateField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'committee_assignments'
        verbose_name = 'Committee Assignment'
        verbose_name_plural = 'Committee Assignments'
        unique_together = ['project_group', 'committee', 'assignment_type']
        ordering = ['-assigned_date']
    
    def __str__(self):
        return f"{self.project_group.project_id} - {self.committee.name} ({self.assignment_type})"


class CommitteeEvaluation(models.Model):
    """Evaluation results from committee members."""
    
    assignment = models.ForeignKey(CommitteeAssignment, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='committee_evaluations')
    
    # Evaluation scores
    technical_score = models.FloatField(default=0.0)
    presentation_score = models.FloatField(default=0.0)
    documentation_score = models.FloatField(default=0.0)
    innovation_score = models.FloatField(default=0.0)
    total_score = models.FloatField(default=0.0)
    
    # Evaluation details
    strengths = models.TextField(blank=True, null=True)
    weaknesses = models.TextField(blank=True, null=True)
    recommendations = models.TextField(blank=True, null=True)
    overall_comments = models.TextField(blank=True, null=True)
    
    # Decision
    decision = models.CharField(max_length=20, default='pending')  # pending, approved, rejected, needs_revision
    decision_reason = models.TextField(blank=True, null=True)
    
    # Timestamps
    evaluated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'committee_evaluations'
        verbose_name = 'Committee Evaluation'
        verbose_name_plural = 'Committee Evaluations'
        unique_together = ['assignment', 'evaluator']
        ordering = ['-evaluated_at']
    
    def __str__(self):
        return f"{self.assignment.project_group.project_id} - {self.evaluator.get_full_name()}"


class CommitteeMeeting(models.Model):
    """Committee meeting records."""
    
    committee = models.ForeignKey(Committee, on_delete=models.CASCADE, related_name='meetings')
    meeting_date = models.DateField()
    meeting_time = models.TimeField()
    meeting_room = models.CharField(max_length=100)
    agenda = models.TextField(blank=True, null=True)
    
    # Attendees
    attendees = models.ManyToManyField(User, related_name='committee_meetings', blank=True)
    chairperson = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='chaired_meetings')
    
    # Meeting details
    minutes = models.TextField(blank=True, null=True)
    decisions = models.TextField(blank=True, null=True)
    action_items = models.TextField(blank=True, null=True)
    
    # Status
    is_completed = models.BooleanField(default=False)
    completion_date = models.DateField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'committee_meetings'
        verbose_name = 'Committee Meeting'
        verbose_name_plural = 'Committee Meetings'
        ordering = ['-meeting_date']
    
    def __str__(self):
        return f"{self.committee.name} - {self.meeting_date}"


class CommitteeMember(models.Model):
    """Committee membership details."""
    
    committee = models.ForeignKey(Committee, on_delete=models.CASCADE, related_name='memberships')
    member = models.ForeignKey(User, on_delete=models.CASCADE, related_name='committee_memberships')
    role = models.CharField(max_length=50, default='member')  # member, chairperson, secretary, etc.
    joined_date = models.DateField(default=timezone.now)
    left_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Responsibilities
    responsibilities = models.TextField(blank=True, null=True)
    expertise_areas = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'committee_members'
        verbose_name = 'Committee Member'
        verbose_name_plural = 'Committee Members'
        unique_together = ['committee', 'member']
        ordering = ['-joined_date']
    
    def __str__(self):
        return f"{self.committee.name} - {self.member.get_full_name()} ({self.role})"


class CommitteeNote(models.Model):
    """Notes and comments about committees."""
    
    NOTE_TYPES = [
        ('meeting', 'Meeting Note'),
        ('evaluation', 'Evaluation Note'),
        ('general', 'General Note'),
    ]
    
    committee = models.ForeignKey(Committee, on_delete=models.CASCADE, related_name='notes')
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'committee_notes'
        verbose_name = 'Committee Note'
        verbose_name_plural = 'Committee Notes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.committee.name} - {self.title}"
