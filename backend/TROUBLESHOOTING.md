# BM23 - Troubleshooting Guide

## 🔧 คู่มือแก้ไขปัญหา

### 1. ปัญหาการติดตั้ง

#### ❌ ปัญหา: pip install ไม่สำเร็จ
```
ERROR: Could not find a version that satisfies the requirement
```

**วิธีแก้ไข:**
```bash
# อัปเดต pip
python -m pip install --upgrade pip

# ติดตั้ง dependencies ทีละตัว
pip install Django==5.0.7
pip install djangorestframework==3.15.2
pip install django-cors-headers==4.3.1

# หรือใช้ virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

#### ❌ ปัญหา: psycopg2-binary ติดตั้งไม่ได้
```
ERROR: Failed building wheel for psycopg2-binary
```

**วิธีแก้ไข:**
```bash
# ติดตั้ง PostgreSQL development libraries
# Ubuntu/Debian:
sudo apt-get install libpq-dev python3-dev

# CentOS/RHEL:
sudo yum install postgresql-devel python3-devel

# Windows: ดาวน์โหลด PostgreSQL จาก https://www.postgresql.org/download/

# หรือใช้ SQLite แทน
# แก้ไขใน settings.py:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### 2. ปัญหา Database

#### ❌ ปัญหา: Database connection failed
```
django.db.utils.OperationalError: could not connect to server
```

**วิธีแก้ไข:**
```bash
# ตรวจสอบ PostgreSQL service
sudo systemctl status postgresql
sudo systemctl start postgresql

# ตรวจสอบ database settings
python manage.py dbshell

# สร้าง database ใหม่
createdb final_project_management

# ตรวจสอบ user permissions
psql -U postgres -c "CREATE DATABASE final_project_management;"
```

#### ❌ ปัญหา: Migration errors
```
django.db.utils.ProgrammingError: relation "table_name" does not exist
```

**วิธีแก้ไข:**
```bash
# ลบ migrations ที่มีปัญหา
rm -rf */migrations/0*.py

# สร้าง migrations ใหม่
python manage.py makemigrations

# รัน migrations
python manage.py migrate

# หรือ reset database
python manage.py flush
python manage.py migrate
```

### 3. ปัญหา Static Files

#### ❌ ปัญหา: Static files not found
```
404 Not Found: /static/css/style.css
```

**วิธีแก้ไข:**
```bash
# รวบรวม static files
python manage.py collectstatic

# ตรวจสอบ STATIC_ROOT
python manage.py shell
>>> from django.conf import settings
>>> print(settings.STATIC_ROOT)

# ตรวจสอบ permissions
chmod -R 755 staticfiles/
```

#### ❌ ปัญหา: WhiteNoise configuration
```
AttributeError: 'WhiteNoise' object has no attribute 'autorefresh'
```

**วิธีแก้ไข:**
```bash
# อัปเดต WhiteNoise
pip install --upgrade whitenoise

# หรือลบ WhiteNoise ออก
pip uninstall whitenoise
# แก้ไข MIDDLEWARE ใน settings.py
```

### 4. ปัญหา CORS

#### ❌ ปัญหา: CORS error
```
Access to fetch at 'http://localhost:8000/api/' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**วิธีแก้ไข:**
```bash
# ตรวจสอบ CORS settings
python manage.py shell
>>> from django.conf import settings
>>> print(settings.CORS_ALLOWED_ORIGINS)

# เพิ่ม origin ใน settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# หรือใช้ environment variable
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
```

### 5. ปัญหา Redis

#### ❌ ปัญหา: Redis connection failed
```
redis.exceptions.ConnectionError: Error 111 connecting to localhost:6379
```

**วิธีแก้ไข:**
```bash
# ตรวจสอบ Redis service
redis-cli ping

# เริ่ม Redis service
redis-server

# หรือใช้ Docker
docker run -d -p 6379:6379 redis:7-alpine

# ตรวจสอบ configuration
python manage.py shell
>>> from django.core.cache import cache
>>> cache.set('test', 'value', 10)
>>> cache.get('test')
```

### 6. ปัญหา Celery

#### ❌ ปัญหา: Celery worker not starting
```
celery.exceptions.NotRegistered: 'tasks.task_name'
```

**วิธีแก้ไข:**
```bash
# ตรวจสอบ Celery configuration
python manage.py shell
>>> from celery import current_app
>>> print(current_app.tasks.keys())

# เริ่ม Celery worker
celery -A final_project_management worker --loglevel=info

# เริ่ม Celery beat
celery -A final_project_management beat --loglevel=info
```

### 7. ปัญหา Docker

#### ❌ ปัญหา: Docker build failed
```
ERROR: failed to solve: failed to compute cache key
```

**วิธีแก้ไข:**
```bash
# ลบ cache และ build ใหม่
docker system prune -a
docker-compose build --no-cache

# ตรวจสอบ Dockerfile
docker build -t bm23-backend .

