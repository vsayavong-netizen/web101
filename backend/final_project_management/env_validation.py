"""
Environment variables validation for Django settings.
This module validates required environment variables on startup.
"""

from django.core.exceptions import ImproperlyConfigured
from decouple import config
import os


# Required environment variables for production
REQUIRED_ENV_VARS = [
    'SECRET_KEY',
]

# Required environment variables for production with database
REQUIRED_ENV_VARS_WITH_DB = [
    'DATABASE_URL',  # Or individual DB_* variables
]

# Required environment variables for production with email
REQUIRED_ENV_VARS_WITH_EMAIL = [
    'EMAIL_HOST',
    'EMAIL_HOST_USER',
    'EMAIL_HOST_PASSWORD',
]

# Optional but recommended environment variables
RECOMMENDED_ENV_VARS = [
    'GEMINI_API_KEY',
    'REDIS_URL',
    'ALLOWED_HOSTS',
]


def validate_environment_variables(required_vars=None, recommended_vars=None):
    """
    Validate environment variables on startup.
    
    Args:
        required_vars: List of required environment variable names
        recommended_vars: List of recommended environment variable names
    
    Raises:
        ImproperlyConfigured: If required variables are missing
    """
    if required_vars is None:
        required_vars = REQUIRED_ENV_VARS.copy()
    
    if recommended_vars is None:
        recommended_vars = RECOMMENDED_ENV_VARS.copy()
    
    missing_required = []
    missing_recommended = []
    
    # Check required variables
    for var in required_vars:
        value = config(var, default=None)
        if value is None or value == '':
            missing_required.append(var)
    
    # Check recommended variables (only warn, don't fail)
    for var in recommended_vars:
        value = config(var, default=None)
        if value is None or value == '':
            missing_recommended.append(var)
    
    # Raise error if required variables are missing
    if missing_required:
        raise ImproperlyConfigured(
            f"Missing required environment variables: {', '.join(missing_required)}. "
            f"Please set these variables in your .env file or environment."
        )
    
    # Warn about missing recommended variables
    if missing_recommended:
        import warnings
        warnings.warn(
            f"Missing recommended environment variables: {', '.join(missing_recommended)}. "
            f"Some features may not work correctly without these variables.",
            UserWarning
        )
    
    return True


def validate_secret_key():
    """Validate that SECRET_KEY is set and not using default value."""
    secret_key = config('SECRET_KEY', default=None)
    
    if secret_key is None:
        raise ImproperlyConfigured(
            "SECRET_KEY environment variable is required. "
            "Please set SECRET_KEY in your .env file or environment."
        )
    
    # Check if using default insecure key
    if secret_key == 'django-insecure-change-me-in-production':
        import warnings
        warnings.warn(
            "SECRET_KEY is using the default insecure value. "
            "Please change it in production!",
            UserWarning
        )
    
    # Check minimum length
    if len(secret_key) < 50:
        import warnings
        warnings.warn(
            "SECRET_KEY is too short. Recommended minimum length is 50 characters.",
            UserWarning
        )
    
    return True


def validate_database_config():
    """Validate database configuration."""
    database_url = config('DATABASE_URL', default=None)
    
    # If DATABASE_URL is not set, check individual DB variables
    if not database_url:
        db_engine = config('DB_ENGINE', default='django.db.backends.sqlite3')
        
        # For PostgreSQL, require connection details
        if 'postgresql' in db_engine:
            required_db_vars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD']
            missing = [var for var in required_db_vars if not config(var, default=None)]
            
            if missing:
                raise ImproperlyConfigured(
                    f"Missing required database environment variables: {', '.join(missing)}. "
                    f"Please set these variables for PostgreSQL connection."
                )
    
    return True


def validate_debug_mode():
    """Validate DEBUG mode configuration."""
    debug = config('DEBUG', default=True, cast=bool)
    
    # Warn if DEBUG is True in production-like environment
    if debug and os.environ.get('DJANGO_ENV') == 'production':
        import warnings
        warnings.warn(
            "DEBUG is set to True in production environment. "
            "This is a security risk! Set DEBUG=False in production.",
            UserWarning
        )
    
    return True


def validate_all():
    """
    Validate all environment variables and configuration.
    This should be called during Django startup.
    """
    # Check if we're in production mode
    is_production = config('DJANGO_ENV', default='development') == 'production'
    debug = config('DEBUG', default=True, cast=bool)
    
    # Always validate secret key
    validate_secret_key()
    
    # In production, validate more strictly
    if is_production or not debug:
        # Validate required variables
        required_vars = REQUIRED_ENV_VARS.copy()
        
        # Add database variables if not using SQLite
        db_engine = config('DB_ENGINE', default='django.db.backends.sqlite3')
        if 'postgresql' in db_engine or config('DATABASE_URL', default=None):
            required_vars.extend(['DATABASE_URL'])
            validate_database_config()
        
        # Validate required variables
        validate_environment_variables(required_vars=required_vars)
        
        # Validate debug mode
        validate_debug_mode()
    else:
        # In development, only warn about recommended variables
        validate_environment_variables(
            required_vars=REQUIRED_ENV_VARS,
            recommended_vars=RECOMMENDED_ENV_VARS
        )
    
    return True
