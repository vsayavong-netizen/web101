"""
Custom security middleware for handling Content Security Policy (CSP) and other security headers.
"""

class SecurityHeadersMiddleware:
    """Add security headers to all responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "img-src 'self' data: https:",
            "connect-src 'self' https://eduinfo.online ws://127.0.0.1:8000 wss://eduinfo.online",
            "frame-src 'self'",
            "object-src 'none'",
            "base-uri 'self'"
        ]
        
        # Add security headers
        response['Content-Security-Policy'] = '; '.join(csp_directives)
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        if not request.is_secure():
            # Only add HSTS header if not in debug mode and using HTTPS
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response
