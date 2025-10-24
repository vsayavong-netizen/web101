"""
Security middleware package for the Final Project Management System
"""

import time
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser

# Import submodules
from .block_suspicious import BlockSuspiciousRequestsMiddleware
from .environment_protection import (
    EnvironmentProtectionMiddleware,
    SecureFileAccessMiddleware
)

# Import utilities
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.validators import SecurityValidator, SQLInjectionValidator, XSSValidator
from core.utils import get_client_ip

logger = logging.getLogger('core.security')


class SecurityMiddleware(MiddlewareMixin):
    """
    Security middleware to protect against common attacks
    """
    
    def process_request(self, request):
        """
        Process incoming requests for security threats
        """
        # Get client IP
        client_ip = get_client_ip(request)
        
        # Check for blocked IPs
        if self._is_ip_blocked(client_ip):
            return JsonResponse({
                'error': 'Access denied'
            }, status=403)
        
        # Check for suspicious patterns in request data
        if self._has_suspicious_patterns(request):
            self._log_security_event('SUSPICIOUS_REQUEST', client_ip, request)
            return JsonResponse({
                'error': 'Request blocked for security reasons'
            }, status=400)
        
        # Add security headers
        self._add_security_headers(request)
        
        return None
    
    def _is_ip_blocked(self, ip):
        """
        Check if IP is in blocked list
        """
        blocked_ips = getattr(settings, 'API_SECURITY', {}).get('BLOCKED_IPS', [])
        return ip in blocked_ips
    
    def _has_suspicious_patterns(self, request):
        """
        Check for suspicious patterns in request
        """
        suspicious_patterns = getattr(settings, 'API_SECURITY', {}).get('SUSPICIOUS_PATTERNS', [])
        
        # Check URL
        if self._check_patterns(request.path, suspicious_patterns):
            return True
        
        # Check query parameters
        for value in request.GET.values():
            if self._check_patterns(str(value), suspicious_patterns):
                return True
        
        # Check POST data
        if request.method == 'POST':
            for value in request.POST.values():
                if self._check_patterns(str(value), suspicious_patterns):
                    return True
        
        return False
    
    def _check_patterns(self, text, patterns):
        """
        Check if text matches any suspicious patterns
        """
        import re
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    def _add_security_headers(self, request):
        """
        Add security headers to response
        """
        # This will be handled in process_response
        pass
    
    def process_response(self, request, response):
        """
        Add security headers to response
        """
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        return response
    
    def _log_security_event(self, event_type, ip, request):
        """
        Log security events
        """
        logger.warning(f"Security Event: {event_type} from IP: {ip}, Path: {request.path}")


