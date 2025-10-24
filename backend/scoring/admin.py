from django.contrib import admin
from .models import (
    ScoringCriteria, ScoringRubric, ScoringRubricCriteria,
    ProjectScore, ProjectScoreDetail, DefenseScore
)


@admin.register(ScoringCriteria)
class ScoringCriteriaAdmin(admin.ModelAdmin):
    """Admin interface for ScoringCriteria model."""
    
    list_display = ['name', 'weight', 'max_score', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['weight', 'name']


@admin.register(ScoringRubric)
class ScoringRubricAdmin(admin.ModelAdmin):
    """Admin interface for ScoringRubric model."""
    
    list_display = ['name', 'project_type', 'is_active', 'created_at']
    list_filter = ['project_type', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'project_type']
    ordering = ['name']


@admin.register(ScoringRubricCriteria)
class ScoringRubricCriteriaAdmin(admin.ModelAdmin):
    """Admin interface for ScoringRubricCriteria model."""
    
    list_display = ['rubric', 'criteria', 'weight', 'order', 'created_at']
    list_filter = ['rubric', 'created_at']
    search_fields = ['rubric__name', 'criteria__name']
    ordering = ['rubric', 'order']


@admin.register(ProjectScore)
class ProjectScoreAdmin(admin.ModelAdmin):
    """Admin interface for ProjectScore model."""
    
    list_display = ['project_group', 'scorer', 'total_score', 'max_possible_score', 'is_final', 'scored_at']
    list_filter = ['is_final', 'scored_at', 'rubric']
    search_fields = ['project_group__project_id', 'scorer__first_name', 'scorer__last_name', 'scoring_notes']
    ordering = ['-scored_at']


@admin.register(ProjectScoreDetail)
class ProjectScoreDetailAdmin(admin.ModelAdmin):
    """Admin interface for ProjectScoreDetail model."""
    
    list_display = ['project_score', 'criteria', 'score', 'max_score', 'created_at']
    list_filter = ['criteria', 'created_at']
    search_fields = ['project_score__project_group__project_id', 'criteria__name', 'notes']
    ordering = ['project_score', 'criteria']


@admin.register(DefenseScore)
class DefenseScoreAdmin(admin.ModelAdmin):
    """Admin interface for DefenseScore model."""
    
    list_display = ['project_group', 'scorer', 'presentation_score', 'technical_score', 'qa_score', 'total_score', 'scored_at']
    list_filter = ['scored_at']
    search_fields = ['project_group__project_id', 'scorer__first_name', 'scorer__last_name', 'feedback']
    ordering = ['-scored_at']