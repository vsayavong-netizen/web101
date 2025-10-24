#!/bin/bash
# Start script for Render deployment
# This script runs migrations before starting the server

set -e

echo "🚀 Starting BM23 Application..."

# Navigate to backend directory
cd backend

# Set environment variables
export DJANGO_SETTINGS_MODULE=final_project_management.settings
export PYTHONPATH=/opt/render/project/src/backend

echo "🗄️ Running database migrations..."
python manage.py migrate --noinput

echo "👥 Checking for admin user..."
python manage.py shell -c "
from accounts.models import User
if not User.objects.filter(is_superuser=True).exists():
    print('⚠️  No admin user found. Please create one manually.')
else:
    admin_count = User.objects.filter(is_superuser=True).count()
    print(f'✅ Found {admin_count} admin user(s)')
" 2>/dev/null || echo "User check skipped"

echo "🚀 Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:$PORT --workers 3 final_project_management.wsgi:application

