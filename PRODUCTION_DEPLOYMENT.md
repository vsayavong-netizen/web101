# 🚀 Production Deployment Guide

## 📋 Deployment Checklist

### ✅ Pre-Deployment Checklist
- [x] **System Testing**: All integration tests passing
- [x] **API Coverage**: 18/18 endpoints working
- [x] **Database**: All models and migrations ready
- [x] **Authentication**: JWT system configured
- [x] **File Management**: Upload/download system ready
- [x] **Documentation**: Complete user and developer guides
- [x] **Security**: Basic security measures in place

### 🔧 Production Environment Setup

#### 1. Server Requirements
```bash
# Minimum Requirements
- CPU: 4 cores
- RAM: 8GB
- Storage: 100GB SSD
- OS: Ubuntu 20.04+ / CentOS 8+

# Recommended Requirements
- CPU: 8 cores
- RAM: 16GB
- Storage: 500GB SSD
- OS: Ubuntu 22.04 LTS
```

#### 2. Software Stack
```bash
# Backend Stack
- Python 3.11+
- Django 5.0.7
- PostgreSQL 14+
- Redis 6+
- Gunicorn
- Nginx

# Frontend Stack
- Node.js 18+
- React 18+
- TypeScript 5+
- Vite
```

#### 3. Environment Configuration
```bash
# .env.production
DEBUG=False
SECRET_KEY=your-production-secret-key-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DATABASE_URL=postgresql://user:password@localhost:5432/production_db
REDIS_URL=redis://localhost:6379/0
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 🐳 Docker Deployment

#### 1. Docker Compose Configuration
```yaml
# docker-compose.production.yml
version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: final_project_management
      POSTGRES_USER: project_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:6
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://project_user:secure_password@db:5432/final_project_management
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - ./media:/app/media
      - ./logs:/app/logs
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

#### 2. Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "-c", "gunicorn.conf.py", "final_project_management.wsgi:application"]
```

#### 3. Dockerfile for Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

### 🌐 Nginx Configuration

#### 1. Nginx Configuration
```nginx
# nginx.conf
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static/ {
        alias /app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /app/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### 🔒 SSL Certificate Setup

#### 1. Let's Encrypt SSL
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 2. Manual SSL Setup
```bash
# Generate SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem
```

### 📊 Database Setup

#### 1. PostgreSQL Configuration
```sql
-- Create database
CREATE DATABASE final_project_management;
CREATE USER project_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE final_project_management TO project_user;

-- Create extensions
\c final_project_management;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

#### 2. Database Migration
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data
python simple_production_setup.py
```

### 🔧 Application Configuration

#### 1. Gunicorn Configuration
```python
# gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
```

#### 2. Production Settings
```python
# settings_production.py
import os
from .settings import *

DEBUG = False
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
    }
}

# Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Disable development tokens in production unless explicitly allowed
ALLOW_DEV_TOKENS = os.environ.get('ALLOW_DEV_TOKENS', 'False').lower() == 'true'

# Caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### 🛡️ Security Hardening

- Ensure development tokens are disabled
  - Set `ALLOW_DEV_TOKENS=False` (default) in production.
  - Dev tokens (`mock-token`, `authToken`) are only honored when `DEBUG=True` or `ALLOW_DEV_TOKENS=True`.
  - Verify in production that `Authorization: Bearer mock-token` returns HTTP 401.


### 🚀 Deployment Commands

#### 1. Initial Deployment
```bash
# Clone repository
git clone <repository-url>
cd bm23

# Set up environment
cp .env.example .env.production
# Edit .env.production with your settings

# Start services
docker-compose -f docker-compose.production.yml up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

#### 2. Health Check
```bash
# Check services
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx

# Test API endpoints
curl -X GET https://your-domain.com/api/auth/
curl -X GET https://your-domain.com/api/projects/
```

### 📈 Performance Optimization

#### 1. Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_projects_status ON projects_projectgroup(status);
CREATE INDEX idx_projects_created ON projects_projectgroup(created_at);
CREATE INDEX idx_users_email ON accounts_user(email);
CREATE INDEX idx_files_project ON file_management_projectfile(project_id);
```

#### 2. Caching Strategy
```python
# Redis caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Session caching
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

### 🔍 Monitoring Setup

#### 1. Logging Configuration
```python
# settings_production.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}
```

#### 2. Health Check Endpoint
```python
# health_check.py
from django.http import JsonResponse
from django.db import connection
import redis

def health_check(request):
    """System health check"""
    status = {
        'database': False,
        'redis': False,
        'status': 'healthy'
    }
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status['database'] = True
    except Exception as e:
        status['status'] = 'unhealthy'
        status['database_error'] = str(e)
    
    # Check Redis
    try:
        r = redis.Redis.from_url(settings.REDIS_URL)
        r.ping()
        status['redis'] = True
    except Exception as e:
        status['status'] = 'unhealthy'
        status['redis_error'] = str(e)
    
    return JsonResponse(status)
```

### 🔄 Backup Strategy

#### 1. Database Backup
```bash
#!/bin/bash
# backup_db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump final_project_management > /backups/db_$DATE.sql
find /backups -name "db_*.sql" -mtime +7 -delete
```

#### 2. File Backup
```bash
#!/bin/bash
# backup_files.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/media_$DATE.tar.gz /app/media/
find /backups -name "media_*.tar.gz" -mtime +7 -delete
```

### 🚨 Troubleshooting

#### Common Issues
1. **Database Connection Error**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U project_user -d final_project_management
   ```

2. **Static Files Not Loading**
   ```bash
   # Collect static files
   python manage.py collectstatic --noinput
   
   # Check Nginx configuration
   sudo nginx -t
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate
   openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout
   
   # Renew certificate
   sudo certbot renew
   ```

### 📞 Support & Maintenance

#### Contact Information
- **Technical Support**: tech-support@university.edu
- **System Administrator**: admin@university.edu
- **Emergency Contact**: +1-555-EMERGENCY

#### Maintenance Schedule
- **Daily**: Log monitoring, backup verification
- **Weekly**: Security updates, performance review
- **Monthly**: Full system backup, security audit
- **Quarterly**: System optimization, capacity planning

---

## 🎉 Deployment Complete!

Your Frontend-Backend Integration system is now ready for production use with:
- ✅ **Complete Integration**: Frontend and Backend working seamlessly
- ✅ **Production Security**: SSL, authentication, and data protection
- ✅ **Scalable Architecture**: Ready for growth and expansion
- ✅ **Monitoring**: Health checks and performance monitoring
- ✅ **Backup Strategy**: Data protection and recovery
- ✅ **Documentation**: Complete deployment and user guides

**System Status: PRODUCTION READY** 🚀
