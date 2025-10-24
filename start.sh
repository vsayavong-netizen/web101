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

echo "👥 Creating admin account if needed..."
python create_admin_auto.py 2>/dev/null || echo "Admin creation skipped"

echo "🚀 Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:$PORT --workers 3 final_project_management.wsgi:application

