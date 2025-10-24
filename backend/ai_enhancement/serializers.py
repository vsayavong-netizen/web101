from rest_framework import serializers
from .models import (
    PlagiarismCheck, PlagiarismMatch, GrammarCheck, GrammarError,
    TopicSuggestion, TopicSimilarity, AIEnhancementLog, AIEnhancementSettings
)
from accounts.models import User
from projects.models import ProjectGroup


class PlagiarismCheckSerializer(serializers.ModelSerializer):
    """Serializer for PlagiarismCheck model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    project_id = serializers.CharField(source='project.project_id', read_only=True)
    
    class Meta:
        model = PlagiarismCheck
        fields = [
            'id', 'user', 'user_name', 'project', 'project_id', 'check_type',
            'document_name', 'document_content', 'file_path', 'status',
            'similarity_score', 'is_plagiarized', 'confidence_score',
            'processing_time', 'tokens_used', 'cost', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class PlagiarismCheckCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating PlagiarismCheck."""
    
    class Meta:
        model = PlagiarismCheck
        fields = [
            'project', 'check_type', 'document_name', 'document_content',
            'file_path'
        ]


class PlagiarismMatchSerializer(serializers.ModelSerializer):
    """Serializer for PlagiarismMatch model."""
    
    class Meta:
        model = PlagiarismMatch
        fields = [
            'id', 'plagiarism_check', 'source_url', 'source_title',
            'similarity_percentage', 'matched_text', 'context_before',
            'context_after', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class GrammarCheckSerializer(serializers.ModelSerializer):
    """Serializer for GrammarCheck model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    project_id = serializers.CharField(source='project.project_id', read_only=True)
    
    class Meta:
        model = GrammarCheck
        fields = [
            'id', 'user', 'user_name', 'project', 'project_id', 'check_type',
            'text_content', 'language', 'status', 'total_errors', 'total_suggestions',
            'grammar_score', 'processing_time', 'tokens_used', 'cost',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class GrammarCheckCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating GrammarCheck."""
    
    class Meta:
        model = GrammarCheck
        fields = [
            'project', 'check_type', 'text_content', 'language'
        ]


class GrammarErrorSerializer(serializers.ModelSerializer):
    """Serializer for GrammarError model."""
    
    class Meta:
        model = GrammarError
        fields = [
            'id', 'grammar_check', 'error_type', 'severity', 'original_text',
            'suggested_text', 'explanation', 'start_position', 'end_position',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TopicSuggestionSerializer(serializers.ModelSerializer):
    """Serializer for TopicSuggestion model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    project_id = serializers.CharField(source='project.project_id', read_only=True)
    
    class Meta:
        model = TopicSuggestion
        fields = [
            'id', 'user', 'user_name', 'project', 'project_id', 'suggestion_type',
            'user_input', 'status', 'suggestions', 'confidence_scores',
            'keywords', 'processing_time', 'tokens_used', 'cost',
            'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class TopicSuggestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating TopicSuggestion."""
    
    class Meta:
        model = TopicSuggestion
        fields = [
            'project', 'suggestion_type', 'user_input'
        ]


class TopicSimilaritySerializer(serializers.ModelSerializer):
    """Serializer for TopicSimilarity model."""
    
    class Meta:
        model = TopicSimilarity
        fields = [
            'id', 'topic_suggestion', 'similar_topic', 'similarity_score',
            'source', 'description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AIEnhancementLogSerializer(serializers.ModelSerializer):
    """Serializer for AIEnhancementLog model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = AIEnhancementLog
        fields = [
            'id', 'user', 'user_name', 'service_type', 'request_data',
            'response_data', 'processing_time', 'tokens_used', 'cost',
            'success', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AIEnhancementSettingsSerializer(serializers.ModelSerializer):
    """Serializer for AIEnhancementSettings model."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = AIEnhancementSettings
        fields = [
            'id', 'user', 'user_name', 'plagiarism_threshold', 'plagiarism_notifications',
            'grammar_language', 'grammar_notifications', 'topic_suggestion_count',
            'topic_suggestion_notifications', 'auto_processing', 'cost_limit',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlagiarismCheckRequestSerializer(serializers.Serializer):
    """Serializer for plagiarism check request."""
    
    project_id = serializers.CharField()
    document_name = serializers.CharField()
    document_content = serializers.CharField()
    check_type = serializers.ChoiceField(choices=PlagiarismCheck.CHECK_TYPES)
    file_path = serializers.CharField(required=False, allow_blank=True)


class GrammarCheckRequestSerializer(serializers.Serializer):
    """Serializer for grammar check request."""
    
    project_id = serializers.CharField()
    text_content = serializers.CharField()
    check_type = serializers.ChoiceField(choices=GrammarCheck.CHECK_TYPES)
    language = serializers.CharField(default='en')


class TopicSuggestionRequestSerializer(serializers.Serializer):
    """Serializer for topic suggestion request."""
    
    project_id = serializers.CharField()
    user_input = serializers.CharField()
    suggestion_type = serializers.ChoiceField(choices=TopicSuggestion.SUGGESTION_TYPES)


class TopicSimilarityRequestSerializer(serializers.Serializer):
    """Serializer for topic similarity request."""
    
    topic_suggestion_id = serializers.UUIDField()
    similar_topic = serializers.CharField()
    source = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)


class AIEnhancementSearchSerializer(serializers.Serializer):
    """Serializer for AI enhancement search."""
    
    query = serializers.CharField(required=False)
    service_type = serializers.ChoiceField(choices=AIEnhancementLog.SERVICE_TYPES, required=False)
    user_id = serializers.IntegerField(required=False)
    project_id = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)


class AIEnhancementStatisticsSerializer(serializers.Serializer):
    """Serializer for AI enhancement statistics."""
    
    total_checks = serializers.IntegerField()
    plagiarism_checks = serializers.IntegerField()
    grammar_checks = serializers.IntegerField()
    topic_suggestions = serializers.IntegerField()
    success_rate = serializers.FloatField()
    average_processing_time = serializers.FloatField()
    total_tokens_used = serializers.IntegerField()
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=4)
    service_usage = serializers.DictField()
    monthly_usage = serializers.DictField()
    top_users = serializers.ListField()
    recent_activity = serializers.ListField()


class PlagiarismResultSerializer(serializers.Serializer):
    """Serializer for plagiarism check results."""
    
    similarity_score = serializers.FloatField()
    is_plagiarized = serializers.BooleanField()
    confidence_score = serializers.FloatField()
    matches = serializers.ListField()
    processing_time = serializers.FloatField()
    tokens_used = serializers.IntegerField()
    cost = serializers.DecimalField(max_digits=10, decimal_places=4)


class GrammarResultSerializer(serializers.Serializer):
    """Serializer for grammar check results."""
    
    total_errors = serializers.IntegerField()
    total_suggestions = serializers.IntegerField()
    grammar_score = serializers.FloatField()
    errors = serializers.ListField()
    processing_time = serializers.FloatField()
    tokens_used = serializers.IntegerField()
    cost = serializers.DecimalField(max_digits=10, decimal_places=4)


class TopicSuggestionResultSerializer(serializers.Serializer):
    """Serializer for topic suggestion results."""
    
    suggestions = serializers.ListField()
    confidence_scores = serializers.ListField()
    keywords = serializers.ListField()
    similarities = serializers.ListField()
    processing_time = serializers.FloatField()
    tokens_used = serializers.IntegerField()
    cost = serializers.DecimalField(max_digits=10, decimal_places=4)
