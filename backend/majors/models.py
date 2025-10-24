from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Major(models.Model):
    """Major/Department model."""
    
    name = models.CharField(max_length=200, unique=True)
    abbreviation = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, null=True)
    degree_level = models.CharField(max_length=50, default='Bachelor')
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'majors'
        verbose_name = 'Major'
        verbose_name_plural = 'Majors'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.abbreviation})"


class MajorSpecialization(models.Model):
    """Specializations within a major."""
    
    major = models.ForeignKey(Major, on_delete=models.CASCADE, related_name='specializations')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'major_specializations'
        verbose_name = 'Major Specialization'
        verbose_name_plural = 'Major Specializations'
        ordering = ['major', 'name']
        unique_together = ['major', 'name']
    
    def __str__(self):
        return f"{self.major.abbreviation} - {self.name}"


class MajorRequirement(models.Model):
    """Academic requirements for a major."""
    
    major = models.ForeignKey(Major, on_delete=models.CASCADE, related_name='requirements')
    requirement_type = models.CharField(max_length=50)  # credit_hours, gpa, courses, etc.
    requirement_value = models.CharField(max_length=200, default='')
    description = models.TextField(blank=True, null=True)
    is_mandatory = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'major_requirements'
        verbose_name = 'Major Requirement'
        verbose_name_plural = 'Major Requirements'
        ordering = ['major', 'requirement_type']
    
    def __str__(self):
        return f"{self.major.abbreviation} - {self.requirement_type}"