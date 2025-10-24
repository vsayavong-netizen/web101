from django.db import models
from django.utils import timezone


class NotificationType(models.TextChoices):
    """Notification type choices."""
    INFO = 'info', 'Information'
    SUCCESS = 'success', 'Success'
    WARNING = 'warning', 'Warning'
    ERROR = 'error', 'Error'
    SYSTEM = 'system', 'System'


class NotificationPriority(models.TextChoices):
    """Notification priority choices."""
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class Notification(models.Model):
    """Notification model for system notifications."""
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.INFO)
    priority = models.CharField(max_length=20, choices=NotificationPriority.choices, default=NotificationPriority.MEDIUM)
    
    # Recipients
    recipient_id = models.CharField(max_length=50)  # User ID or role
    recipient_type = models.CharField(max_length=20, default='user')  # user, role, all
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(blank=True, null=True)
    
    # Action
    action_url = models.URLField(blank=True, null=True)
    action_text = models.CharField(max_length=100, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.recipient_id}"
    
    def mark_as_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.read_at = timezone.now()
        self.save()
    
    def mark_as_archived(self):
        """Mark notification as archived."""
        self.is_archived = True
        self.archived_at = timezone.now()
        self.save()


class NotificationTemplate(models.Model):
    """Template for creating notifications."""
    
    name = models.CharField(max_length=200)
    title_template = models.CharField(max_length=200)
    message_template = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices, default=NotificationType.INFO)
    priority = models.CharField(max_length=20, choices=NotificationPriority.choices, default=NotificationPriority.MEDIUM)
    
    # Template variables
    variables = models.JSONField(default=list)  # List of required variables
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_templates'
        verbose_name = 'Notification Template'
        verbose_name_plural = 'Notification Templates'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.notification_type})"


class NotificationSubscription(models.Model):
    """User notification subscription preferences."""
    
    user_id = models.CharField(max_length=50)
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    is_enabled = models.BooleanField(default=True)
    
    # Delivery methods
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_subscriptions'
        verbose_name = 'Notification Subscription'
        verbose_name_plural = 'Notification Subscriptions'
        unique_together = ['user_id', 'notification_type']
        ordering = ['user_id', 'notification_type']
    
    def __str__(self):
        return f"{self.user_id} - {self.notification_type}"


class NotificationLog(models.Model):
    """Log of notification delivery attempts."""
    
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='delivery_logs')
    delivery_method = models.CharField(max_length=20)  # email, push, sms
    status = models.CharField(max_length=20, default='pending')  # pending, sent, failed, bounced
    error_message = models.TextField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notification_logs'
        verbose_name = 'Notification Log'
        verbose_name_plural = 'Notification Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification.title} - {self.delivery_method} ({self.status})"


class NotificationAnnouncement(models.Model):
    """System announcements and notices."""
    
    title = models.CharField(max_length=200)
    content = models.TextField()
    announcement_type = models.CharField(max_length=20, default='general')  # general, maintenance, security, etc.
    priority = models.CharField(max_length=20, choices=NotificationPriority.choices, default=NotificationPriority.MEDIUM)
    
    # Display settings
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    # Audience
    target_roles = models.JSONField(default=list)  # List of roles to show to
    target_users = models.JSONField(default=list)  # List of specific user IDs
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_announcements'
        verbose_name = 'Notification Announcement'
        verbose_name_plural = 'Notification Announcements'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.announcement_type})"
    
    @property
    def is_active(self):
        """Check if announcement is currently active."""
        if not self.is_published:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True


class NotificationPreference(models.Model):
    """User notification preferences."""
    
    user_id = models.CharField(max_length=50)
    
    # General preferences
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # Specific notification types
    project_updates = models.BooleanField(default=True)
    milestone_reminders = models.BooleanField(default=True)
    system_alerts = models.BooleanField(default=True)
    security_alerts = models.BooleanField(default=True)
    maintenance_notices = models.BooleanField(default=True)
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(blank=True, null=True)
    quiet_hours_end = models.TimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
        unique_together = ['user_id']
        ordering = ['user_id']
    
    def __str__(self):
        return f"Preferences for {self.user_id}"
