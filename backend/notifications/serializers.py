from rest_framework import serializers
from .models import (
    Notification, NotificationTemplate, NotificationSubscription,
    NotificationLog, NotificationAnnouncement, NotificationPreference
)


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model."""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority',
            'recipient_id', 'recipient_type', 'is_read', 'read_at',
            'is_archived', 'archived_at', 'action_url', 'action_text',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new notifications."""
    
    class Meta:
        model = Notification
        fields = [
            'title', 'message', 'notification_type', 'priority',
            'recipient_id', 'recipient_type', 'action_url', 'action_text'
        ]


class NotificationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating notification status."""
    
    class Meta:
        model = Notification
        fields = [
            'is_read', 'is_archived'
        ]


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for NotificationTemplate model."""
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'title_template', 'message_template',
            'notification_type', 'priority', 'variables', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationTemplateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new notification templates."""
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'name', 'title_template', 'message_template',
            'notification_type', 'priority', 'variables'
        ]


class NotificationSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for NotificationSubscription model."""
    
    class Meta:
        model = NotificationSubscription
        fields = [
            'id', 'user_id', 'notification_type', 'is_enabled',
            'email_enabled', 'push_enabled', 'sms_enabled',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for NotificationLog model."""
    
    notification_title = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificationLog
        fields = [
            'id', 'notification', 'notification_title', 'delivery_method',
            'status', 'error_message', 'delivered_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_notification_title(self, obj):
        """Get notification title."""
        return obj.notification.title


class NotificationAnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for NotificationAnnouncement model."""
    
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = NotificationAnnouncement
        fields = [
            'id', 'title', 'content', 'announcement_type', 'priority',
            'is_published', 'published_at', 'expires_at', 'target_roles',
            'target_users', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_active(self, obj):
        """Get active status."""
        return obj.is_active


class NotificationAnnouncementCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new announcements."""
    
    class Meta:
        model = NotificationAnnouncement
        fields = [
            'title', 'content', 'announcement_type', 'priority',
            'target_roles', 'target_users', 'expires_at'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreference model."""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user_id', 'email_notifications', 'push_notifications',
            'sms_notifications', 'project_updates', 'milestone_reminders',
            'system_alerts', 'security_alerts', 'maintenance_notices',
            'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationPreferenceUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating notification preferences."""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'email_notifications', 'push_notifications', 'sms_notifications',
            'project_updates', 'milestone_reminders', 'system_alerts',
            'security_alerts', 'maintenance_notices', 'quiet_hours_enabled',
            'quiet_hours_start', 'quiet_hours_end'
        ]


class NotificationBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk updating notifications."""
    
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of notification IDs to update"
    )
    updates = serializers.DictField(
        help_text="Dictionary of fields to update"
    )
    
    def validate_updates(self, value):
        """Validate update fields."""
        allowed_fields = [
            'is_read', 'is_archived'
        ]
        
        for field in value.keys():
            if field not in allowed_fields:
                raise serializers.ValidationError(f"Field '{field}' is not allowed for bulk update.")
        
        return value


class NotificationSearchSerializer(serializers.Serializer):
    """Serializer for notification search parameters."""
    
    query = serializers.CharField(required=False, help_text="Search query")
    notification_type = serializers.CharField(required=False, help_text="Filter by notification type")
    priority = serializers.CharField(required=False, help_text="Filter by priority")
    is_read = serializers.BooleanField(required=False, help_text="Filter by read status")
    is_archived = serializers.BooleanField(required=False, help_text="Filter by archived status")
    recipient_id = serializers.CharField(required=False, help_text="Filter by recipient ID")
    created_from = serializers.DateTimeField(required=False, help_text="Filter by creation date from")
    created_to = serializers.DateTimeField(required=False, help_text="Filter by creation date to")


class NotificationStatisticsSerializer(serializers.Serializer):
    """Serializer for notification statistics."""
    
    total_notifications = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    read_notifications = serializers.IntegerField()
    archived_notifications = serializers.IntegerField()
    notification_type_distribution = serializers.DictField()
    priority_distribution = serializers.DictField()
    recipient_distribution = serializers.DictField()
    delivery_success_rate = serializers.FloatField()
    average_delivery_time = serializers.FloatField()
    monthly_notification_trend = serializers.DictField()
