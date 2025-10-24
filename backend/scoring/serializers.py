from rest_framework import serializers
from .models import (
    ScoringCriteria, ScoringRubric, ScoringRubricCriteria,
    ProjectScore, ProjectScoreDetail, DefenseScore
)


class ScoringCriteriaSerializer(serializers.ModelSerializer):
    """Serializer for ScoringCriteria model."""
    
    class Meta:
        model = ScoringCriteria
        fields = [
            'id', 'name', 'description', 'weight', 'max_score',
            'is_active', 'created_at', 'updated_at'
        ]


class ScoringRubricCriteriaSerializer(serializers.ModelSerializer):
    """Serializer for ScoringRubricCriteria model."""
    
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)
    
    class Meta:
        model = ScoringRubricCriteria
        fields = [
            'id', 'rubric', 'criteria', 'criteria_name', 'weight', 'order',
            'created_at', 'updated_at'
        ]


class ScoringRubricSerializer(serializers.ModelSerializer):
    """Serializer for ScoringRubric model."""
    
    criteria = ScoringRubricCriteriaSerializer(many=True, read_only=True)
    
    class Meta:
        model = ScoringRubric
        fields = [
            'id', 'name', 'description', 'project_type', 'is_active',
            'criteria', 'created_at', 'updated_at'
        ]


class ProjectScoreDetailSerializer(serializers.ModelSerializer):
    """Serializer for ProjectScoreDetail model."""
    
    criteria_name = serializers.CharField(source='criteria.name', read_only=True)
    
    class Meta:
        model = ProjectScoreDetail
        fields = [
            'id', 'project_score', 'criteria', 'criteria_name',
            'score', 'max_score', 'notes', 'created_at', 'updated_at'
        ]


class ProjectScoreSerializer(serializers.ModelSerializer):
    """Serializer for ProjectScore model."""
    
    project_id = serializers.CharField(source='project_group.project_id', read_only=True)
    scorer_name = serializers.CharField(source='scorer.get_full_name', read_only=True)
    rubric_name = serializers.CharField(source='rubric.name', read_only=True)
    details = ProjectScoreDetailSerializer(many=True, read_only=True)
    percentage_score = serializers.FloatField(read_only=True)
    
    class Meta:
        model = ProjectScore
        fields = [
            'id', 'project_group', 'project_id', 'rubric', 'rubric_name',
            'scorer', 'scorer_name', 'total_score', 'max_possible_score',
            'scoring_notes', 'is_final', 'percentage_score', 'details',
            'scored_at', 'updated_at'
        ]


class DefenseScoreSerializer(serializers.ModelSerializer):
    """Serializer for DefenseScore model."""
    
    project_id = serializers.CharField(source='project_group.project_id', read_only=True)
    scorer_name = serializers.CharField(source='scorer.get_full_name', read_only=True)
    
    class Meta:
        model = DefenseScore
        fields = [
            'id', 'project_group', 'project_id', 'scorer', 'scorer_name',
            'presentation_score', 'technical_score', 'qa_score', 'total_score',
            'feedback', 'recommendations', 'scored_at', 'updated_at'
        ]


class ScoringStatisticsSerializer(serializers.Serializer):
    """Serializer for scoring statistics."""
    
    total_scores = serializers.IntegerField()
    final_scores = serializers.IntegerField()
    total_defense_scores = serializers.IntegerField()
    average_project_score = serializers.FloatField()
    average_defense_score = serializers.FloatField()
    scores_by_rubric = serializers.DictField()