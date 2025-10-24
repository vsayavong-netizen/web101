#!/bin/bash

echo "Starting Final Project Management Services..."
echo "================================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed or not in PATH"
    exit 1
fi

# Check if Redis is available
if ! redis-cli ping &> /dev/null; then
    echo "WARNING: Redis is not running. Starting Redis..."
    redis-server --port 6379 --daemonize yes
    sleep 3
fi

# Check if Redis is now available
if ! redis-cli ping &> /dev/null; then
    echo "ERROR: Failed to start Redis. Please install Redis or use Docker."
    echo "You can install Redis from: https://redis.io/download"
    echo "Or use Docker: docker run -d -p 6379:6379 redis:alpine"
    exit 1
fi

echo "✅ Redis is running"

# Navigate to backend directory
cd "$(dirname "$0")/.."

# Check if manage.py exists
if [ ! -f "manage.py" ]; then
    echo "ERROR: manage.py not found. Please run this script from the backend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -r requirements.txt

# Run migrations
echo "🗄️ Running database migrations..."
python3 manage.py migrate

# Create superuser if it doesn't exist
echo "👤 Creating superuser..."
python3 manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"

# Collect static files
echo "📁 Collecting static files..."
python3 manage.py collectstatic --noinput

# Start Django server
echo "🚀 Starting Django server..."
echo ""
echo "================================================"
echo "🎉 Final Project Management System is starting!"
echo "================================================"
echo ""
echo "🌐 Web Interface: http://localhost:8000"
echo "🔧 Admin Panel: http://localhost:8000/admin/"
echo "📊 API Documentation: http://localhost:8000/api/docs/"
echo "🔌 WebSocket: ws://localhost:8000/ws/"
echo ""
echo "👤 Admin Login: admin / admin123"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 manage.py runserver 0.0.0.0:8000
