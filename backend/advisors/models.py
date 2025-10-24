from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Advisor(models.Model):
    """Extended advisor model with academic information."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='advisor_profile')
    advisor_id = models.CharField(max_length=50, unique=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    quota = models.IntegerField(default=5)  # Maximum number of projects they can supervise
    main_committee_quota = models.IntegerField(default=5)  # Maximum number of main committee positions
    second_committee_quota = models.IntegerField(default=5)  # Maximum number of second committee positions
    third_committee_quota = models.IntegerField(default=5)  # Maximum number of third committee positions
    
    # Academic information
    academic_title = models.CharField(max_length=100, blank=True, null=True)  # Dr., Prof., etc.
    department = models.CharField(max_length=200, blank=True, null=True)
    office_location = models.CharField(max_length=200, blank=True, null=True)
    office_hours = models.TextField(blank=True, null=True)
    
    # Contact information
    phone_extension = models.CharField(max_length=20, blank=True, null=True)
    office_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Professional information
    research_interests = models.TextField(blank=True, null=True)
    specialization = models.CharField(max_length=200, blank=True, null=True)
    qualifications = models.TextField(blank=True, null=True)
    experience_years = models.IntegerField(default=0)
    max_students = models.IntegerField(default=10)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_department_admin = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'advisors'
        verbose_name = 'Advisor'
        verbose_name_plural = 'Advisors'
        ordering = ['advisor_id']
    
    def __str__(self):
        return f"{self.advisor_id} - {self.user.get_full_name()}"
    
    @property
    def current_load(self):
        """Calculate current workload."""
        # TODO: Implement logic to calculate current project load
        return 0
    
    @property
    def is_overloaded(self):
        """Check if advisor is overloaded."""
        return self.current_load > self.quota


class AdvisorSpecialization(models.Model):
    """Specializations for advisors."""
    
    advisor = models.ForeignKey(Advisor, on_delete=models.CASCADE, related_name='specializations')
    major = models.CharField(max_length=200)
    expertise_level = models.IntegerField(default=1)  # 1-5 scale
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'advisor_specializations'
        verbose_name = 'Advisor Specialization'
        verbose_name_plural = 'Advisor Specializations'
        unique_together = ['advisor', 'major']
    
    def __str__(self):
        return f"{self.advisor.advisor_id} - {self.major}"


class AdvisorWorkload(models.Model):
    """Track advisor workload over time."""
    
    advisor = models.ForeignKey(Advisor, on_delete=models.CASCADE, related_name='workload_records')
    academic_year = models.CharField(max_length=10)
    semester = models.CharField(max_length=20)
    
    # Workload metrics
    supervising_projects = models.IntegerField(default=0)
    main_committee_projects = models.IntegerField(default=0)
    second_committee_projects = models.IntegerField(default=0)
    third_committee_projects = models.IntegerField(default=0)
    total_projects = models.IntegerField(default=0)
    
    # Capacity
    supervising_capacity = models.IntegerField(default=5)
    main_committee_capacity = models.IntegerField(default=5)
    second_committee_capacity = models.IntegerField(default=5)
    third_committee_capacity = models.IntegerField(default=5)
    
    # Utilization rates
    supervising_utilization = models.FloatField(default=0.0)
    main_committee_utilization = models.FloatField(default=0.0)
    second_committee_utilization = models.FloatField(default=0.0)
    third_committee_utilization = models.FloatField(default=0.0)
    overall_utilization = models.FloatField(default=0.0)
    
    # Timestamps
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'advisor_workloads'
        verbose_name = 'Advisor Workload'
        verbose_name_plural = 'Advisor Workloads'
        ordering = ['-academic_year', '-semester']
        unique_together = ['advisor', 'academic_year', 'semester']
    
    def __str__(self):
        return f"{self.advisor.advisor_id} - {self.academic_year} {self.semester}"


class AdvisorPerformance(models.Model):
    """Track advisor performance metrics."""
    
    advisor = models.ForeignKey(Advisor, on_delete=models.CASCADE, related_name='performance_records')
    academic_year = models.CharField(max_length=10)
    
    # Performance metrics
    projects_completed = models.IntegerField(default=0)
    average_project_score = models.FloatField(default=0.0)
    student_satisfaction_score = models.FloatField(default=0.0)
    response_time_hours = models.FloatField(default=0.0)  # Average response time in hours
    
    # Quality metrics
    on_time_completion_rate = models.FloatField(default=0.0)
    quality_score = models.FloatField(default=0.0)
    innovation_score = models.FloatField(default=0.0)
    
    # Timestamps
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'advisor_performance'
        verbose_name = 'Advisor Performance'
        verbose_name_plural = 'Advisor Performance Records'
        ordering = ['-academic_year']
        unique_together = ['advisor', 'academic_year']
    
    def __str__(self):
        return f"{self.advisor.advisor_id} - {self.academic_year}"


class AdvisorAvailability(models.Model):
    """Track advisor availability for new projects."""
    
    advisor = models.ForeignKey(Advisor, on_delete=models.CASCADE, related_name='availability_records')
    date = models.DateField()
    is_available = models.BooleanField(default=True)
    reason = models.TextField(blank=True, null=True)  # Reason for unavailability
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'advisor_availability'
        verbose_name = 'Advisor Availability'
        verbose_name_plural = 'Advisor Availability Records'
        ordering = ['-date']
        unique_together = ['advisor', 'date']
    
    def __str__(self):
        return f"{self.advisor.advisor_id} - {self.date} - {'Available' if self.is_available else 'Unavailable'}"


class AdvisorNote(models.Model):
    """Notes and comments about advisors."""
    
    NOTE_TYPES = [
        ('performance', 'Performance Note'),
        ('workload', 'Workload Note'),
        ('availability', 'Availability Note'),
        ('general', 'General Note'),
    ]
    
    advisor = models.ForeignKey(Advisor, on_delete=models.CASCADE, related_name='notes')
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES)
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'advisor_notes'
        verbose_name = 'Advisor Note'
        verbose_name_plural = 'Advisor Notes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.advisor.advisor_id} - {self.title}"
