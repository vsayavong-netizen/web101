from django.contrib import admin
from .models import (
    CommunicationChannel, Message, MessageReaction, MessageRead,
    CommunicationLog, CommunicationAnalysis, CommunicationSettings
)


@admin.register(CommunicationChannel)
class CommunicationChannelAdmin(admin.ModelAdmin):
    list_display = ['name', 'channel_type', 'created_by', 'is_active', 'is_public', 'created_at']
    list_filter = ['channel_type', 'is_active', 'is_public', 'created_at']
    search_fields = ['name', 'description', 'created_by__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Channel Information', {
            'fields': ('id', 'name', 'description', 'channel_type', 'project')
        }),
        ('Access Control', {
            'fields': ('created_by', 'participants', 'is_active', 'is_public')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'channel', 'message_type', 'content_preview', 'is_edited', 'created_at']
    list_filter = ['message_type', 'is_edited', 'is_deleted', 'created_at']
    search_fields = ['content', 'sender__username', 'channel__name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'edited_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Message Information', {
            'fields': ('id', 'channel', 'sender', 'message_type', 'content')
        }),
        ('Reply Information', {
            'fields': ('reply_to',)
        }),
        ('Status', {
            'fields': ('is_edited', 'is_deleted', 'edited_at')
        }),
        ('Attachment', {
            'fields': ('attachment', 'attachment_name', 'attachment_size')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'


@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'message', 'reaction_type', 'created_at']
    list_filter = ['reaction_type', 'created_at']
    search_fields = ['user__username', 'message__content']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']


@admin.register(MessageRead)
class MessageReadAdmin(admin.ModelAdmin):
    list_display = ['user', 'message', 'read_at']
    list_filter = ['read_at']
    search_fields = ['user__username', 'message__content']
    readonly_fields = ['id', 'read_at']
    ordering = ['-read_at']


@admin.register(CommunicationLog)
class CommunicationLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'channel', 'log_type', 'created_at']
    list_filter = ['log_type', 'created_at']
    search_fields = ['user__username', 'channel__name']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']


@admin.register(CommunicationAnalysis)
class CommunicationAnalysisAdmin(admin.ModelAdmin):
    list_display = ['channel', 'analysis_type', 'analyzed_by', 'confidence_score', 'created_at']
    list_filter = ['analysis_type', 'created_at']
    search_fields = ['channel__name', 'analyzed_by__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(CommunicationSettings)
class CommunicationSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_notifications', 'push_notifications', 'desktop_notifications']
    list_filter = ['email_notifications', 'push_notifications', 'desktop_notifications']
    search_fields = ['user__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
