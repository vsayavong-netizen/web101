"""
Middleware for performance monitoring and request logging
"""
import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.db import connection
from django.core.cache import cache
from .models import RequestLog, PerformanceMetric, SystemMetrics
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """Monitor request performance and log metrics"""
    
    def process_request(self, request):
        """Record start time and initial query count"""
        request._start_time = time.time()
        request._initial_queries = len(connection.queries)
        # Cache info tracking (may not be available in all cache backends)
        try:
            request._cache_info = {
                'hits': getattr(cache, '_cache_hits', 0),
                'misses': getattr(cache, '_cache_misses', 0),
            }
        except:
            request._cache_info = {'hits': 0, 'misses': 0}
        return None
    
    def process_response(self, request, response):
        """Log performance metrics after response"""
        if not hasattr(request, '_start_time'):
            return response
        
        # Calculate metrics
        response_time = (time.time() - request._start_time) * 1000  # Convert to milliseconds
        query_count = len(connection.queries) - request._initial_queries
        
        # Calculate database time
        db_time = sum(float(q['time']) for q in connection.queries[-query_count:]) * 1000 if query_count > 0 else 0
        
        # Get cache info (may not be available in all cache backends)
        try:
            cache_hits = getattr(cache, '_cache_hits', 0) - request._cache_info.get('hits', 0)
            cache_misses = getattr(cache, '_cache_misses', 0) - request._cache_info.get('misses', 0)
        except:
            cache_hits = 0
            cache_misses = 0
        
        # Skip logging for static files and health checks
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return response
        
        if request.path.startswith('/api/monitoring/health/'):
            return response
        
        try:
            # Log request
            user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
            
            RequestLog.objects.create(
                method=request.method,
                path=request.path,
                query_params=dict(request.GET),
                status_code=response.status_code,
                response_time=response_time,
                user=user,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                referer=request.META.get('HTTP_REFERER', ''),
                response_size=len(response.content) if hasattr(response, 'content') else None,
            )
            
            # Log performance metric for API endpoints
            if request.path.startswith('/api/'):
                PerformanceMetric.objects.create(
                    endpoint=request.path,
                    method=request.method,
                    response_time=response_time,
                    database_time=db_time,
                    query_count=query_count,
                    cache_hits=cache_hits,
                    cache_misses=cache_misses,
                    user=user,
                )
            
            # Log system metrics
            SystemMetrics.objects.create(
                metric_type='response_time',
                value=response_time,
                metadata={
                    'endpoint': request.path,
                    'method': request.method,
                    'status_code': response.status_code,
                },
                endpoint=request.path,
                user=user,
            )
            
            SystemMetrics.objects.create(
                metric_type='request_count',
                value=1,
                metadata={
                    'method': request.method,
                    'status_code': response.status_code,
                },
                endpoint=request.path,
                user=user,
            )
            
            # Log slow requests
            if response_time > 1000:  # More than 1 second
                logger.warning(
                    f"Slow request: {request.method} {request.path} took {response_time:.2f}ms"
                )
            
            # Log high query count
            if query_count > 20:
                logger.warning(
                    f"High query count: {request.method} {request.path} executed {query_count} queries"
                )
                
        except Exception as e:
            # Don't break the request if logging fails
            logger.error(f"Error in performance monitoring: {e}")
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ErrorLoggingMiddleware(MiddlewareMixin):
    """Log errors and exceptions"""
    
    def process_exception(self, request, exception):
        """Log exceptions"""
        import traceback
        
        try:
            user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
            
            from .models import ErrorLog
            
            ErrorLog.objects.create(
                level='ERROR',
                message=str(exception),
                exception_type=type(exception).__name__,
                traceback=traceback.format_exc(),
                path=request.path,
                method=request.method,
                user=user,
                ip_address=self.get_client_ip(request),
            )
        except Exception as e:
            logger.error(f"Error in error logging: {e}")
        
        return None
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

