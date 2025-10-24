from django.contrib import admin
from .models import (
    Notification, NotificationTemplate, NotificationSubscription, NotificationLog,
    NotificationAnnouncement, NotificationPreference
)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin interface for Notification model."""
    pass


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    """Admin interface for NotificationTemplate model."""
    pass


@admin.register(NotificationSubscription)
class NotificationSubscriptionAdmin(admin.ModelAdmin):
    """Admin interface for NotificationSubscription model."""
    pass


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    """Admin interface for NotificationLog model."""
    pass


@admin.register(NotificationAnnouncement)
class NotificationAnnouncementAdmin(admin.ModelAdmin):
    """Admin interface for NotificationAnnouncement model."""
    pass


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """Admin interface for NotificationPreference model."""
    pass