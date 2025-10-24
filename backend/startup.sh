#!/bin/bash
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

# Create superuser from environment variables if needed
echo "👤 Creating/updating superuser from environment variables..."
python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
from decouple import config

User = get_user_model()

# Read from environment variables
username = config('SUPERUSER_USERNAME', default='admin')
email = config('SUPERUSER_EMAIL', default='admin@eduinfo.online')
password = config('SUPERUSER_PASSWORD', default='admin123')
first_name = config('SUPERUSER_FIRST_NAME', default='System')
last_name = config('SUPERUSER_LAST_NAME', default='Administrator')

print(f'Creating/updating superuser: {username}...')

# Create or update superuser
user, created = User.objects.get_or_create(
    username=username,
    defaults={
        'email': email,
        'first_name': first_name,
        'last_name': last_name,
        'is_active': True,
        'is_staff': True,
        'is_superuser': True
    }
)

if created:
    user.set_password(password)
    user.save()
    print(f'✅ Superuser created: {username}')
else:
    # Update existing user
    user.email = email
    user.first_name = first_name
    user.last_name = last_name
    user.set_password(password)
    user.is_active = True
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f'✅ Superuser updated: {username}')

print(f'Username: {username}')
print(f'Email: {email}')
print(f'Active: {user.is_active}')
print(f'Staff: {user.is_staff}')
print(f'Superuser: {user.is_superuser}')
" || echo "⚠️ Superuser setup completed with errors"

# Start the application
echo "🌐 Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:$PORT --workers 3 final_project_management.wsgi:application
