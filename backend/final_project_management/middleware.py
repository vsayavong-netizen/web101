"""
Custom middleware for the final project management application.
"""

from django.http import HttpResponse
import os
import mimetypes


class StaticFileMimeTypeMiddleware:
    """
    Middleware to ensure correct MIME types for static files.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # MIME type mappings
        self.mime_types = {
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.html': 'text/html',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
        }
    
    def __call__(self, request):
        try:
            response = self.get_response(request)
            
            # Only process static file requests
            if request.path.startswith('/static/'):
                # Get file extension
                path = request.path
                _, ext = os.path.splitext(path)
                
                # Set correct MIME type
                if ext in self.mime_types:
                    response['Content-Type'] = self.mime_types[ext]
                else:
                    # Try to guess MIME type
                    guessed_type, _ = mimetypes.guess_type(path)
                    if guessed_type:
                        response['Content-Type'] = guessed_type
            
            return response
        except Exception as e:
            # If there's an error, just return the response as-is
            return self.get_response(request)


class FrontendAssetMiddleware:
    """
    Middleware to handle frontend asset requests.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        try:
            # Check if this is a request for frontend assets
            if request.path.startswith('/assets/'):
                # Redirect to static files
                from django.http import HttpResponseRedirect
                new_path = request.path.replace('/assets/', '/static/assets/')
                return HttpResponseRedirect(new_path)
            
            response = self.get_response(request)
            return response
        except Exception as e:
            # If there's an error, just return the response as-is
            return self.get_response(request)


class CORSMiddleware:
    """
    Custom CORS middleware for handling cross-origin requests.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add CORS headers
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken'
        response['Access-Control-Allow-Credentials'] = 'true'
        
        return response


class MaintenanceMiddleware:
    """
    Middleware for maintenance mode.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Check if maintenance mode is enabled
        from django.conf import settings
        if getattr(settings, 'MAINTENANCE_MODE', False):
            return HttpResponse("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Maintenance Mode</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .maintenance { color: #666; }
                </style>
            </head>
            <body>
                <h1>System Maintenance</h1>
                <p class="maintenance">We are currently performing maintenance. Please try again later.</p>
            </body>
            </html>
            """, content_type='text/html')
        
        response = self.get_response(request)
        return response


class SecurityMiddleware:
    """
    Custom security middleware.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        
        return response


class AuthenticationMiddleware:
    """
    Custom authentication middleware.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Add any custom authentication logic here
        response = self.get_response(request)
        return response


class LoggingMiddleware:
    """
    Custom logging middleware.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log request
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Request: {request.method} {request.path}")
        
        response = self.get_response(request)
        
        # Log response
        logger.info(f"Response: {response.status_code}")
        
        return response


class DatabaseQueryMiddleware:
    """
    Middleware for database query monitoring.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        from django.db import connection
        
        # Reset query count
        connection.queries_log.clear()
        
        response = self.get_response(request)
        
        # Log query count
        query_count = len(connection.queries)
        if query_count > 10:  # Log if more than 10 queries
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"High query count: {query_count} queries for {request.path}")
        
        return response


class UserActivityMiddleware:
    """
    Middleware for tracking user activity.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Track user activity if user is authenticated
        if request.user.is_authenticated:
            # Add any user activity tracking logic here
            pass
        
        response = self.get_response(request)
        return response


class PerformanceMiddleware:
    """
    Middleware for performance monitoring.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        import time
        start_time = time.time()
        
        response = self.get_response(request)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Add performance header
        response['X-Processing-Time'] = str(processing_time)
        
        # Log slow requests
        if processing_time > 1.0:  # Log if processing takes more than 1 second
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Slow request: {request.path} took {processing_time:.2f}s")
        
        return response


class ErrorHandlingMiddleware:
    """
    Middleware for custom error handling.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            # Log the error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in request {request.path}: {str(e)}")
            
            # Return a custom error page
            return HttpResponse("""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Server Error</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #d32f2f; }
                </style>
            </head>
            <body>
                <h1>Server Error</h1>
                <p class="error">An error occurred while processing your request. Please try again later.</p>
            </body>
            </html>
            """, content_type='text/html', status=500)