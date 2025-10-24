from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Classroom(models.Model):
    """Classroom model."""
    
    name = models.CharField(max_length=100)
    major = models.ForeignKey('majors.Major', on_delete=models.CASCADE, related_name='classrooms')
    academic_year = models.CharField(max_length=10, default='2024-2025')
    semester = models.CharField(max_length=20, default='1')
    capacity = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)
    
    # Classroom location
    building = models.CharField(max_length=100, blank=True, null=True)
    room_number = models.CharField(max_length=20, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'classrooms'
        verbose_name = 'Classroom'
        verbose_name_plural = 'Classrooms'
        ordering = ['major', 'name']
        unique_together = ['name', 'academic_year', 'semester']
    
    def __str__(self):
        return f"{self.name} - {self.major.abbreviation}"


class ClassroomStudent(models.Model):
    """Relationship between classrooms and students."""
    
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='students')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='classrooms')
    enrollment_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'classroom_students'
        verbose_name = 'Classroom Student'
        verbose_name_plural = 'Classroom Students'
        ordering = ['classroom', 'student']
        unique_together = ['classroom', 'student']
    
    def __str__(self):
        return f"{self.classroom.name} - {self.student.get_full_name()}"


class ClassroomSchedule(models.Model):
    """Classroom schedule information."""
    
    DAYS_OF_WEEK = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]
    
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.CharField(max_length=200)
    instructor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'classroom_schedules'
        verbose_name = 'Classroom Schedule'
        verbose_name_plural = 'Classroom Schedules'
        ordering = ['classroom', 'day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.classroom.name} - {self.day_of_week} {self.start_time}"