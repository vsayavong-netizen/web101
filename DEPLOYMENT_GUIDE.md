# 🚀 Frontend-Backend Integration Deployment Guide

## 📋 Overview
This guide covers the complete deployment process for the University Final Project Management System with full Frontend-Backend integration.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                             │
│  ├── Components (85+ components)                          │
│  ├── Hooks (7 custom hooks)                               │
│  ├── Context (3 context providers)                        │
│  ├── Utils (3 utility modules)                            │
│  └── API Client (Complete integration)                    │
├─────────────────────────────────────────────────────────────┤
│  Backend (Django + DRF)                                    │
│  ├── Core APIs (18 endpoints)                             │
│  ├── Authentication (JWT)                                  │
│  ├── File Management                                       │
│  ├── Communication System                                  │
│  ├── AI Enhancement                                        │
│  ├── Defense Management                                    │
│  └── Analytics & Reporting                                 │
├─────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)                                     │
│  ├── User Management                                       │
│  ├── Project Data                                          │
│  ├── File Storage                                          │
│  └── Analytics Data                                        │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure                                            │
│  ├── Web Server (Nginx)                                    │
│  ├── Application Server (Gunicorn)                        │
│  ├── Database Server (PostgreSQL)                         │
│  ├── Cache Server (Redis)                                  │
│  └── File Storage (Local/S3)                              │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 100GB minimum
- **CPU**: 4 cores minimum, 8 cores recommended

### Software Requirements
- **Python**: 3.11+
- **Node.js**: 18+
- **PostgreSQL**: 14+
- **Redis**: 6+
- **Nginx**: 1.20+

## 📦 Installation Steps

### 1. Backend Setup

```bash
# Clone repository
git clone <repository-url>
cd bm23/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Set up production data
python production_setup.py

# Collect static files
python manage.py collectstatic --noinput

# Test the setup
python test_full_integration.py
```

### 2. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Test the build
npm run preview
```

### 3. Database Setup

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE final_project_management;
CREATE USER project_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE final_project_management TO project_user;
\q

# Update database settings in .env
DATABASE_URL=postgresql://project_user:secure_password@localhost:5432/final_project_management
```

### 4. Redis Setup

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
```

## 🚀 Production Deployment

### 1. Web Server Configuration (Nginx)

```nginx
# /etc/nginx/sites-available/final-project-management
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static/ {
        alias /path/to/backend/staticfiles/;
    }
    
    # Media files
    location /media/ {
        alias /path/to/backend/media/;
    }
}
```

### 2. Application Server (Gunicorn)

```bash
# Install Gunicorn
pip install gunicorn

# Create Gunicorn configuration
cat > gunicorn.conf.py << EOF
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
EOF

# Start Gunicorn
gunicorn -c gunicorn.conf.py final_project_management.wsgi:application
```

### 3. Process Management (Systemd)

```ini
# /etc/systemd/system/final-project-management.service
[Unit]
Description=Final Project Management System
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/path/to/backend
Environment=PATH=/path/to/backend/venv/bin
ExecStart=/path/to/backend/venv/bin/gunicorn -c gunicorn.conf.py final_project_management.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable final-project-management
sudo systemctl start final-project-management
sudo systemctl status final-project-management
```

### 4. SSL Configuration

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Configuration

### Environment Variables

```bash
# .env file
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379/0
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Database Configuration

```python
# settings_production.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'final_project_management',
        'USER': 'project_user',
        'PASSWORD': 'secure_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## 📊 Monitoring & Maintenance

### 1. Log Management

```bash
# Log rotation
sudo nano /etc/logrotate.d/final-project-management

# Content:
/path/to/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

### 2. Backup Strategy

```bash
# Database backup script
#!/bin/bash
# backup_db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump final_project_management > /backups/db_$DATE.sql
find /backups -name "db_*.sql" -mtime +7 -delete
```

### 3. Performance Monitoring

```bash
# Install monitoring tools
pip install django-debug-toolbar
pip install django-extensions

# Add to settings
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

## 🔒 Security Configuration

### 1. Firewall Setup

```bash
# Configure UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Database Security

```sql
-- PostgreSQL security
ALTER USER project_user SET default_transaction_read_only = off;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO project_user;
```

### 3. Application Security

```python
# settings_production.py
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
```

## 🧪 Testing & Validation

### 1. Integration Testing

```bash
# Run full integration test
cd backend
python test_full_integration.py

# Expected output:
# ✅ API Endpoints: 18/18 accessible
# ✅ Database Models: All accessible
# ✅ Frontend-Backend Integration: 100% Complete
```

### 2. Performance Testing

```bash
# Install testing tools
pip install locust

# Run load testing
locust -f load_test.py --host=http://your-domain.com
```

### 3. Security Testing

```bash
# Install security tools
pip install bandit safety

# Run security checks
bandit -r backend/
safety check
```

## 📈 Scaling & Optimization

### 1. Horizontal Scaling

```yaml
# docker-compose.yml for scaling
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000-8003:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/dbname
    depends_on:
      - db
      - redis
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - web
```

### 2. Caching Strategy

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
```

## 🚨 Troubleshooting

### Common Issues

1. **ALLOWED_HOSTS Error**
   ```python
   ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']
   ```

2. **Database Connection Error**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U project_user -d final_project_management
   ```

3. **Static Files Not Loading**
   ```bash
   # Collect static files
   python manage.py collectstatic --noinput
   
   # Check Nginx configuration
   sudo nginx -t
   ```

## 📞 Support & Maintenance

### Contact Information
- **Technical Support**: tech-support@university.edu
- **System Administrator**: admin@university.edu
- **Documentation**: https://docs.university.edu

### Maintenance Schedule
- **Daily**: Log monitoring, backup verification
- **Weekly**: Security updates, performance review
- **Monthly**: Full system backup, security audit
- **Quarterly**: System optimization, capacity planning

---

## 🎉 Deployment Complete!

Your Frontend-Backend Integration system is now ready for production use with:
- ✅ 100% API Coverage
- ✅ Complete Integration
- ✅ Production Security
- ✅ Scalable Architecture
- ✅ Monitoring & Maintenance

**System Status: PRODUCTION READY** 🚀