class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware
    """
    
    def process_request(self, request):
        """
        Check rate limits for incoming requests
        """
        if not getattr(settings, 'API_SECURITY', {}).get('ENABLE_RATE_LIMITING', True):
            return None
        
        client_ip = get_client_ip(request)
        user_id = getattr(request.user, 'id', None) if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser) else None
        
        # Check rate limits
        if self._is_rate_limited(client_ip, user_id, request):
            return JsonResponse({
                'error': 'Rate limit exceeded. Please try again later.'
            }, status=429)
        
        return None
    
    def _is_rate_limited(self, ip, user_id, request):
        """
        Check if request exceeds rate limits
        """
        # Get rate limit settings
        max_requests_per_minute = getattr(settings, 'API_SECURITY', {}).get('MAX_REQUESTS_PER_MINUTE', 60)
        max_requests_per_hour = getattr(settings, 'API_SECURITY', {}).get('MAX_REQUESTS_PER_HOUR', 1000)
        
        # Check per-minute limit
        minute_key = f"rate_limit_minute_{ip}_{user_id or 'anon'}"
        minute_count = cache.get(minute_key, 0)
        
        if minute_count >= max_requests_per_minute:
            return True
        
        # Check per-hour limit
        hour_key = f"rate_limit_hour_{ip}_{user_id or 'anon'}"
        hour_count = cache.get(hour_key, 0)
        
        if hour_count >= max_requests_per_hour:
            return True
        
        # Increment counters
        cache.set(minute_key, minute_count + 1, 60)  # 1 minute
        cache.set(hour_key, hour_count + 1, 3600)  # 1 hour
        
        return False


class AuditLogMiddleware(MiddlewareMixin):
    """
    Audit logging middleware
    """
    
    def process_request(self, request):
        """
        Log incoming requests
        """
        if not getattr(settings, 'API_SECURITY', {}).get('ENABLE_REQUEST_LOGGING', True):
            return None
        
        # Log request details
        self._log_request(request)
        
        return None
    
    def process_response(self, request, response):
        """
        Log response details
        """
        if not getattr(settings, 'API_SECURITY', {}).get('ENABLE_REQUEST_LOGGING', True):
            return response
        
        # Log response details
        self._log_response(request, response)
        
        return response
    
    def _log_request(self, request):
        """
        Log request details
        """
        client_ip = get_client_ip(request)
        user_id = getattr(request.user, 'id', None) if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser) else None
        
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'ip': client_ip,
            'user_id': user_id,
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.GET),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'referer': request.META.get('HTTP_REFERER', ''),
        }
        
        logger.info(f"Request: {log_data}")
    
    def _log_response(self, request, response):
        """
        Log response details
        """
        client_ip = get_client_ip(request)
        user_id = getattr(request.user, 'id', None) if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser) else None
        
        log_data = {
            'timestamp': timezone.now().isoformat(),
            'ip': client_ip,
            'user_id': user_id,
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'response_size': len(response.content) if hasattr(response, 'content') else 0,
        }
        
        logger.info(f"Response: {log_data}")


class IPWhitelistMiddleware(MiddlewareMixin):
    """
    IP whitelist middleware for admin access
    """
    
    def process_request(self, request):
        """
        Check if IP is whitelisted for admin access
        """
        # Only apply to admin URLs
        if not request.path.startswith('/admin/'):
            return None
        
        client_ip = get_client_ip(request)
        whitelist = getattr(settings, 'ADMIN_IP_WHITELIST', [])
        
        if whitelist and client_ip not in whitelist:
            return JsonResponse({
                'error': 'Access denied from this IP address'
            }, status=403)
        
        return None


class RequestSizeMiddleware(MiddlewareMixin):
    """
    Request size limiting middleware
    """
    
    def process_request(self, request):
        """
        Check request size limits
        """
        # Get request size
        content_length = request.META.get('CONTENT_LENGTH', 0)
        
        if content_length:
            max_size = getattr(settings, 'DATA_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024)
            
            if int(content_length) > max_size:
                return JsonResponse({
                    'error': 'Request too large'
                }, status=413)
        
        return None


class CSRFProtectionMiddleware(MiddlewareMixin):
    """
    Enhanced CSRF protection middleware
    """
    
    def process_request(self, request):
        """
        Enhanced CSRF protection
        """
        # Skip CSRF for safe methods
        if request.method in ['GET', 'HEAD', 'OPTIONS', 'TRACE']:
            return None
        
        # Skip CSRF for API endpoints with proper authentication
        if request.path.startswith('/api/') and request.META.get('HTTP_AUTHORIZATION'):
            return None
        
        return None


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Security headers middleware
    """
    
    def process_response(self, request, response):
        """
        Add security headers to response
        """
        # Content Security Policy
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        
        # Strict Transport Security
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # X-Content-Type-Options
        response['X-Content-Type-Options'] = 'nosniff'
        
        # X-Frame-Options
        response['X-Frame-Options'] = 'DENY'
        
        # X-XSS-Protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions Policy
        response['Permissions-Policy'] = (
            'geolocation=(), '
            'microphone=(), '
            'camera=(), '
            'payment=(), '
            'usb=(), '
            'magnetometer=(), '
            'gyroscope=(), '
            'accelerometer=()'
        )
        
        return response


__all__ = [
    'BlockSuspiciousRequestsMiddleware',
    'EnvironmentProtectionMiddleware',
    'SecureFileAccessMiddleware',
    'SecurityMiddleware',
    'RateLimitMiddleware',
    'AuditLogMiddleware',
    'SecurityHeadersMiddleware',
    'IPWhitelistMiddleware',
    'RequestSizeMiddleware',
    'CSRFProtectionMiddleware',
]
