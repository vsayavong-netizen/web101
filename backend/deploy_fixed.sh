#!/bin/bash

# BM23 Fixed Deployment Script
# This script handles the deployment with proper migration order

set -e

echo "🚀 Starting BM23 Fixed Deployment Process..."

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

# Set environment variables
export DJANGO_SETTINGS_MODULE=final_project_management.settings_production
export PYTHONPATH=/opt/render/project/src/backend

# Step 1: Run migrations first (this creates all database tables)
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

# Step 3: Load initial data (only after migrations are complete)
echo "📊 Loading initial data..."
python manage.py loaddata fixtures/initial_data.json || echo "Initial data loading failed or file not found"

# Step 4: Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Step 5: Start the application
echo "🌐 Starting application..."
python manage.py runserver 0.0.0.0:8000

echo "✅ Deployment completed successfully!"
