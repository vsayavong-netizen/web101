from django.contrib import admin
from .models import (
    Student, StudentAcademicRecord, StudentSkill, StudentAchievement,
    StudentAttendance, StudentNote
)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    """Admin interface for Student model."""
    
    list_display = ['user', 'student_id', 'major', 'classroom', 'academic_year', 'is_active']
    list_filter = ['major', 'classroom', 'academic_year', 'is_active', 'created_at']
    search_fields = ['user__username', 'student_id', 'major', 'classroom']
    ordering = ['student_id']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'student_id', 'major', 'classroom', 'academic_year')
        }),
        ('Academic', {
            'fields': ('enrollment_date', 'graduation_date', 'gpa', 'total_credits', 'completed_credits')
        }),
        ('Contact', {
            'fields': ('emergency_contact', 'emergency_phone')
        }),
        ('Status', {
            'fields': ('is_active',)
        })
    )


@admin.register(StudentAcademicRecord)
class StudentAcademicRecordAdmin(admin.ModelAdmin):
    """Admin interface for StudentAcademicRecord model."""
    
    list_display = ['student', 'semester', 'academic_year', 'gpa', 'credits_earned', 'status']
    list_filter = ['semester', 'academic_year', 'status', 'created_at']
    search_fields = ['student__student_id', 'student__user__username']
    ordering = ['-academic_year', '-semester']


@admin.register(StudentSkill)
class StudentSkillAdmin(admin.ModelAdmin):
    """Admin interface for StudentSkill model."""
    
    list_display = ['student', 'skill_name', 'category', 'proficiency_level', 'verified_by', 'verified_at']
    list_filter = ['category', 'proficiency_level', 'verified_at', 'created_at']
    search_fields = ['student__student_id', 'skill_name', 'verified_by__username']
    ordering = ['category', 'skill_name']


@admin.register(StudentAchievement)
class StudentAchievementAdmin(admin.ModelAdmin):
    """Admin interface for StudentAchievement model."""
    
    list_display = ['student', 'title', 'achievement_type', 'date_achieved', 'is_verified']
    list_filter = ['achievement_type', 'is_verified', 'date_achieved', 'created_at']
    search_fields = ['student__student_id', 'title', 'organization']
    ordering = ['-date_achieved']


@admin.register(StudentAttendance)
class StudentAttendanceAdmin(admin.ModelAdmin):
    """Admin interface for StudentAttendance model."""
    
    list_display = ['student', 'date', 'subject', 'status', 'recorded_by', 'recorded_at']
    list_filter = ['status', 'date', 'recorded_at']
    search_fields = ['student__student_id', 'subject', 'recorded_by__username']
    ordering = ['-date']


@admin.register(StudentNote)
class StudentNoteAdmin(admin.ModelAdmin):
    """Admin interface for StudentNote model."""
    
    list_display = ['student', 'note_type', 'title', 'is_private', 'created_by', 'created_at']
    list_filter = ['note_type', 'is_private', 'created_at']
    search_fields = ['student__student_id', 'title', 'content', 'created_by__username']
    ordering = ['-created_at']
