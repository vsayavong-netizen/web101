from django.db import models
from django.utils import timezone
from accounts.models import User
from advisors.models import Advisor
import uuid


class ProjectStatus(models.TextChoices):
    """Project status choices."""
    PENDING = 'Pending', 'Pending'
    APPROVED = 'Approved', 'Approved'
    REJECTED = 'Rejected', 'Rejected'


class ProjectGroup(models.Model):
    """Project group containing project and students."""
    
    project_id = models.CharField(max_length=50, unique=True)
    topic_lao = models.CharField(max_length=500)
    topic_eng = models.CharField(max_length=500)
    advisor_name = models.CharField(max_length=200)
    comment = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=ProjectStatus.choices, default=ProjectStatus.PENDING)
    
    # Committee assignments
    main_committee_id = models.CharField(max_length=50, blank=True, null=True)
    second_committee_id = models.CharField(max_length=50, blank=True, null=True)
    third_committee_id = models.CharField(max_length=50, blank=True, null=True)
    
    # Defense information
    defense_date = models.DateField(blank=True, null=True)
    defense_time = models.TimeField(blank=True, null=True)
    defense_room = models.CharField(max_length=100, blank=True, null=True)
    
    # Scoring
    final_grade = models.CharField(max_length=10, blank=True, null=True)
    main_advisor_score = models.FloatField(blank=True, null=True)
    main_committee_score = models.FloatField(blank=True, null=True)
    second_committee_score = models.FloatField(blank=True, null=True)
    third_committee_score = models.FloatField(blank=True, null=True)
    
    # AI analysis
    similarity_info = models.JSONField(blank=True, null=True)
    project_health_status = models.JSONField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'project_groups'
        verbose_name = 'Project Group'
        verbose_name_plural = 'Project Groups'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.project_id} - {self.topic_eng[:50]}"


class Project(models.Model):
    """Legacy-style Project model expected by tests.
    Kept minimal to satisfy test expectations and link to Advisor/ProjectGroup.
    """
    project_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=ProjectStatus.choices, default=ProjectStatus.PENDING)
    advisor = models.ForeignKey(Advisor, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
        ordering = ['-created_at']

    def __str__(self):
        return self.project_id
    
    # Helper methods for serializer compatibility
    def get_student_names(self):
        """Get student names for this project."""
        try:
            project_group = ProjectGroup.objects.get(project_id=self.project_id)
            from projects.models import ProjectStudent
            project_students = ProjectStudent.objects.filter(project_group=project_group)
            return [ps.student.get_full_name() for ps in project_students]
        except ProjectGroup.DoesNotExist:
            return []
        except Exception as e:
            return []
    
    def get_committee_members(self):
        """Get committee members."""
        try:
            project_group = ProjectGroup.objects.get(project_id=self.project_id)
            members = {}
            if project_group.main_committee_id:
                try:
                    advisor = Advisor.objects.get(advisor_id=project_group.main_committee_id)
                    members['main'] = advisor
                except:
                    pass
            if project_group.second_committee_id:
                try:
                    advisor = Advisor.objects.get(advisor_id=project_group.second_committee_id)
                    members['second'] = advisor
                except:
                    pass
            if project_group.third_committee_id:
                try:
                    advisor = Advisor.objects.get(advisor_id=project_group.third_committee_id)
                    members['third'] = advisor
                except:
                    pass
            return members
        except:
            return {}
    
    def get_milestones(self):
        """Get milestones for this project."""
        from milestones.models import Milestone
        try:
            project_group = ProjectGroup.objects.get(project_id=self.project_id)
            return Milestone.objects.filter(project_group=project_group)
        except:
            return Milestone.objects.none()
    
    def get_pending_milestones(self):
        """Get pending milestones."""
        return self.get_milestones().filter(status='Pending')
    
    def is_scheduled(self):
        """Check if defense is scheduled."""
        try:
            project_group = ProjectGroup.objects.get(project_id=self.project_id)
            return bool(project_group.defense_date and project_group.defense_time)
        except:
            return False
    
    def get_final_score(self):
        """Get final score."""
        try:
            project_group = ProjectGroup.objects.get(project_id=self.project_id)
            return project_group.final_grade
        except:
            return None
    
    def get_recent_activity(self, days=7):
        """Get recent activity logs."""
        try:
            project_group = ProjectGroup.objects.get(project_id=self.project_id)
            from django.utils import timezone
            from datetime import timedelta
            cutoff = timezone.now() - timedelta(days=days)
            return project_group.log_entries.filter(created_at__gte=cutoff)
        except ProjectGroup.DoesNotExist:
            from projects.models import LogEntry
            return LogEntry.objects.none()
        except Exception as e:
            from projects.models import LogEntry
            return LogEntry.objects.none()
    
    def can_be_viewed_by(self, user):
        """Check if user can view this project."""
        if user.is_admin():
            return True
        try:
            project_group = ProjectGroup.objects.get(project_id=self.project_id)
            if user.is_student():
                return project_group.students.filter(user=user).exists()
            elif user.is_advisor() and self.advisor:
                return self.advisor.user == user
        except:
            pass
        return False
    
    def can_be_edited_by(self, user):
        """Check if user can edit this project."""
        if user.is_admin():
            return True
        if user.is_advisor() and self.advisor:
            return self.advisor.user == user
        return False


class StatusHistory(models.Model):
    """Track project status changes."""
    
    project_group = models.ForeignKey(ProjectGroup, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, choices=ProjectStatus.choices, blank=True, null=True)
    new_status = models.CharField(max_length=20, choices=ProjectStatus.choices)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.TextField(blank=True, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'status_history'
        verbose_name = 'Status History'
        verbose_name_plural = 'Status Histories'
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"{self.project_group.project_id} - {self.old_status} → {self.new_status}"


class ProjectStudent(models.Model):
    """Link between projects and students."""
    
    project_group = models.ForeignKey(ProjectGroup, on_delete=models.CASCADE, related_name='students')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    is_primary = models.BooleanField(default=True)  # Primary student in the group
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'project_students'
        verbose_name = 'Project Student'
        verbose_name_plural = 'Project Students'
        unique_together = ['project_group', 'student']
    
    def __str__(self):
        return f"{self.project_group.project_id} - {self.student.get_full_name()}"


class ProjectFile(models.Model):
    """Files associated with projects."""
    
    project_group = models.ForeignKey(ProjectGroup, on_delete=models.CASCADE, related_name='files')
    file_name = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=100)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'project_files'
        verbose_name = 'Project File'
        verbose_name_plural = 'Project Files'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.project_group.project_id} - {self.file_name}"


