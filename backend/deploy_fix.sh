#!/bin/bash

echo "🚀 Deploy Fix for ALLOWED_HOSTS Issue"
echo "====================================="

# Set environment variables
export DJANGO_SETTINGS_MODULE=final_project_management.settings_production

# Run the quick fix
echo "🔧 Running quick fix..."
python quick_fix_allowed_hosts.py

# Test the configuration
echo "🧪 Testing configuration..."
python test_allowed_hosts.py

# Run migrations
echo "🗄️ Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Test the server
echo "🌐 Testing server configuration..."
python manage.py check --deploy

echo "✅ Deploy fix completed!"
echo "The server should now accept requests from eduinfo.online"
