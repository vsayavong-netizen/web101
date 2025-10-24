from django.contrib import admin
from .models import (
    Major, MajorRequirement, MajorSpecialization
)


@admin.register(Major)
class MajorAdmin(admin.ModelAdmin):
    """Admin interface for Major model."""
    
    list_display = ['name', 'abbreviation', 'degree_level', 'is_active', 'created_at']
    list_filter = ['degree_level', 'is_active', 'created_at']
    search_fields = ['name', 'abbreviation', 'description']
    ordering = ['name']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'abbreviation', 'description', 'degree_level')
        }),
        ('Status', {
            'fields': ('is_active',)
        })
    )


@admin.register(MajorRequirement)
class MajorRequirementAdmin(admin.ModelAdmin):
    """Admin interface for MajorRequirement model."""
    
    list_display = ['major', 'requirement_type', 'requirement_value', 'is_mandatory', 'created_at']
    list_filter = ['requirement_type', 'is_mandatory', 'created_at']
    search_fields = ['major__name', 'requirement_type', 'requirement_value']
    ordering = ['major', 'requirement_type']


@admin.register(MajorSpecialization)
class MajorSpecializationAdmin(admin.ModelAdmin):
    """Admin interface for MajorSpecialization model."""
    
    list_display = ['major', 'name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['major__name', 'name', 'description']
    ordering = ['major', 'name']
