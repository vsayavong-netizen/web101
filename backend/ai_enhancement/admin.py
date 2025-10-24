from django.contrib import admin
from .models import (
    PlagiarismCheck, PlagiarismMatch, GrammarCheck, GrammarError,
    TopicSuggestion, TopicSimilarity, AIEnhancementLog, AIEnhancementSettings
)


@admin.register(PlagiarismCheck)
class PlagiarismCheckAdmin(admin.ModelAdmin):
    list_display = ['document_name', 'user', 'project', 'check_type', 'similarity_score', 'status', 'created_at']
    list_filter = ['check_type', 'status', 'is_plagiarized', 'created_at']
    search_fields = ['document_name', 'user__username', 'project__project_id']
    readonly_fields = ['id', 'created_at', 'completed_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Check Information', {
            'fields': ('id', 'user', 'project', 'check_type', 'document_name')
        }),
        ('Content', {
            'fields': ('document_content', 'file_path')
        }),
        ('Results', {
            'fields': ('status', 'similarity_score', 'is_plagiarized', 'confidence_score')
        }),
        ('Processing', {
            'fields': ('processing_time', 'tokens_used', 'cost')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at')
        }),
    )


@admin.register(PlagiarismMatch)
class PlagiarismMatchAdmin(admin.ModelAdmin):
    list_display = ['source_title', 'similarity_percentage', 'plagiarism_check', 'created_at']
    list_filter = ['created_at']
    search_fields = ['source_title', 'source_url', 'plagiarism_check__document_name']
    readonly_fields = ['id', 'created_at']
    ordering = ['-similarity_percentage']


@admin.register(GrammarCheck)
class GrammarCheckAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'check_type', 'total_errors', 'grammar_score', 'status', 'created_at']
    list_filter = ['check_type', 'status', 'language', 'created_at']
    search_fields = ['user__username', 'project__project_id']
    readonly_fields = ['id', 'created_at', 'completed_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Check Information', {
            'fields': ('id', 'user', 'project', 'check_type', 'language')
        }),
        ('Content', {
            'fields': ('text_content',)
        }),
        ('Results', {
            'fields': ('status', 'total_errors', 'total_suggestions', 'grammar_score')
        }),
        ('Processing', {
            'fields': ('processing_time', 'tokens_used', 'cost')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at')
        }),
    )


@admin.register(GrammarError)
class GrammarErrorAdmin(admin.ModelAdmin):
    list_display = ['error_type', 'severity', 'original_text_preview', 'grammar_check', 'created_at']
    list_filter = ['error_type', 'severity', 'created_at']
    search_fields = ['original_text', 'suggested_text', 'grammar_check__user__username']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    
    def original_text_preview(self, obj):
        return obj.original_text[:50] + '...' if len(obj.original_text) > 50 else obj.original_text
    original_text_preview.short_description = 'Original Text Preview'


@admin.register(TopicSuggestion)
class TopicSuggestionAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'suggestion_type', 'status', 'created_at']
    list_filter = ['suggestion_type', 'status', 'created_at']
    search_fields = ['user__username', 'project__project_id', 'user_input']
    readonly_fields = ['id', 'created_at', 'completed_at']
    ordering = ['-created_at']


@admin.register(TopicSimilarity)
class TopicSimilarityAdmin(admin.ModelAdmin):
    list_display = ['similar_topic', 'similarity_score', 'source', 'topic_suggestion', 'created_at']
    list_filter = ['created_at']
    search_fields = ['similar_topic', 'source', 'topic_suggestion__user__username']
    readonly_fields = ['id', 'created_at']
    ordering = ['-similarity_score']


@admin.register(AIEnhancementLog)
class AIEnhancementLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'service_type', 'success', 'processing_time', 'tokens_used', 'cost', 'created_at']
    list_filter = ['service_type', 'success', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']


@admin.register(AIEnhancementSettings)
class AIEnhancementSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'plagiarism_threshold', 'grammar_language', 'auto_processing', 'created_at']
    list_filter = ['plagiarism_notifications', 'grammar_notifications', 'auto_processing', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
