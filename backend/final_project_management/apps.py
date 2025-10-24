"""
Final Project Management app configuration.
"""

from django.apps import AppConfig


class FinalProjectManagementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'final_project_management'
    
    def ready(self):
        """Import signals when app is ready."""
        import final_project_management.signals
