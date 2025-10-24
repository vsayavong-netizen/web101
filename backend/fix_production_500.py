#!/usr/bin/env python3
"""
Fix production 500 errors for API endpoints
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection
from django.contrib.auth import get_user_model

User = get_user_model()

def check_database_connection():
    """Check database connection"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✅ Database connection successful")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_user_model():
    """Check if User model is working"""
    try:
        user_count = User.objects.count()
        print(f"✅ User model working - {user_count} users found")
        return True
    except Exception as e:
        print(f"❌ User model failed: {e}")
        return False

def check_migrations():
    """Check if migrations are applied"""
    try:
        from django.core.management import call_command
        from io import StringIO
        
        # Check for unapplied migrations
        out = StringIO()
        call_command('showmigrations', 'accounts', stdout=out)
        migrations_output = out.getvalue()
        
        if '[ ]' in migrations_output:
            print("⚠️  Unapplied migrations found")
            return False
        else:
            print("✅ All migrations applied")
            return True
    except Exception as e:
        print(f"❌ Migration check failed: {e}")
        return False

def create_superuser_if_needed():
    """Create superuser if none exists"""
    try:
        if not User.objects.filter(is_superuser=True).exists():
            print("Creating superuser...")
            User.objects.create_superuser(
                username='admin',
                email='admin@eduinfo.online',
                password='admin123',
                first_name='Admin',
                last_name='User'
            )
            print("✅ Superuser created")
        else:
            print("✅ Superuser already exists")
        return True
    except Exception as e:
        print(f"❌ Superuser creation failed: {e}")
        return False

def check_static_files():
    """Check if static files are properly configured"""
    try:
        static_root = settings.STATIC_ROOT
        if os.path.exists(static_root):
            print(f"✅ Static root exists: {static_root}")
        else:
            print(f"⚠️  Static root missing: {static_root}")
            os.makedirs(static_root, exist_ok=True)
            print(f"✅ Created static root: {static_root}")
        return True
    except Exception as e:
        print(f"❌ Static files check failed: {e}")
        return False

def check_media_files():
    """Check if media files are properly configured"""
    try:
        media_root = settings.MEDIA_ROOT
        if os.path.exists(media_root):
            print(f"✅ Media root exists: {media_root}")
        else:
            print(f"⚠️  Media root missing: {media_root}")
            os.makedirs(media_root, exist_ok=True)
            print(f"✅ Created media root: {media_root}")
        return True
    except Exception as e:
        print(f"❌ Media files check failed: {e}")
        return False

def check_logs_directory():
    """Check if logs directory exists"""
    try:
        logs_dir = os.path.join(settings.BASE_DIR, 'logs')
        if os.path.exists(logs_dir):
            print(f"✅ Logs directory exists: {logs_dir}")
        else:
            print(f"⚠️  Logs directory missing: {logs_dir}")
            os.makedirs(logs_dir, exist_ok=True)
            print(f"✅ Created logs directory: {logs_dir}")
        return True
    except Exception as e:
        print(f"❌ Logs directory check failed: {e}")
        return False

def main():
    """Main function to fix production issues"""
    print("🔧 Fixing production 500 errors...")
    print("=" * 50)
    
    # Check database connection
    if not check_database_connection():
        print("❌ Cannot proceed without database connection")
        return False
    
    # Check migrations
    if not check_migrations():
        print("⚠️  Running migrations...")
        try:
            execute_from_command_line(['manage.py', 'migrate'])
            print("✅ Migrations completed")
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            return False
    
    # Check user model
    if not check_user_model():
        print("❌ User model not working")
        return False
    
    # Create superuser if needed
    create_superuser_if_needed()
    
    # Check static files
    check_static_files()
    
    # Check media files
    check_media_files()
    
    # Check logs directory
    check_logs_directory()
    
    print("\n✅ Production fixes completed!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
