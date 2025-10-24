@echo off
echo Starting Final Project Management Services...
echo ================================================

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Redis is available
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Redis is not running. Starting Redis...
    start "Redis Server" redis-server --port 6379
    timeout /t 3 /nobreak >nul
)

REM Check if Redis is now available
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Redis. Please install Redis or use Docker.
    echo You can install Redis from: https://redis.io/download
    echo Or use Docker: docker run -d -p 6379:6379 redis:alpine
    pause
    exit /b 1
)

echo ✅ Redis is running

REM Navigate to backend directory
cd /d "%~dp0.."

REM Check if manage.py exists
if not exist "manage.py" (
    echo ERROR: manage.py not found. Please run this script from the backend directory.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
pip install -r requirements.txt

REM Run migrations
echo 🗄️ Running database migrations...
python manage.py migrate

REM Create superuser if it doesn't exist
echo 👤 Creating superuser...
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
"

REM Collect static files
echo 📁 Collecting static files...
python manage.py collectstatic --noinput

REM Start Django server
echo 🚀 Starting Django server...
echo.
echo ================================================
echo 🎉 Final Project Management System is starting!
echo ================================================
echo.
echo 🌐 Web Interface: http://localhost:8000
echo 🔧 Admin Panel: http://localhost:8000/admin/
echo 📊 API Documentation: http://localhost:8000/api/docs/
echo 🔌 WebSocket: ws://localhost:8000/ws/
echo.
echo 👤 Admin Login: admin / admin123
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver 0.0.0.0:8000
