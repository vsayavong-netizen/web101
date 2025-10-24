from rest_framework import serializers
from .models import (
    AIAnalysis, AISecurityAudit, AISystemHealth, AICommunicationAnalysis,
    AIGrammarCheck, AIAdvisorSuggestion, AITopicSimilarity, AIProjectHealth,
    AIStudentAnalysis, AIAnalysisLog
)


class AIAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for AIAnalysis model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    project_id = serializers.CharField(source='project_group.project_id', read_only=True)
    
    class Meta:
        model = AIAnalysis
        fields = [
            'id', 'user', 'user_name', 'project_group', 'project_id',
            'analysis_type', 'input_text', 'summary', 'detailed_analysis',
            'status', 'processing_time', 'academic_year', 'created_at', 'updated_at'
        ]


class AIAnalysisCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating AI analyses."""
    
    class Meta:
        model = AIAnalysis
        fields = [
            'user', 'project_group', 'analysis_type', 'input_text',
            'academic_year'
        ]


class AISecurityAuditSerializer(serializers.ModelSerializer):
    """Serializer for AISecurityAudit model."""
    
    class Meta:
        model = AISecurityAudit
        fields = [
            'id', 'analysis', 'security_issues', 'risk_level',
            'recommendations', 'created_at', 'updated_at'
        ]


class AISystemHealthSerializer(serializers.ModelSerializer):
    """Serializer for AISystemHealth model."""
    
    class Meta:
        model = AISystemHealth
        fields = [
            'id', 'analysis', 'health_score', 'performance_metrics',
            'recommendations', 'created_at', 'updated_at'
        ]


class AICommunicationAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for AICommunicationAnalysis model."""
    
    class Meta:
        model = AICommunicationAnalysis
        fields = [
            'id', 'analysis', 'communication_score', 'sentiment_analysis',
            'recommendations', 'created_at', 'updated_at'
        ]


class AIGrammarCheckSerializer(serializers.ModelSerializer):
    """Serializer for AIGrammarCheck model."""
    
    class Meta:
        model = AIGrammarCheck
        fields = [
            'id', 'analysis', 'grammar_score', 'errors_found',
            'suggestions', 'created_at', 'updated_at'
        ]


class AIAdvisorSuggestionSerializer(serializers.ModelSerializer):
    """Serializer for AIAdvisorSuggestion model."""
    
    class Meta:
        model = AIAdvisorSuggestion
        fields = [
            'id', 'analysis', 'suggested_advisors', 'reasoning',
            'confidence_score', 'created_at', 'updated_at'
        ]


class AITopicSimilaritySerializer(serializers.ModelSerializer):
    """Serializer for AITopicSimilarity model."""
    
    class Meta:
        model = AITopicSimilarity
        fields = [
            'id', 'analysis', 'similar_topics', 'similarity_scores',
            'recommendations', 'created_at', 'updated_at'
        ]


class AIProjectHealthSerializer(serializers.ModelSerializer):
    """Serializer for AIProjectHealth model."""
    
    class Meta:
        model = AIProjectHealth
        fields = [
            'id', 'analysis', 'health_score', 'risk_factors',
            'recommendations', 'created_at', 'updated_at'
        ]


class AIStudentAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for AIStudentAnalysis model."""
    
    class Meta:
        model = AIStudentAnalysis
        fields = [
            'id', 'analysis', 'student_performance', 'strengths',
            'weaknesses', 'recommendations', 'created_at', 'updated_at'
        ]


class AIAnalysisLogSerializer(serializers.ModelSerializer):
    """Serializer for AIAnalysisLog model."""
    
    class Meta:
        model = AIAnalysisLog
        fields = [
            'id', 'analysis', 'log_level', 'message', 'tokens_used',
            'cost', 'created_at'
        ]


class AIAnalysisBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating AI analyses."""
    
    analysis_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of analysis IDs to update"
    )
    updates = serializers.DictField(
        help_text="Dictionary of fields to update"
    )


class AIAnalysisSearchSerializer(serializers.Serializer):
    """Serializer for searching AI analyses."""
    
    query = serializers.CharField(required=False, help_text="Search query")
    analysis_type = serializers.CharField(required=False, help_text="Analysis type filter")
    status = serializers.CharField(required=False, help_text="Status filter")
    user_id = serializers.IntegerField(required=False, help_text="User ID filter")
    project_group_id = serializers.IntegerField(required=False, help_text="Project group ID filter")
    academic_year = serializers.CharField(required=False, help_text="Academic year filter")
    created_from = serializers.DateTimeField(required=False, help_text="Created from date")
    created_to = serializers.DateTimeField(required=False, help_text="Created to date")


class AIAnalysisStatisticsSerializer(serializers.Serializer):
    """Serializer for AI analysis statistics."""
    
    total_analyses = serializers.IntegerField()
    completed_analyses = serializers.IntegerField()
    failed_analyses = serializers.IntegerField()
    pending_analyses = serializers.IntegerField()
    analysis_type_distribution = serializers.DictField()
    status_distribution = serializers.DictField()
    average_processing_time = serializers.FloatField()
    total_tokens_used = serializers.IntegerField()
    total_cost = serializers.FloatField()
    monthly_analysis_trend = serializers.DictField()