class CommunicationLog(models.Model):
    """Communication logs for projects."""
    
    project_group = models.ForeignKey(ProjectGroup, on_delete=models.CASCADE, related_name='communication_logs')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='authored_logs')
    message = models.TextField()
    message_type = models.CharField(max_length=50, default='general')  # general, milestone, feedback, etc.
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'communication_logs'
        verbose_name = 'Communication Log'
        verbose_name_plural = 'Communication Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.project_group.project_id} - {self.author.get_full_name()}"


class ProjectHealthCheck(models.Model):
    """AI-powered project health analysis."""
    
    project_group = models.ForeignKey(ProjectGroup, on_delete=models.CASCADE, related_name='health_checks')
    health_status = models.CharField(max_length=50)  # On Track, Needs Attention, At Risk, N/A
    summary = models.TextField()
    issues = models.JSONField(default=list)  # List of identified issues
    recommendations = models.JSONField(default=list)  # List of recommendations
    analyzed_at = models.DateTimeField(auto_now_add=True)
    analyzed_by_ai = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'project_health_checks'
        verbose_name = 'Project Health Check'
        verbose_name_plural = 'Project Health Checks'
        ordering = ['-analyzed_at']
    
    def __str__(self):
        return f"{self.project_group.project_id} - {self.health_status}"


class TopicSimilarity(models.Model):
    """AI analysis of topic similarities."""
    
    project_group = models.ForeignKey(ProjectGroup, on_delete=models.CASCADE, related_name='similarity_analyses')
    similar_project_id = models.CharField(max_length=50, blank=True, null=True)
    similarity_percentage = models.FloatField(default=0.0)
    reason = models.TextField()
    analyzed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'topic_similarities'
        verbose_name = 'Topic Similarity'
        verbose_name_plural = 'Topic Similarities'
        ordering = ['-analyzed_at']
    
    def __str__(self):
        return f"{self.project_group.project_id} - {self.similarity_percentage}% similar"


class LogEntry(models.Model):
    """Log entry for project activities."""
    
    LOG_TYPES = [
        ('event', 'Event'),
        ('comment', 'Comment'),
        ('status_change', 'Status Change'),
        ('file_upload', 'File Upload'),
        ('defense_scheduled', 'Defense Scheduled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(ProjectGroup, on_delete=models.CASCADE, related_name='log_entries')
    type = models.CharField(max_length=20, choices=LOG_TYPES)
    author_id = models.IntegerField()  # User ID
    content = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'project_log_entries'
        verbose_name = 'Log Entry'
        verbose_name_plural = 'Log Entries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project', 'created_at']),
            models.Index(fields=['type']),
        ]
    
    def __str__(self):
        return f"{self.project.project_id} - {self.type} by {self.author_id}"