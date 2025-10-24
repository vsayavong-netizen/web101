"""
Settings tests for the Final Project Management System
"""

from django.test import TestCase, override_settings
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class SettingsTestCase(TestCase):
    """
    Test cases for settings configuration
    """
    
    def test_security_settings(self):
        """Test security settings are properly configured"""
        # Test security middleware
        self.assertIn('django.middleware.security.SecurityMiddleware', settings.MIDDLEWARE)
        self.assertIn('corsheaders.middleware.CorsMiddleware', settings.MIDDLEWARE)
        self.assertIn('core.middleware.SecurityMiddleware', settings.MIDDLEWARE)
        self.assertIn('core.middleware.RateLimitMiddleware', settings.MIDDLEWARE)
        self.assertIn('core.middleware.AuditLogMiddleware', settings.MIDDLEWARE)
        
        # Test security settings
        self.assertTrue(settings.SECURE_BROWSER_XSS_FILTER)
        self.assertTrue(settings.SECURE_CONTENT_TYPE_NOSNIFF)
        self.assertEqual(settings.X_FRAME_OPTIONS, 'DENY')
        self.assertGreater(settings.SECURE_HSTS_SECONDS, 0)
        self.assertTrue(settings.SECURE_HSTS_INCLUDE_SUBDOMAINS)
        self.assertTrue(settings.SECURE_HSTS_PRELOAD)
    
    def test_cors_settings(self):
        """Test CORS settings are properly configured"""
        # Test CORS origins
        self.assertIsInstance(settings.CORS_ALLOWED_ORIGINS, list)
        self.assertIn('http://localhost:3000', settings.CORS_ALLOWED_ORIGINS)
        self.assertIn('http://127.0.0.1:3000', settings.CORS_ALLOWED_ORIGINS)
        self.assertIn('http://localhost:5173', settings.CORS_ALLOWED_ORIGINS)
        self.assertIn('http://127.0.0.1:5173', settings.CORS_ALLOWED_ORIGINS)
        
        # Test CORS credentials
        self.assertTrue(settings.CORS_ALLOW_CREDENTIALS)
        self.assertFalse(settings.CORS_ALLOW_ALL_ORIGINS)
        
        # Test CORS headers
        self.assertIsInstance(settings.CORS_ALLOWED_HEADERS, list)
        self.assertIn('authorization', settings.CORS_ALLOWED_HEADERS)
        self.assertIn('content-type', settings.CORS_ALLOWED_HEADERS)
        
        # Test CORS methods
        self.assertIsInstance(settings.CORS_ALLOWED_METHODS, list)
        self.assertIn('GET', settings.CORS_ALLOWED_METHODS)
        self.assertIn('POST', settings.CORS_ALLOWED_METHODS)
        self.assertIn('PUT', settings.CORS_ALLOWED_METHODS)
        self.assertIn('DELETE', settings.CORS_ALLOWED_METHODS)
        self.assertIn('PATCH', settings.CORS_ALLOWED_METHODS)
    
    def test_rest_framework_settings(self):
        """Test REST framework settings are properly configured"""
        # Test throttle classes
        self.assertIn('rest_framework.throttling.AnonRateThrottle', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'])
        self.assertIn('rest_framework.throttling.UserRateThrottle', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'])
        self.assertIn('rest_framework.throttling.ScopedRateThrottle', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'])
        
        # Test throttle rates
        self.assertIn('anon', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])
        self.assertIn('user', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])
        self.assertIn('login', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])
        self.assertIn('register', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])
        self.assertIn('password_reset', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])
        self.assertIn('api', settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])
        
        # Test authentication classes
        self.assertIn('rest_framework_simplejwt.authentication.JWTAuthentication', settings.REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'])
        
        # Test permission classes
        self.assertIn('rest_framework.permissions.IsAuthenticated', settings.REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES'])
        
        # Test pagination
        self.assertEqual(settings.REST_FRAMEWORK['DEFAULT_PAGINATION_CLASS'], 'core.pagination.StandardResultsSetPagination')
        self.assertEqual(settings.REST_FRAMEWORK['PAGE_SIZE'], 20)
        
        # Test filter backends
        self.assertIn('django_filters.rest_framework.DjangoFilterBackend', settings.REST_FRAMEWORK['DEFAULT_FILTER_BACKENDS'])
        self.assertIn('rest_framework.filters.SearchFilter', settings.REST_FRAMEWORK['DEFAULT_FILTER_BACKENDS'])
        self.assertIn('rest_framework.filters.OrderingFilter', settings.REST_FRAMEWORK['DEFAULT_FILTER_BACKENDS'])
    
    def test_jwt_settings(self):
        """Test JWT settings are properly configured"""
        # Test JWT algorithm
        self.assertEqual(settings.SIMPLE_JWT['ALGORITHM'], 'HS256')
        
        # Test JWT auth header types
        self.assertIn('Bearer', settings.SIMPLE_JWT['AUTH_HEADER_TYPES'])
        
        # Test JWT user ID field
        self.assertEqual(settings.SIMPLE_JWT['USER_ID_FIELD'], 'id')
        self.assertEqual(settings.SIMPLE_JWT['USER_ID_CLAIM'], 'user_id')
        
        # Test JWT token classes
        self.assertIn('rest_framework_simplejwt.tokens.AccessToken', settings.SIMPLE_JWT['AUTH_TOKEN_CLASSES'])
        
        # Test JWT token type claim
        self.assertEqual(settings.SIMPLE_JWT['TOKEN_TYPE_CLAIM'], 'token_type')
        self.assertEqual(settings.SIMPLE_JWT['JTI_CLAIM'], 'jti')
    
    def test_password_validation_settings(self):
        """Test password validation settings are properly configured"""
        # Test password validators
        self.assertIsInstance(settings.AUTH_PASSWORD_VALIDATORS, list)
        self.assertGreater(len(settings.AUTH_PASSWORD_VALIDATORS), 0)
        
        # Test custom password validator
        validator_names = [validator['NAME'] for validator in settings.AUTH_PASSWORD_VALIDATORS]
        self.assertIn('core.validators.CustomPasswordValidator', validator_names)
        
        # Test minimum length validator
        min_length_validator = next(
            (v for v in settings.AUTH_PASSWORD_VALIDATORS if 'MinimumLengthValidator' in v['NAME']), None
        )
        if min_length_validator:
            self.assertEqual(min_length_validator['OPTIONS']['min_length'], 8)
    
    def test_session_security_settings(self):
        """Test session security settings are properly configured"""
        # Test session cookie security
        self.assertTrue(settings.SESSION_COOKIE_SECURE)
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
        self.assertEqual(settings.SESSION_COOKIE_SAMESITE, 'Strict')
        self.assertTrue(settings.SESSION_EXPIRE_AT_BROWSER_CLOSE)
        self.assertGreater(settings.SESSION_COOKIE_AGE, 0)
    
    def test_csrf_protection_settings(self):
        """Test CSRF protection settings are properly configured"""
        # Test CSRF cookie security
        self.assertTrue(settings.CSRF_COOKIE_SECURE)
        self.assertTrue(settings.CSRF_COOKIE_HTTPONLY)
        self.assertEqual(settings.CSRF_COOKIE_SAMESITE, 'Strict')
        
        # Test CSRF trusted origins
        self.assertIsInstance(settings.CSRF_TRUSTED_ORIGINS, list)
        self.assertIn('http://localhost:3000', settings.CSRF_TRUSTED_ORIGINS)
        self.assertIn('http://127.0.0.1:3000', settings.CSRF_TRUSTED_ORIGINS)
        self.assertIn('http://localhost:5173', settings.CSRF_TRUSTED_ORIGINS)
        self.assertIn('http://127.0.0.1:5173', settings.CSRF_TRUSTED_ORIGINS)
    
    def test_file_upload_security_settings(self):
        """Test file upload security settings are properly configured"""
        # Test file upload limits
        self.assertGreater(settings.FILE_UPLOAD_MAX_MEMORY_SIZE, 0)
        self.assertGreater(settings.DATA_UPLOAD_MAX_MEMORY_SIZE, 0)
        self.assertEqual(settings.FILE_UPLOAD_PERMISSIONS, 0o644)
        
        # Test allowed file types
        self.assertIsInstance(settings.ALLOWED_FILE_TYPES, list)
        self.assertIn('application/pdf', settings.ALLOWED_FILE_TYPES)
        self.assertIn('application/msword', settings.ALLOWED_FILE_TYPES)
        self.assertIn('text/plain', settings.ALLOWED_FILE_TYPES)
        self.assertIn('image/jpeg', settings.ALLOWED_FILE_TYPES)
        self.assertIn('image/png', settings.ALLOWED_FILE_TYPES)
        
        # Test maximum file size
        self.assertGreater(settings.MAX_FILE_SIZE, 0)
    
    def test_logging_settings(self):
        """Test logging settings are properly configured"""
        # Test logging configuration
        self.assertIn('version', settings.LOGGING)
        self.assertEqual(settings.LOGGING['version'], 1)
        self.assertFalse(settings.LOGGING['disable_existing_loggers'])
        
        # Test formatters
        self.assertIn('formatters', settings.LOGGING)
        self.assertIn('verbose', settings.LOGGING['formatters'])
        self.assertIn('simple', settings.LOGGING['formatters'])
        
        # Test handlers
        self.assertIn('handlers', settings.LOGGING)
        self.assertIn('file', settings.LOGGING['handlers'])
        self.assertIn('console', settings.LOGGING['handlers'])
        
        # Test loggers
        self.assertIn('loggers', settings.LOGGING)
        self.assertIn('django.security', settings.LOGGING['loggers'])
        self.assertIn('core.security', settings.LOGGING['loggers'])
    
    def test_api_security_settings(self):
        """Test API security settings are properly configured"""
        # Test API security configuration
        self.assertIn('API_SECURITY', settings.__dict__)
        api_security = settings.API_SECURITY
        
        # Test rate limiting
        self.assertTrue(api_security['ENABLE_RATE_LIMITING'])
        self.assertGreater(api_security['MAX_REQUESTS_PER_MINUTE'], 0)
        self.assertGreater(api_security['MAX_REQUESTS_PER_HOUR'], 0)
        
        # Test request logging
        self.assertTrue(api_security['ENABLE_REQUEST_LOGGING'])
        
        # Test protection features
        self.assertTrue(api_security['ENABLE_SQL_INJECTION_PROTECTION'])
        self.assertTrue(api_security['ENABLE_XSS_PROTECTION'])
        
        # Test blocked IPs
        self.assertIsInstance(api_security['BLOCKED_IPS'], list)
        
        # Test suspicious patterns
        self.assertIsInstance(api_security['SUSPICIOUS_PATTERNS'], list)
        self.assertGreater(len(api_security['SUSPICIOUS_PATTERNS']), 0)
    
    def test_database_security_settings(self):
        """Test database security settings are properly configured"""
        # Test database security configuration
        self.assertIn('DATABASE_SECURITY', settings.__dict__)
        db_security = settings.DATABASE_SECURITY
        
        # Test connection pooling
        self.assertTrue(db_security['ENABLE_CONNECTION_POOLING'])
        self.assertGreater(db_security['MAX_CONNECTIONS'], 0)
        self.assertGreater(db_security['CONNECTION_TIMEOUT'], 0)
        
        # Test query logging
        self.assertIsInstance(db_security['ENABLE_QUERY_LOGGING'], bool)
        self.assertIsInstance(db_security['ENABLE_SLOW_QUERY_LOGGING'], bool)
        self.assertGreater(db_security['SLOW_QUERY_THRESHOLD'], 0)
    
    def test_cache_security_settings(self):
        """Test cache security settings are properly configured"""
        # Test cache security configuration
        self.assertIn('CACHE_SECURITY', settings.__dict__)
        cache_security = settings.CACHE_SECURITY
        
        # Test cache encryption
        self.assertTrue(cache_security['ENABLE_CACHE_ENCRYPTION'])
        self.assertIsInstance(cache_security['CACHE_KEY_PREFIX'], str)
        self.assertGreater(cache_security['CACHE_TIMEOUT'], 0)
        
        # Test cache invalidation
        self.assertTrue(cache_security['ENABLE_CACHE_INVALIDATION'])
    
    def test_email_security_settings(self):
        """Test email security settings are properly configured"""
        # Test email security configuration
        self.assertIn('EMAIL_SECURITY', settings.__dict__)
        email_security = settings.EMAIL_SECURITY
        
        # Test email verification
        self.assertTrue(email_security['ENABLE_EMAIL_VERIFICATION'])
        self.assertGreater(email_security['EMAIL_VERIFICATION_TIMEOUT'], 0)
        
        # Test email attempts
        self.assertGreater(email_security['MAX_EMAIL_ATTEMPTS'], 0)
        self.assertGreater(email_security['EMAIL_BLOCK_DURATION'], 0)
    
    def test_backup_security_settings(self):
        """Test backup security settings are properly configured"""
        # Test backup security configuration
        self.assertIn('BACKUP_SECURITY', settings.__dict__)
        backup_security = settings.BACKUP_SECURITY
        
        # Test automatic backups
        self.assertTrue(backup_security['ENABLE_AUTOMATIC_BACKUPS'])
        self.assertIn(backup_security['BACKUP_FREQUENCY'], ['daily', 'weekly', 'monthly'])
        self.assertGreater(backup_security['BACKUP_RETENTION_DAYS'], 0)
        
        # Test backup encryption
        self.assertTrue(backup_security['ENABLE_BACKUP_ENCRYPTION'])
        self.assertIsInstance(backup_security['BACKUP_STORAGE_LOCATION'], str)
    
    @override_settings(SECRET_KEY='test-secret-key')
    def test_secret_key_validation(self):
        """Test secret key validation"""
        # Test that secret key is set
        self.assertIsNotNone(settings.SECRET_KEY)
        self.assertGreater(len(settings.SECRET_KEY), 0)
        
        # Test that secret key is not default
        self.assertNotEqual(settings.SECRET_KEY, 'your-secret-key-here')
    
    def test_debug_mode_security(self):
        """Test debug mode security settings"""
        # Test that debug mode is properly configured
        self.assertIsInstance(settings.DEBUG, bool)
        
        # In production, debug should be False
        if not settings.DEBUG:
            self.assertFalse(settings.DEBUG)
    
    def test_allowed_hosts_security(self):
        """Test allowed hosts security settings"""
        # Test that allowed hosts is configured
        self.assertIsInstance(settings.ALLOWED_HOSTS, list)
        
        # Test that localhost is allowed for development
        if settings.DEBUG:
            self.assertIn('localhost', settings.ALLOWED_HOSTS)
            self.assertIn('127.0.0.1', settings.ALLOWED_HOSTS)
    
    def test_database_security(self):
        """Test database security settings"""
        # Test that database is configured
        self.assertIn('default', settings.DATABASES)
        
        # Test that database has security settings
        db_config = settings.DATABASES['default']
        self.assertIn('ENGINE', db_config)
        self.assertIn('NAME', db_config)
        
        # Test that database engine is secure
        self.assertIn('postgresql', db_config['ENGINE'].lower())
    
    def test_static_files_security(self):
        """Test static files security settings"""
        # Test that static files are configured
        self.assertIsNotNone(settings.STATIC_URL)
        self.assertIsNotNone(settings.STATIC_ROOT)
        
        # Test that static files URL is secure
        self.assertTrue(settings.STATIC_URL.startswith('/'))
    
    def test_media_files_security(self):
        """Test media files security settings"""
        # Test that media files are configured
        self.assertIsNotNone(settings.MEDIA_URL)
        self.assertIsNotNone(settings.MEDIA_ROOT)
        
        # Test that media files URL is secure
        self.assertTrue(settings.MEDIA_URL.startswith('/'))
    
    def test_timezone_settings(self):
        """Test timezone settings"""
        # Test that timezone is configured
        self.assertIsNotNone(settings.TIME_ZONE)
        self.assertIsNotNone(settings.USE_TZ)
        
        # Test that timezone is valid
        self.assertIn(settings.TIME_ZONE, ['UTC', 'Asia/Bangkok', 'Asia/Vientiane'])
    
    def test_language_settings(self):
        """Test language settings"""
        # Test that language is configured
        self.assertIsNotNone(settings.LANGUAGE_CODE)
        self.assertIsNotNone(settings.USE_I18N)
        self.assertIsNotNone(settings.USE_L10N)
        
        # Test that language is valid
        self.assertIn(settings.LANGUAGE_CODE, ['en-us', 'th', 'lo'])
    
    def test_installed_apps_security(self):
        """Test installed apps security"""
        # Test that security apps are installed
        self.assertIn('django.contrib.auth', settings.INSTALLED_APPS)
        self.assertIn('django.contrib.sessions', settings.INSTALLED_APPS)
        self.assertIn('django.contrib.messages', settings.INSTALLED_APPS)
        self.assertIn('corsheaders', settings.INSTALLED_APPS)
        self.assertIn('rest_framework', settings.INSTALLED_APPS)
        self.assertIn('rest_framework_simplejwt', settings.INSTALLED_APPS)
        self.assertIn('django_filters', settings.INSTALLED_APPS)
        
        # Test that custom apps are installed
        self.assertIn('core', settings.INSTALLED_APPS)
        self.assertIn('authentication', settings.INSTALLED_APPS)
        self.assertIn('users', settings.INSTALLED_APPS)
        self.assertIn('projects', settings.INSTALLED_APPS)
        self.assertIn('majors', settings.INSTALLED_APPS)
        self.assertIn('classrooms', settings.INSTALLED_APPS)
        self.assertIn('advisors', settings.INSTALLED_APPS)
        self.assertIn('students', settings.INSTALLED_APPS)
        self.assertIn('milestones', settings.INSTALLED_APPS)
        self.assertIn('communication', settings.INSTALLED_APPS)
        self.assertIn('notifications', settings.INSTALLED_APPS)
        self.assertIn('files', settings.INSTALLED_APPS)
        self.assertIn('settings', settings.INSTALLED_APPS)
        self.assertIn('analytics', settings.INSTALLED_APPS)
        self.assertIn('ai_enhancement', settings.INSTALLED_APPS)
        self.assertIn('defense_management', settings.INSTALLED_APPS)
        self.assertIn('scoring', settings.INSTALLED_APPS)
        self.assertIn('reports', settings.INSTALLED_APPS)
        self.assertIn('monitoring', settings.INSTALLED_APPS)
        self.assertIn('security', settings.INSTALLED_APPS)
        self.assertIn('maintenance', settings.INSTALLED_APPS)
        self.assertIn('backups', settings.INSTALLED_APPS)
        self.assertIn('training', settings.INSTALLED_APPS)
        self.assertIn('user_feedback', settings.INSTALLED_APPS)
        self.assertIn('user_onboarding', settings.INSTALLED_APPS)
        self.assertIn('user_training', settings.INSTALLED_APPS)
        self.assertIn('performance_monitoring', settings.INSTALLED_APPS)
        self.assertIn('performance_optimization', settings.INSTALLED_APPS)
        self.assertIn('security_enhancement', settings.INSTALLED_APPS)
        self.assertIn('feature_enhancement', settings.INSTALLED_APPS)
        self.assertIn('continuous_improvement', settings.INSTALLED_APPS)
        self.assertIn('system_optimization', settings.INSTALLED_APPS)
        self.assertIn('system_validation', settings.INSTALLED_APPS)
        self.assertIn('system_maintenance', settings.INSTALLED_APPS)
        self.assertIn('system_launch', settings.INSTALLED_APPS)
        self.assertIn('final_deployment', settings.INSTALLED_APPS)
        self.assertIn('final_project_management', settings.INSTALLED_APPS)
        self.assertIn('go_live', settings.INSTALLED_APPS)
        self.assertIn('production', settings.INSTALLED_APPS)
        self.assertIn('mobile_app', settings.INSTALLED_APPS)
        self.assertIn('integrations', settings.INSTALLED_APPS)
        self.assertIn('improvement', settings.INSTALLED_APPS)
        self.assertIn('ongoing_support', settings.INSTALLED_APPS)
        self.assertIn('scaling_preparation', settings.INSTALLED_APPS)
        self.assertIn('production_ready', settings.INSTALLED_APPS)
        self.assertIn('production_setup', settings.INSTALLED_APPS)
        self.assertIn('production_deployment', settings.INSTALLED_APPS)
        self.assertIn('simple_production_setup', settings.INSTALLED_APPS)
        self.assertIn('go_live_preparation', settings.INSTALLED_APPS)
        self.assertIn('integration_expansion', settings.INSTALLED_APPS)
        self.assertIn('mobile_app_setup', settings.INSTALLED_APPS)
        self.assertIn('monitoring_setup', settings.INSTALLED_APPS)
        self.assertIn('security_config', settings.INSTALLED_APPS)
        self.assertIn('user_feedback', settings.INSTALLED_APPS)
        self.assertIn('user_onboarding', settings.INSTALLED_APPS)
        self.assertIn('user_training', settings.INSTALLED_APPS)
        self.assertIn('performance_monitoring', settings.INSTALLED_APPS)
        self.assertIn('performance_optimization', settings.INSTALLED_APPS)
        self.assertIn('security_enhancement', settings.INSTALLED_APPS)
        self.assertIn('feature_enhancement', settings.INSTALLED_APPS)
        self.assertIn('continuous_improvement', settings.INSTALLED_APPS)
        self.assertIn('system_optimization', settings.INSTALLED_APPS)
        self.assertIn('system_validation', settings.INSTALLED_APPS)
        self.assertIn('system_maintenance', settings.INSTALLED_APPS)
        self.assertIn('system_launch', settings.INSTALLED_APPS)
        self.assertIn('final_deployment', settings.INSTALLED_APPS)
        self.assertIn('final_project_management', settings.INSTALLED_APPS)
        self.assertIn('go_live', settings.INSTALLED_APPS)
        self.assertIn('production', settings.INSTALLED_APPS)
        self.assertIn('mobile_app', settings.INSTALLED_APPS)
        self.assertIn('integrations', settings.INSTALLED_APPS)
        self.assertIn('improvement', settings.INSTALLED_APPS)
        self.assertIn('ongoing_support', settings.INSTALLED_APPS)
        self.assertIn('scaling_preparation', settings.INSTALLED_APPS)
        self.assertIn('production_ready', settings.INSTALLED_APPS)
        self.assertIn('production_setup', settings.INSTALLED_APPS)
        self.assertIn('production_deployment', settings.INSTALLED_APPS)
        self.assertIn('simple_production_setup', settings.INSTALLED_APPS)
        self.assertIn('go_live_preparation', settings.INSTALLED_APPS)
        self.assertIn('integration_expansion', settings.INSTALLED_APPS)
        self.assertIn('mobile_app_setup', settings.INSTALLED_APPS)
        self.assertIn('monitoring_setup', settings.INSTALLED_APPS)
        self.assertIn('security_config', settings.INSTALLED_APPS)
