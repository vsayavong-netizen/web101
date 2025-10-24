"""
Enhanced Security Configuration for Final Project Management System
"""

# Enhanced security middleware configuration
ENHANCED_SECURITY_MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.SecurityMiddleware',
    'core.middleware.RateLimitMiddleware',
    'core.middleware.AuditLogMiddleware',
    'core.middleware.BlockSuspiciousRequestsMiddleware',  # New middleware
    'core.middleware.EnvironmentProtectionMiddleware',     # New middleware
]

# Enhanced security settings
ENHANCED_SECURITY_SETTINGS = {
    # Basic security headers
    'SECURE_BROWSER_XSS_FILTER': True,
    'SECURE_CONTENT_TYPE_NOSNIFF': True,
    'X_FRAME_OPTIONS': 'DENY',
    'SECURE_REFERRER_POLICY': 'strict-origin-when-cross-origin',
    
    # HSTS settings
    'SECURE_HSTS_SECONDS': 31536000,  # 1 year
    'SECURE_HSTS_INCLUDE_SUBDOMAINS': True,
    'SECURE_HSTS_PRELOAD': True,
    
    # SSL settings
    'SECURE_SSL_REDIRECT': True,
    'SECURE_PROXY_SSL_HEADER': ('HTTP_X_FORWARDED_PROTO', 'https'),
    
    # Session security
    'SESSION_COOKIE_SECURE': True,
    'SESSION_COOKIE_HTTPONLY': True,
    'SESSION_COOKIE_SAMESITE': 'Strict',
    'SESSION_COOKIE_AGE': 3600,  # 1 hour (reduced from 24 hours)
    'SESSION_EXPIRE_AT_BROWSER_CLOSE': True,
    
    # CSRF protection
    'CSRF_COOKIE_SECURE': True,
    'CSRF_COOKIE_HTTPONLY': True,
    'CSRF_COOKIE_SAMESITE': 'Strict',
    'CSRF_USE_SESSIONS': True,
    
    # File upload security
    'FILE_UPLOAD_MAX_MEMORY_SIZE': 2 * 1024 * 1024,  # 2MB
    'DATA_UPLOAD_MAX_MEMORY_SIZE': 2 * 1024 * 1024,  # 2MB
    'MAX_UPLOAD_SIZE': 5 * 1024 * 1024,  # 5MB
    
    # Password security
    'AUTH_PASSWORD_VALIDATORS': [
        {
            'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
            'OPTIONS': {
                'min_length': 12,
            }
        },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
        },
    ],
}

# Enhanced API security configuration
ENHANCED_API_SECURITY = {
    'ENABLE_RATE_LIMITING': True,
    'ENABLE_IP_WHITELISTING': False,
    'ENABLE_REQUEST_LOGGING': True,
    'ENABLE_SQL_INJECTION_PROTECTION': True,
    'ENABLE_XSS_PROTECTION': True,
    'MAX_REQUESTS_PER_MINUTE': 30,  # Reduced from 60
    'MAX_REQUESTS_PER_HOUR': 500,   # Reduced from 1000
    'BLOCKED_IPS': [],
    'SUSPICIOUS_PATTERNS': [
        # XSS patterns
        r'<script.*?>.*?</script>',
        r'javascript:',
        r'vbscript:',
        r'onload\s*=',
        r'onerror\s*=',
        r'onclick\s*=',
        r'onmouseover\s*=',
        
        # SQL injection patterns
        r'union\s+select',
        r'drop\s+table',
        r'delete\s+from',
        r'insert\s+into',
        r'update\s+set',
        r'alter\s+table',
        r'create\s+table',
        r'exec\s*\(',
        r'execute\s*\(',
        
        # File inclusion patterns
        r'\.\./',
        r'\.\.\\',
        r'file://',
        r'php://',
        r'data://',
        
        # Command injection patterns
        r';\s*rm\s+',
        r';\s*cat\s+',
        r';\s*ls\s+',
        r';\s*whoami',
        r';\s*id\s*',
        r';\s*uname\s*',
        
        # Common attack patterns
        r'wp-',
        r'wp_',
        r'admin\.php',
        r'config\.php',
        r'\.env',
        r'\.git',
        r'\.svn',
        r'\.htaccess',
        r'\.htpasswd',
        r'phpmyadmin',
        r'phpinfo',
        r'info\.php',
        r'test\.php',
        r'backup\.',
        r'database\.',
        r'login\.php',
        r'register\.php',
        r'signup\.php',
        r'upload\.php',
        r'filemanager\.php',
        r'manager\.php',
        r'admin\.php',
        r'index\.php',
        r'home\.php',
        r'default\.php',
        r'config\.php',
        r'settings\.php',
        r'install\.php',
        r'setup\.php',
        r'upgrade\.php',
        r'main\.php',
        r'core\.php',
        r'system\.php',
        r'lib\.php',
        r'class\.php',
        r'function\.php',
        r'common\.php',
        r'global\.php',
        r'init\.php',
        r'bootstrap\.php',
        r'autoload\.php',
        r'composer\.php',
        r'vendor\.php',
        r'public\.php',
        r'private\.php',
        r'protected\.php',
        r'secure\.php',
        r'login\.html',
        r'register\.html',
        r'signup\.html',
        r'upload\.html',
        r'admin\.html',
        r'index\.html',
        r'home\.html',
        r'default\.html',
        r'config\.html',
        r'settings\.html',
        r'install\.html',
        r'setup\.html',
        r'upgrade\.html',
        r'main\.html',
        r'core\.html',
        r'system\.html',
        r'lib\.html',
        r'class\.html',
        r'function\.html',
        r'common\.html',
        r'global\.html',
        r'init\.html',
        r'bootstrap\.html',
        r'autoload\.html',
        r'composer\.html',
        r'vendor\.html',
        r'public\.html',
        r'private\.html',
        r'protected\.html',
        r'secure\.html',
    ],
}

# Enhanced logging configuration
ENHANCED_LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'security': {
            'format': 'SECURITY {levelname} {asctime} {module} {process:d} {thread:d} IP:{extra[ip]} PATH:{extra[path]} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
            'formatter': 'verbose',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': 'logs/security.log',
            'formatter': 'security',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': True,
        },
        'core.security': {
            'handlers': ['security_file', 'console'],
            'level': 'WARNING',
            'propagate': True,
        },
        'final_project_management': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
