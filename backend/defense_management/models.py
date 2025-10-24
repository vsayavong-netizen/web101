from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


class DefenseSchedule(models.Model):
    """Defense schedule model."""
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('postponed', 'Postponed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey('projects.ProjectGroup', on_delete=models.CASCADE, related_name='defense_schedules')
    defense_date = models.DateTimeField()
    defense_time = models.TimeField()
    defense_room = models.CharField(max_length=100)
    defense_duration = models.IntegerField(default=60)  # in minutes
    
    # Committee members
    main_committee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='main_committee_defenses')
    second_committee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='second_committee_defenses')
    third_committee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='third_committee_defenses')
    
    # Status and notes
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True, null=True)
    special_requirements = models.TextField(blank=True, null=True)
    
    # Created by
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_defense_schedules')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'defense_schedules'
        verbose_name = 'Defense Schedule'
        verbose_name_plural = 'Defense Schedules'
        ordering = ['defense_date', 'defense_time']
        indexes = [
            models.Index(fields=['defense_date']),
            models.Index(fields=['status']),
            models.Index(fields=['project']),
        ]
    
    def __str__(self):
        return f"{self.project.project_id} - {self.defense_date} {self.defense_time}"


class DefenseSession(models.Model):
    """Defense session model."""
    
    SESSION_TYPES = [
        ('pre_defense', 'Pre-Defense'),
        ('final_defense', 'Final Defense'),
        ('revision', 'Revision Defense'),
    ]
    
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    defense_schedule = models.ForeignKey(DefenseSchedule, on_delete=models.CASCADE, related_name='sessions')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    
    # Session details
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    actual_duration = models.IntegerField(null=True, blank=True)  # in minutes
    
    # Session notes
    session_notes = models.TextField(blank=True, null=True)
    committee_notes = models.TextField(blank=True, null=True)
    student_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'defense_sessions'
        verbose_name = 'Defense Session'
        verbose_name_plural = 'Defense Sessions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['defense_schedule', 'session_type']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.defense_schedule.project.project_id} - {self.session_type}"


class DefenseEvaluation(models.Model):
    """Defense evaluation model."""
    
    EVALUATION_TYPES = [
        ('presentation', 'Presentation'),
        ('content', 'Content'),
        ('methodology', 'Methodology'),
        ('results', 'Results'),
        ('discussion', 'Discussion'),
        ('overall', 'Overall'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    defense_session = models.ForeignKey(DefenseSession, on_delete=models.CASCADE, related_name='evaluations')
    evaluator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='defense_evaluations')
    evaluation_type = models.CharField(max_length=20, choices=EVALUATION_TYPES)
    
    # Scores
    score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    max_score = models.FloatField(default=100.0)
    
    # Comments
    comments = models.TextField(blank=True, null=True)
    strengths = models.TextField(blank=True, null=True)
    weaknesses = models.TextField(blank=True, null=True)
    recommendations = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'defense_evaluations'
        verbose_name = 'Defense Evaluation'
        verbose_name_plural = 'Defense Evaluations'
        ordering = ['-created_at']
        unique_together = ['defense_session', 'evaluator', 'evaluation_type']
        indexes = [
            models.Index(fields=['defense_session', 'evaluator']),
            models.Index(fields=['evaluation_type']),
        ]
    
    def __str__(self):
        return f"{self.defense_session} - {self.evaluator.get_full_name()} - {self.evaluation_type}"


class DefenseResult(models.Model):
    """Defense result model."""
    
    RESULT_TYPES = [
        ('pass', 'Pass'),
        ('conditional_pass', 'Conditional Pass'),
        ('fail', 'Fail'),
        ('incomplete', 'Incomplete'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    defense_session = models.OneToOneField(DefenseSession, on_delete=models.CASCADE, related_name='result')
    result_type = models.CharField(max_length=20, choices=RESULT_TYPES)
    
    # Scores
    total_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    max_possible_score = models.FloatField(default=100.0)
    
    # Committee decision
    committee_decision = models.TextField()
    committee_recommendations = models.TextField(blank=True, null=True)
    revision_requirements = models.TextField(blank=True, null=True)
    
    # Final decision
    final_decision = models.CharField(max_length=20, choices=RESULT_TYPES)
    final_decision_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='final_defense_decisions')
    final_decision_notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'defense_results'
        verbose_name = 'Defense Result'
        verbose_name_plural = 'Defense Results'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['result_type']),
            models.Index(fields=['final_decision']),
        ]
    
    def __str__(self):
        return f"{self.defense_session} - {self.result_type}"


class DefenseRoom(models.Model):
    """Defense room model."""
    
    ROOM_TYPES = [
        ('classroom', 'Classroom'),
        ('conference', 'Conference Room'),
        ('auditorium', 'Auditorium'),
        ('lab', 'Laboratory'),
        ('online', 'Online'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES)
    capacity = models.IntegerField()
    location = models.CharField(max_length=255)
    equipment = models.TextField(blank=True, null=True)
    is_available = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'defense_rooms'
        verbose_name = 'Defense Room'
        verbose_name_plural = 'Defense Rooms'
        ordering = ['name']
        indexes = [
            models.Index(fields=['room_type']),
            models.Index(fields=['is_available']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.room_type})"


class DefenseSettings(models.Model):
    """Defense settings model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Defense settings
    default_duration = models.IntegerField(default=60)  # in minutes
    max_duration = models.IntegerField(default=120)  # in minutes
    min_duration = models.IntegerField(default=30)  # in minutes
    
    # Scoring settings
    pass_threshold = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        default=70.0
    )
    conditional_pass_threshold = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        default=60.0
    )
    
    # Notification settings
    send_reminders = models.BooleanField(default=True)
    reminder_days = models.IntegerField(default=7)
    send_notifications = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'defense_settings'
        verbose_name = 'Defense Settings'
        verbose_name_plural = 'Defense Settings'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class DefenseLog(models.Model):
    """Defense log model."""
    
    LOG_TYPES = [
        ('scheduled', 'Defense Scheduled'),
        ('started', 'Defense Started'),
        ('completed', 'Defense Completed'),
        ('cancelled', 'Defense Cancelled'),
        ('postponed', 'Defense Postponed'),
        ('evaluation', 'Evaluation Submitted'),
        ('result', 'Result Decided'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    defense_schedule = models.ForeignKey(DefenseSchedule, on_delete=models.CASCADE, related_name='logs')
    log_type = models.CharField(max_length=20, choices=LOG_TYPES)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='defense_logs')
    message = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'defense_logs'
        verbose_name = 'Defense Log'
        verbose_name_plural = 'Defense Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['defense_schedule', 'created_at']),
            models.Index(fields=['log_type']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.defense_schedule.project.project_id} - {self.log_type}"
