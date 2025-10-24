from django.contrib import admin
from .models import (
    DefenseSchedule, DefenseSession, DefenseEvaluation, DefenseResult,
    DefenseRoom, DefenseSettings, DefenseLog
)


@admin.register(DefenseSchedule)
class DefenseScheduleAdmin(admin.ModelAdmin):
    list_display = ['project', 'defense_date', 'defense_time', 'defense_room', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'defense_date', 'defense_room', 'created_at']
    search_fields = ['project__project_id', 'defense_room', 'notes']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['defense_date', 'defense_time']
    
    fieldsets = (
        ('Defense Information', {
            'fields': ('id', 'project', 'defense_date', 'defense_time', 'defense_room', 'defense_duration')
        }),
        ('Committee Members', {
            'fields': ('main_committee', 'second_committee', 'third_committee')
        }),
        ('Status and Notes', {
            'fields': ('status', 'notes', 'special_requirements')
        }),
        ('Created By', {
            'fields': ('created_by',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(DefenseSession)
class DefenseSessionAdmin(admin.ModelAdmin):
    list_display = ['defense_schedule', 'session_type', 'status', 'start_time', 'end_time', 'created_at']
    list_filter = ['session_type', 'status', 'created_at']
    search_fields = ['defense_schedule__project__project_id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(DefenseEvaluation)
class DefenseEvaluationAdmin(admin.ModelAdmin):
    list_display = ['defense_session', 'evaluator', 'evaluation_type', 'score', 'max_score', 'created_at']
    list_filter = ['evaluation_type', 'created_at']
    search_fields = ['evaluator__username', 'defense_session__defense_schedule__project__project_id']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(DefenseResult)
class DefenseResultAdmin(admin.ModelAdmin):
    list_display = ['defense_session', 'result_type', 'total_score', 'final_decision', 'final_decision_by', 'created_at']
    list_filter = ['result_type', 'final_decision', 'created_at']
    search_fields = ['defense_session__defense_schedule__project__project_id', 'final_decision_by__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(DefenseRoom)
class DefenseRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_type', 'capacity', 'location', 'is_available', 'created_at']
    list_filter = ['room_type', 'is_available', 'created_at']
    search_fields = ['name', 'location']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['name']


@admin.register(DefenseSettings)
class DefenseSettingsAdmin(admin.ModelAdmin):
    list_display = ['name', 'default_duration', 'pass_threshold', 'send_reminders', 'created_at']
    list_filter = ['send_reminders', 'send_notifications', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    ordering = ['name']


@admin.register(DefenseLog)
class DefenseLogAdmin(admin.ModelAdmin):
    list_display = ['defense_schedule', 'log_type', 'user', 'message_preview', 'created_at']
    list_filter = ['log_type', 'created_at']
    search_fields = ['defense_schedule__project__project_id', 'user__username', 'message']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message Preview'
