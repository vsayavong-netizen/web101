#!/bin/bash

# BM23 Fixed Build Script
# This script fixes the migration and fixture loading order

set -e

echo "🚀 Starting BM23 Fixed Build Process..."

# Navigate to backend directory
cd backend

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p staticfiles
mkdir -p media

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Set environment variables for production
export DJANGO_SETTINGS_MODULE=final_project_management.settings
export PYTHONPATH=/opt/render/project/src/backend

# Step 1: Create database tables with migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --noinput

# Step 2: Create superuser if it doesn't exist
echo "👤 Setting up superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@bm23.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
" || echo "Superuser setup completed"

# Step 3: Load initial data if available (after migrations)
echo "📊 Loading initial data..."
python manage.py loaddata fixtures/initial_data.json || echo "No initial data file found or error loading data"

# Step 4: Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build process completed successfully!"
echo "🌐 Application is ready for deployment"
