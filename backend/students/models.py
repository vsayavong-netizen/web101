from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Student(models.Model):
    """Extended student model with academic information."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=50, unique=True)
    major = models.CharField(max_length=200)
    classroom = models.CharField(max_length=100)
    academic_year = models.CharField(max_length=10, default='2024-2025')
    enrollment_date = models.DateField(default=timezone.now)
    enrollment_year = models.IntegerField(default=2024)
    graduation_date = models.DateField(blank=True, null=True)
    expected_graduation_year = models.IntegerField(blank=True, null=True)
    gpa = models.FloatField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Academic progress
    total_credits = models.IntegerField(default=0)
    completed_credits = models.IntegerField(default=0)
    
    # Contact information
    emergency_contact = models.CharField(max_length=200, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'students'
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        ordering = ['student_id']
    
    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name()}"
    
    @property
    def progress_percentage(self):
        """Calculate academic progress percentage."""
        if self.total_credits == 0:
            return 0
        return (self.completed_credits / self.total_credits) * 100


class StudentAcademicRecord(models.Model):
    """Academic records for students."""
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='academic_records')
    semester = models.CharField(max_length=20)
    academic_year = models.CharField(max_length=10)
    gpa = models.FloatField()
    credits_earned = models.IntegerField()
    credits_completed = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default='Active')  # Active, Probation, Suspended, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'student_academic_records'
        verbose_name = 'Student Academic Record'
        verbose_name_plural = 'Student Academic Records'
        ordering = ['-academic_year', '-semester']
    
    def __str__(self):
        return f"{self.student.student_id} - {self.academic_year} {self.semester}"


class StudentSkill(models.Model):
    """Skills and competencies for students."""
    
    SKILL_CATEGORIES = [
        ('technical', 'Technical Skills'),
        ('soft', 'Soft Skills'),
        ('language', 'Language Skills'),
        ('academic', 'Academic Skills'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='skills')
    skill_name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=SKILL_CATEGORIES)
    proficiency_level = models.IntegerField(default=1)  # 1-5 scale
    years_experience = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'student_skills'
        verbose_name = 'Student Skill'
        verbose_name_plural = 'Student Skills'
        ordering = ['category', 'skill_name']
    
    def __str__(self):
        return f"{self.student.student_id} - {self.skill_name}"


class StudentAchievement(models.Model):
    """Achievements and awards for students."""
    
    ACHIEVEMENT_TYPES = [
        ('academic', 'Academic Achievement'),
        ('research', 'Research Achievement'),
        ('competition', 'Competition Award'),
        ('service', 'Community Service'),
        ('leadership', 'Leadership'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=200)
    achievement_name = models.CharField(max_length=200, default='')
    description = models.TextField()
    achievement_type = models.CharField(max_length=20, choices=ACHIEVEMENT_TYPES)
    date_achieved = models.DateField()
    date_earned = models.DateField(blank=True, null=True)
    organization = models.CharField(max_length=200, blank=True, null=True)
    certificate_url = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'student_achievements'
        verbose_name = 'Student Achievement'
        verbose_name_plural = 'Student Achievements'
        ordering = ['-date_achieved']
    
    def __str__(self):
        return f"{self.student.student_id} - {self.title}"


class StudentAttendance(models.Model):
    """Attendance records for students."""
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    subject = models.CharField(max_length=200)
    class_name = models.CharField(max_length=200, default='')
    status = models.CharField(max_length=20, default='present')  # present, absent, late, excused
    notes = models.TextField(blank=True, null=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'student_attendance'
        verbose_name = 'Student Attendance'
        verbose_name_plural = 'Student Attendance Records'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.student.student_id} - {self.date} - {self.status}"


class StudentNote(models.Model):
    """Notes and comments about students."""
    
    NOTE_TYPES = [
        ('academic', 'Academic Note'),
        ('behavioral', 'Behavioral Note'),
        ('medical', 'Medical Note'),
        ('general', 'General Note'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='notes')
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES)
    title = models.CharField(max_length=200)
    note_title = models.CharField(max_length=200, default='')
    content = models.TextField()
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'student_notes'
        verbose_name = 'Student Note'
        verbose_name_plural = 'Student Notes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.student.student_id} - {self.title}"
