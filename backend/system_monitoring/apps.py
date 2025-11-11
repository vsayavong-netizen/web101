"""
App configuration for system monitoring
"""
from django.apps import AppConfig


class SystemMonitoringConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'system_monitoring'
    verbose_name = 'System Monitoring'
