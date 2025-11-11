"""
Views for system monitoring and health checks
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import connection, models
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
import psutil
import os
from .models import (
    SystemMetrics, RequestLog, ErrorLog, HealthCheck, PerformanceMetric
)
from .serializers import (
    SystemMetricsSerializer, RequestLogSerializer, ErrorLogSerializer,
    HealthCheckSerializer, PerformanceMetricSerializer
)
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([])  # Public endpoint
def health_check(request):
    """
    Health check endpoint for monitoring system status
    Returns 200 if healthy, 503 if unhealthy
    """
    start_time = timezone.now()
    health_status = 'healthy'
    details = {}
    
    # Check database (critical - must be available)
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            database_status = True
    except Exception as e:
        database_status = False
        health_status = 'unhealthy'
        details['database_error'] = str(e)
        # If database is down, return 503 immediately
        response_time = (timezone.now() - start_time).total_seconds() * 1000
        return Response({
            'status': health_status,
            'timestamp': timezone.now().isoformat(),
            'checks': {
                'database': database_status,
                'cache': None,
                'redis': None,
            },
            'system': {},
            'response_time_ms': round(response_time, 2),
            'error': 'Database unavailable'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    # Check cache (optional - degrade if unavailable)
    try:
        cache.set('health_check_test', 'ok', 10)
        cache_status = cache.get('health_check_test') == 'ok'
        cache.delete('health_check_test')
    except Exception as e:
        cache_status = False
        # Cache is optional - only degrade, don't fail
        if health_status == 'healthy':
            health_status = 'degraded'
        details['cache_note'] = 'Cache not available (optional)'
    
    # Check Redis (if available - optional, don't fail if unavailable)
    redis_status = True
    try:
        from django.core.cache import caches
        redis_cache = caches.get('default')
        if hasattr(redis_cache, 'client'):
            try:
                redis_cache.client.ping()
            except:
                # Redis not available but not critical
                redis_status = False
                health_status = 'degraded' if health_status == 'healthy' else health_status
    except Exception as e:
        # Redis is optional - don't fail health check
        redis_status = False
        health_status = 'degraded' if health_status == 'healthy' else health_status
        details['redis_note'] = 'Redis not available (optional)'
    
    # Get system metrics
    disk_usage = None
    memory_usage = None
    cpu_usage = None
    
    try:
        # Disk usage (try root, fallback to current directory)
        try:
            disk = psutil.disk_usage('/')
        except:
            try:
                import os
                disk = psutil.disk_usage(os.getcwd())
            except:
                disk = None
        
        if disk:
            disk_usage = (disk.used / disk.total) * 100
            # Check thresholds (only degrade, don't fail)
            if disk_usage > 90:
                health_status = 'degraded' if health_status == 'healthy' else health_status
        
        # Memory usage
        try:
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            if memory_usage > 90:
                health_status = 'degraded' if health_status == 'healthy' else health_status
        except:
            pass
        
        # CPU usage
        try:
            cpu_usage = psutil.cpu_percent(interval=0.1)
            if cpu_usage > 90:
                health_status = 'degraded' if health_status == 'healthy' else health_status
        except:
            pass
            
    except Exception as e:
        # System metrics are optional - don't fail health check
        logger.warning(f"Could not get system metrics: {e}")
    
    response_time = (timezone.now() - start_time).total_seconds() * 1000
    
    # Store health check result
    try:
        HealthCheck.objects.create(
            status=health_status,
            database_status=database_status,
            cache_status=cache_status,
            redis_status=redis_status,
            disk_usage=disk_usage,
            memory_usage=memory_usage,
            cpu_usage=cpu_usage,
            response_time=response_time,
            details=details,
        )
    except Exception as e:
        logger.error(f"Error storing health check: {e}")
    
    response_data = {
        'status': health_status,
        'timestamp': timezone.now().isoformat(),
        'checks': {
            'database': database_status,
            'cache': cache_status,
            'redis': redis_status,
        },
        'system': {
            'disk_usage': round(disk_usage, 2) if disk_usage else None,
            'memory_usage': round(memory_usage, 2) if memory_usage else None,
            'cpu_usage': round(cpu_usage, 2) if cpu_usage else None,
        },
        'response_time_ms': round(response_time, 2),
    }
    
    # Return 200 for healthy and degraded, 503 only for unhealthy
    # Degraded means some optional services are down but core functionality works
    if health_status == 'unhealthy':
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE
    else:
        # Both 'healthy' and 'degraded' return 200 OK
        # The status field in response indicates the actual health state
        http_status = status.HTTP_200_OK
    
    return Response(response_data, status=http_status)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def system_metrics(request):
    """Get system metrics summary"""
    hours = int(request.GET.get('hours', 24))
    since = timezone.now() - timedelta(hours=hours)
    
    # Get metrics
    metrics = SystemMetrics.objects.filter(timestamp__gte=since)
    
    # Aggregate by type
    aggregated = {}
    for metric_type, _ in SystemMetrics.METRIC_TYPES:
        type_metrics = metrics.filter(metric_type=metric_type)
        if type_metrics.exists():
            from django.db.models import Avg, Min, Max
            aggregated[metric_type] = {
                'count': type_metrics.count(),
                'avg': type_metrics.aggregate(Avg('value'))['value__avg'],
                'min': type_metrics.aggregate(Min('value'))['value__min'],
                'max': type_metrics.aggregate(Max('value'))['value__max'],
            }
    
    # Get request statistics
    from django.db.models import Avg
    request_logs = RequestLog.objects.filter(timestamp__gte=since)
    request_stats = {
        'total_requests': request_logs.count(),
        'by_method': {},
        'by_status': {},
        'avg_response_time': request_logs.aggregate(Avg('response_time'))['response_time__avg'],
    }
    
    for method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']:
        count = request_logs.filter(method=method).count()
        if count > 0:
            request_stats['by_method'][method] = count
    
    for status_code in [200, 201, 400, 401, 403, 404, 500]:
        count = request_logs.filter(status_code=status_code).count()
        if count > 0:
            request_stats['by_status'][status_code] = count
    
    # Get error statistics
    error_logs = ErrorLog.objects.filter(timestamp__gte=since, resolved=False)
    error_stats = {
        'total_errors': error_logs.count(),
        'by_level': {},
    }
    
    for level, _ in ErrorLog.ERROR_LEVELS:
        count = error_logs.filter(level=level).count()
        if count > 0:
            error_stats['by_level'][level] = count
    
    return Response({
        'period_hours': hours,
        'since': since.isoformat(),
        'metrics': aggregated,
        'requests': request_stats,
        'errors': error_stats,
    })


class SystemMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for system metrics"""
    queryset = SystemMetrics.objects.all()
    serializer_class = SystemMetricsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['metric_type', 'endpoint']
    ordering = ['-timestamp']
    ordering_fields = ['timestamp', 'value']


class RequestLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for request logs"""
    queryset = RequestLog.objects.all()
    serializer_class = RequestLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['method', 'status_code', 'user']
    search_fields = ['path', 'ip_address']
    ordering = ['-timestamp']
    ordering_fields = ['timestamp', 'response_time']


class ErrorLogViewSet(viewsets.ModelViewSet):
    """ViewSet for error logs"""
    queryset = ErrorLog.objects.all()
    serializer_class = ErrorLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['level', 'resolved', 'user']
    search_fields = ['message', 'exception_type', 'path']
    ordering = ['-timestamp']
    ordering_fields = ['timestamp', 'level']


class PerformanceMetricViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for performance metrics"""
    queryset = PerformanceMetric.objects.all()
    serializer_class = PerformanceMetricSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['endpoint', 'method']
    ordering = ['-timestamp']
    ordering_fields = ['timestamp', 'response_time', 'database_time']


class HealthCheckViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for health check history"""
    queryset = HealthCheck.objects.all()
    serializer_class = HealthCheckSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['status']
    ordering = ['-timestamp']
    ordering_fields = ['timestamp']
