"""
URLs for system monitoring
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import views_websocket

router = DefaultRouter()
router.register(r'metrics', views.SystemMetricsViewSet, basename='system-metrics')
router.register(r'request-logs', views.RequestLogViewSet, basename='request-logs')
router.register(r'error-logs', views.ErrorLogViewSet, basename='error-logs')
router.register(r'performance', views.PerformanceMetricViewSet, basename='performance-metrics')
router.register(r'health-history', views.HealthCheckViewSet, basename='health-history')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', views.health_check, name='health-check'),
    path('system-metrics/', views.system_metrics, name='system-metrics-summary'),
    # WebSocket monitoring endpoints
    path('websocket/metrics/', views_websocket.websocket_metrics, name='websocket-metrics'),
    path('websocket/active-connections/', views_websocket.websocket_active_connections, name='websocket-active-connections'),
]

