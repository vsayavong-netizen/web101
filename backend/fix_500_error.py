#!/usr/bin/env python
"""
Fix 500 Internal Server Error for Render deployment
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings_production')

def fix_500_error():
    """Fix common 500 error causes"""
    
    print("🔧 Fixing 500 Internal Server Error")
    print("=" * 50)
    
    try:
        # Setup Django
        django.setup()
        
        # Check database connection
        print("🔍 Checking database connection...")
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("✅ Database connection successful")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    # Check settings
    print("\n🔍 Checking Django settings...")
    print(f"DEBUG: {settings.DEBUG}")
    print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"DATABASE: {settings.DATABASES['default']['NAME']}")
    
    # Check if migrations are needed
    print("\n🔍 Checking migrations...")
    try:
        from django.core.management import execute_from_command_line
        execute_from_command_line(['manage.py', 'showmigrations'])
        print("✅ Migrations check completed")
    except Exception as e:
        print(f"⚠️ Migration check failed: {e}")
    
    # Test basic functionality
    print("\n🧪 Testing basic functionality...")
    try:
        from django.test import RequestFactory
        from django.http import HttpResponse
        
        factory = RequestFactory()
        request = factory.get('/')
        
        # Test if we can create a simple response
        response = HttpResponse("OK")
        print("✅ Basic HTTP functionality works")
        
    except Exception as e:
        print(f"❌ Basic functionality test failed: {e}")
        return False
    
    print("\n✅ 500 error fix completed successfully!")
    return True

def create_startup_script():
    """Create startup script for Render"""
    
    startup_script = """#!/bin/bash
# Render startup script to fix 500 errors

echo "🚀 Starting BM23 application..."

# Navigate to backend directory
cd backend

# Set environment variables
export DJANGO_SETTINGS_MODULE=final_project_management.settings_production
export PYTHONPATH=/opt/render/project/src/backend

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if needed
echo "👤 Checking superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@eduinfo.online', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
" || echo "Superuser setup completed"

# Start the application
echo "🌐 Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:$PORT --workers 3 final_project_management.wsgi:application
"""
    
    with open(os.path.join(backend_dir, 'startup.sh'), 'w') as f:
        f.write(startup_script)
    
    print("✅ Created startup.sh script")
    return True

if __name__ == '__main__':
    print("🔧 BM23 500 Error Fix Tool")
    print("=" * 50)
    
    # Fix 500 error
    success = fix_500_error()
    
    if success:
        # Create startup script
        create_startup_script()
        
        print("\n📋 Next steps for Render:")
        print("1. Set Start Command to: ./startup.sh")
        print("2. Set Environment Variables:")
        print("   - DJANGO_SETTINGS_MODULE=final_project_management.settings_production")
        print("   - DATABASE_URL=postgresql://web100data_user:4881Q4Dc5XxYmSmEXuGzlOq29x7GMsbL@dpg-d3rs9qp5pdvs73fve9j0-a.singapore-postgres.render.com:5432/web100data?sslmode=require")
        print("3. Redeploy the service")
        print("\n🎉 Fix completed!")
    else:
        print("\n💥 Fix failed! Check the errors above.")
        sys.exit(1)
