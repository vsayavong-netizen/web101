#!/bin/bash

# BM23 Production Deployment Script
# This script deploys the BM23 application to production

set -e

echo "🚀 Starting BM23 Production Deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p staticfiles
mkdir -p media
mkdir -p ssl

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec web python manage.py migrate

# Create superuser if it doesn't exist
echo "👤 Creating superuser..."
docker-compose -f docker-compose.prod.yml exec web python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@bm23.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"

# Collect static files
echo "📦 Collecting static files..."
docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput

# Load initial data
echo "📊 Loading initial data..."
docker-compose -f docker-compose.prod.yml exec web python manage.py loaddata fixtures/initial_data.json || echo "No initial data file found"

# Check service status
echo "🔍 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Deployment completed successfully!"
echo "🌐 Application is available at: http://localhost:8000"
echo "👤 Admin credentials: admin/admin123"
echo "📊 Check logs with: docker-compose -f docker-compose.prod.yml logs -f"
