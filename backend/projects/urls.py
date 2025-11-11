"""
Project management URL patterns
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'projects'

router = DefaultRouter()
# Register with 'projects' prefix - this will create /api/projects/projects/... URLs
# Main urls.py has path('api/projects/', include('projects.urls'))
router.register(r'projects', views.ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    # Function-based views for export/import (to avoid router action issues)
    path('export/', views.export_projects_view, name='export-projects'),
    path('import_data/', views.import_projects_view, name='import-projects'),
]