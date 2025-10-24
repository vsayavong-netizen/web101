from django.contrib import admin
from .models import Classroom, ClassroomStudent, ClassroomSchedule


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    """Admin interface for Classroom model."""
    
    list_display = ['name', 'major', 'academic_year', 'semester', 'capacity', 'is_active', 'created_at']
    list_filter = ['major', 'academic_year', 'semester', 'is_active', 'created_at']
    search_fields = ['name', 'major__name', 'building', 'room_number']
    ordering = ['academic_year', 'semester', 'name']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'major', 'academic_year', 'semester', 'capacity')
        }),
        ('Location', {
            'fields': ('building', 'room_number')
        }),
        ('Status', {
            'fields': ('is_active',)
        })
    )


@admin.register(ClassroomStudent)
class ClassroomStudentAdmin(admin.ModelAdmin):
    """Admin interface for ClassroomStudent model."""
    
    list_display = ['classroom', 'student', 'enrollment_date', 'is_active', 'created_at']
    list_filter = ['is_active', 'enrollment_date', 'created_at']
    search_fields = ['classroom__name', 'student__first_name', 'student__last_name', 'student__username']
    ordering = ['classroom', 'student']


@admin.register(ClassroomSchedule)
class ClassroomScheduleAdmin(admin.ModelAdmin):
    """Admin interface for ClassroomSchedule model."""
    
    list_display = ['classroom', 'day_of_week', 'start_time', 'end_time', 'subject', 'instructor', 'created_at']
    list_filter = ['day_of_week', 'classroom__major', 'created_at']
    search_fields = ['classroom__name', 'subject', 'instructor__first_name', 'instructor__last_name']
    ordering = ['classroom', 'day_of_week', 'start_time']