# ตรวจสอบ logs
docker-compose logs -f
```

#### ❌ ปัญหา: Container not starting
```
ERROR: for web  Cannot start service web: driver failed programming external connectivity
```

**วิธีแก้ไข:**
```bash
# ตรวจสอบ port conflicts
netstat -tulpn | grep :8000

# เปลี่ยน port ใน docker-compose.yml
ports:
  - "8001:8000"

# หรือหยุด service ที่ใช้ port
sudo systemctl stop apache2
sudo systemctl stop nginx
```

### 8. ปัญหา Environment Variables

#### ❌ ปัญหา: Environment variables not loaded
```
django.core.exceptions.ImproperlyConfigured: The SECRET_KEY setting must not be empty
```

**วิธีแก้ไข:**
```bash
# ตรวจสอบไฟล์ .env
cat .env

# ตรวจสอบ python-decouple
pip install python-decouple

# ตรวจสอบ settings.py
python manage.py shell
>>> from decouple import config
>>> print(config('SECRET_KEY'))
```

### 9. ปัญหา Logging

#### ❌ ปัญหา: Log files not created
```
PermissionError: [Errno 13] Permission denied: 'logs/django.log'
```

**วิธีแก้ไข:**
```bash
# สร้าง logs directory
mkdir -p logs

# เปลี่ยน permissions
chmod -R 755 logs/

# ตรวจสอบ logging configuration
python manage.py shell
>>> import logging
>>> logger = logging.getLogger('django')
>>> logger.info('Test log message')
```

### 10. ปัญหา AI Features

#### ❌ ปัญหา: Gemini API not working
```
google.generativeai.types.BlockedPromptException: The prompt was blocked
```

**วิธีแก้ไข:**
```bash
# ตรวจสอบ API key
python manage.py shell
>>> from django.conf import settings
>>> print(settings.GEMINI_API_KEY)

# ตรวจสอบ API key validity
curl -H "Authorization: Bearer YOUR_API_KEY" https://generativelanguage.googleapis.com/v1beta/models

# ตรวจสอบ quota
# ไปที่ Google AI Studio: https://makersuite.google.com/app/apikey
```

### 11. ปัญหา Performance

#### ❌ ปัญหา: Slow response times
```
Response time > 5 seconds
```

**วิธีแก้ไข:**
```bash
# ตรวจสอบ database queries
python manage.py shell
>>> from django.db import connection
>>> print(connection.queries)

# เปิด database query logging
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
        },
    },
}

# ใช้ database indexing
python manage.py shell
>>> from django.db import connection
>>> cursor = connection.cursor()
>>> cursor.execute("CREATE INDEX idx_user_email ON users_user(email);")
```

### 12. ปัญหา Security

#### ❌ ปัญหา: Security warnings
```
django.core.exceptions.ImproperlyConfigured: You're using the staticfiles app without having set the STATIC_ROOT setting
```

**วิธีแก้ไข:**
```bash
# ตั้งค่า STATIC_ROOT
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# ตั้งค่า security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# ตรวจสอบ security
python manage.py check --deploy
```

### 13. การ Debug

#### วิธี Debug ทั่วไป
```bash
# เปิด debug mode
DEBUG = True

# ตรวจสอบ logs
tail -f logs/django.log

# ใช้ Django shell
python manage.py shell

# ตรวจสอบ settings
python manage.py diffsettings

# ตรวจสอบ URLs
python manage.py show_urls
```

#### วิธี Debug Database
```bash
# ตรวจสอบ database
python manage.py dbshell

# ตรวจสอบ migrations
python manage.py showmigrations

# ตรวจสอบ models
python manage.py shell
>>> from accounts.models import User
>>> User.objects.count()
```

#### วิธี Debug API
```bash
# ตรวจสอบ API endpoints
curl -X GET http://localhost:8000/api/
curl -X POST http://localhost:8000/api/auth/login/ -d '{"username":"admin","password":"admin123"}'

# ตรวจสอบ API documentation
# ไปที่ http://localhost:8000/api/docs/
```

### 14. การติดต่อสนับสนุน

#### ข้อมูลที่ต้องเตรียม
1. **Error logs**: `logs/django.log`, `logs/error.log`
2. **System info**: OS, Python version, Django version
3. **Configuration**: `.env` file (ลบ sensitive data)
4. **Steps to reproduce**: ขั้นตอนที่ทำให้เกิดปัญหา

#### ช่องทางการติดต่อ
- **GitHub Issues**: สร้าง issue ใน repository
- **Email**: support@bm23.com
- **Documentation**: ดูใน `docs/` directory

#### ข้อมูลเพิ่มเติม
- **Health Check**: `python health_check.py`
- **System Status**: `python monitor.py`
- **Backup Status**: `python backup.py`

---

**💡 Tips:**
- ตรวจสอบ logs เป็นประจำ
- ใช้ health check script
- สร้าง backup ก่อนแก้ไขปัญหา
- อัปเดต dependencies เป็นประจำ
