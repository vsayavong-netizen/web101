"""
Environment Protection Middleware
Specifically protects sensitive files and directories from unauthorized access
"""

import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
from ..utils import get_client_ip

logger = logging.getLogger('core.security')


class EnvironmentProtectionMiddleware(MiddlewareMixin):
    """
    Middleware to protect sensitive environment files and directories
    """
    
    # Sensitive files and directories that should never be accessible
    PROTECTED_PATHS = [
        # Environment files
        '.env',
        '.env.local',
        '.env.production',
        '.env.development',
        '.env.test',
        '.env.staging',
        'env',
        'venv',
        '.venv',
        
        # Version control
        '.git',
        '.gitignore',
        '.gitattributes',
        '.svn',
        '.hg',
        '.bzr',
        
        # Configuration files
        'settings.py',
        'settings_local.py',
        'settings_production.py',
        'local_settings.py',
        'config.py',
        'config.json',
        'config.yaml',
        'config.yml',
        'secrets.json',
        'secrets.yaml',
        
        # Database files
        'db.sqlite3',
        'database.db',
        '*.sql',
        '*.dump',
        
        # Backup files
        '*.bak',
        '*.backup',
        '*.old',
        '*.orig',
        '*.save',
        '*.swp',
        '*.swo',
        '*~',
        
        # Log files (direct access)
        'logs/',
        '*.log',
        
        # IDE and editor files
        '.vscode',
        '.idea',
        '.vs',
        '*.sublime-project',
        '*.sublime-workspace',
        
        # Package manager files
        'package-lock.json',
        'yarn.lock',
        'Pipfile.lock',
        'poetry.lock',
        'requirements.txt',
        'Pipfile',
        
        # Docker files
        'Dockerfile',
        'docker-compose.yml',
        'docker-compose.yaml',
        '.dockerignore',
        
        # CI/CD files
        '.gitlab-ci.yml',
        '.travis.yml',
        'Jenkinsfile',
        '.circleci',
        '.github',
        
        # Python bytecode
        '__pycache__',
        '*.pyc',
        '*.pyo',
        '*.pyd',
        
        # SSH and keys
        '.ssh',
        'id_rsa',
        'id_dsa',
        '*.pem',
        '*.key',
        '*.crt',
        '*.cer',
        
        # AWS and cloud credentials
        '.aws',
        'credentials',
        '.boto',
        
        # Other sensitive files
        'wp-config.php',
        'web.config',
        '.htaccess',
        '.htpasswd',
        'phpinfo.php',
        'info.php',
    ]
    
    def process_request(self, request):
        """
        Check if request is trying to access protected paths
        """
        path = request.path.lower()
        client_ip = get_client_ip(request)
        
        # Check if path contains any protected patterns
        for protected in self.PROTECTED_PATHS:
            if protected.lower() in path:
                self._log_and_block(client_ip, path, protected)
                return JsonResponse({
                    'error': 'Access denied',
                    'code': 'PROTECTED_RESOURCE',
                    'message': 'This resource is protected and cannot be accessed'
                }, status=403)
        
        # Check for common path traversal attempts
        if self._is_path_traversal(path):
            self._log_and_block(client_ip, path, 'PATH_TRAVERSAL')
            return JsonResponse({
                'error': 'Access denied',
                'code': 'PATH_TRAVERSAL',
                'message': 'Path traversal attempts are not allowed'
            }, status=403)
        
        # Check for attempts to access parent directories
        if self._is_parent_directory_access(request.path):
            self._log_and_block(client_ip, path, 'PARENT_DIRECTORY_ACCESS')
            return JsonResponse({
                'error': 'Access denied',
                'code': 'INVALID_PATH',
                'message': 'Invalid path detected'
            }, status=403)
        
        return None
    
    def _is_path_traversal(self, path):
        """
        Check for path traversal attempts
        """
        traversal_patterns = [
            '../',
            '..\\',
            '%2e%2e/',
            '%2e%2e\\',
            '..%2f',
            '..%5c',
            '%252e%252e/',
            '%252e%252e\\',
        ]
        
        for pattern in traversal_patterns:
            if pattern in path:
                return True
        
        return False
    
    def _is_parent_directory_access(self, path):
        """
        Check if trying to access parent directories
        """
        # Normalize the path
        import os
        try:
            normalized = os.path.normpath(path)
            # If normalized path goes up (..), it's suspicious
            if normalized.startswith('..') or '/..' in normalized or '\\..' in normalized:
                return True
        except Exception:
            # If normalization fails, it's suspicious
            return True
        
        return False
    
    def _log_and_block(self, ip, path, reason):
        """
        Log the blocked access attempt
        """
        logger.warning(
            f"ENVIRONMENT PROTECTION: Blocked access from IP: {ip}, "
            f"Path: {path}, Reason: {reason}"
        )
        
        # Track blocked attempts per IP
        block_key = f"env_protection_blocked_{ip}"
        count = cache.get(block_key, 0)
        cache.set(block_key, count + 1, 3600)  # 1 hour
        
        # If too many attempts, consider adding to blocked IPs
        if count > 10:
            logger.critical(
                f"CRITICAL: IP {ip} has {count} blocked environment access attempts. "
                f"Consider adding to BLOCKED_IPS."
            )
    
    def process_response(self, request, response):
        """
        Add additional security headers for sensitive responses
        """
        # Add Cache-Control headers to prevent caching of sensitive data
        if response.status_code == 403:
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
        
        return response


class SecureFileAccessMiddleware(MiddlewareMixin):
    """
    Additional middleware to ensure secure file access patterns
    """
    
    def process_request(self, request):
        """
        Check for suspicious file access patterns
        """
        path = request.path
        client_ip = get_client_ip(request)
        
        # Check for null byte injection
        if '\x00' in path or '%00' in path:
            logger.critical(
                f"NULL BYTE INJECTION attempt from IP: {ip}, Path: {path}"
            )
            return JsonResponse({
                'error': 'Access denied',
                'code': 'INVALID_REQUEST'
            }, status=400)
        
        # Check for Unicode encoding attacks
        if self._has_unicode_attack(path):
            logger.warning(
                f"UNICODE ATTACK attempt from IP: {client_ip}, Path: {path}"
            )
            return JsonResponse({
                'error': 'Access denied',
                'code': 'INVALID_ENCODING'
            }, status=400)
        
        # Check for double encoding
        if self._has_double_encoding(path):
            logger.warning(
                f"DOUBLE ENCODING attempt from IP: {client_ip}, Path: {path}"
            )
            return JsonResponse({
                'error': 'Access denied',
                'code': 'INVALID_ENCODING'
            }, status=400)
        
        return None
    
    def _has_unicode_attack(self, path):
        """
        Check for Unicode encoding attacks
        """
        suspicious_unicode = [
            '%u',  # Unicode encoding
            '\\u',  # Unicode escape
            '%c0%af',  # Overlong UTF-8 encoding of /
            '%c1%1c',  # Overlong UTF-8 encoding of \
        ]
        
        path_lower = path.lower()
        for pattern in suspicious_unicode:
            if pattern in path_lower:
                return True
        
        return False
    
    def _has_double_encoding(self, path):
        """
        Check for double URL encoding
        """
        # Check for %25 (encoded %)
        if '%25' in path:
            return True
        
        return False

