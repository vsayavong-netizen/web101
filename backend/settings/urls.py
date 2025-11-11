from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'academic-years', views.AcademicYearViewSet, basename='academic-year')

urlpatterns = [
    # Router URLs (ViewSets)
    path('', include(router.urls)),
    
    # Function-based views
    path('system/', views.system_settings, name='system-settings'),
    path('system/update/', views.update_settings, name='update-settings'),
    path('security-audit/<str:academic_year>/', views.security_audit_timestamp, name='security-audit-timestamp'),
    path('security-audit/', views.security_audit_timestamp, name='security-audit-timestamp-default'),
    
    # App settings endpoints
    path('app-settings/<str:setting_type>/<str:academic_year>/', views.app_settings, name='app-settings'),
    path('app-settings/<str:setting_type>/', views.app_settings, name='app-settings-default'),
]
