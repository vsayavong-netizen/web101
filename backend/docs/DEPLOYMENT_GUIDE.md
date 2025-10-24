# Final Project Management System - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Final Project Management System in production environments. The system is designed to be scalable, secure, and maintainable.

## Prerequisites

### System Requirements

- **Operating System**: Ubuntu 20.04 LTS or later
- **Python**: 3.9 or later
- **Database**: PostgreSQL 12 or later
- **Web Server**: Nginx 1.18 or later
- **Process Manager**: Supervisor or systemd
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 50GB SSD
- **CPU**: Minimum 2 cores (4 cores recommended)

### Software Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3.9 python3.9-venv python3-pip -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install Redis (for caching and sessions)
sudo apt install redis-server -y

# Install Git
sudo apt install git -y

# Install Supervisor
sudo apt install supervisor -y

# Install SSL certificates tool
sudo apt install certbot python3-certbot-nginx -y
```

## Database Setup

### PostgreSQL Configuration

1. **Create Database and User**
```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE final_project_management;
CREATE USER fpm_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE final_project_management TO fpm_user;
ALTER USER fpm_user CREATEDB;
\q
```

2. **Configure PostgreSQL**
```bash
sudo nano /etc/postgresql/12/main/postgresql.conf
```

Add/modify these settings:
```
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

3. **Configure Authentication**
```bash
sudo nano /etc/postgresql/12/main/pg_hba.conf
```

Add this line:
```
local   final_project_management   fpm_user                    md5
```

4. **Restart PostgreSQL**
```bash
sudo systemctl restart postgresql
```

## Application Deployment

### 1. Create Application Directory

```bash
sudo mkdir -p /opt/final-project-management
sudo chown $USER:$USER /opt/final-project-management
cd /opt/final-project-management
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/final-project-management.git .
```

### 3. Create Virtual Environment

```bash
python3.9 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

### 5. Environment Configuration

Create environment file:
```bash
nano .env
```

```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,localhost

# Database
DATABASE_URL=postgresql://fpm_user:secure_password_here@localhost:5432/final_project_management

# Redis
REDIS_URL=redis://localhost:6379/0

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AI Integration
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Security
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-s3-bucket
AWS_S3_REGION_NAME=us-east-1
```

### 6. Django Configuration

```bash
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py createsuperuser
```

### 7. Create Gunicorn Configuration

```bash
nano gunicorn.conf.py
```

```python
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
user = "www-data"
group = "www-data"
```

### 8. Create Supervisor Configuration

```bash
sudo nano /etc/supervisor/conf.d/final-project-management.conf
```

```ini
[program:final-project-management]
command=/opt/final-project-management/venv/bin/gunicorn --config gunicorn.conf.py backend.wsgi:application
directory=/opt/final-project-management
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/final-project-management.log
stdout_logfile_maxbytes=50MB
stdout_logfile_backups=10
```

### 9. Start Application

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start final-project-management
```

## Web Server Configuration

### Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/final-project-management
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Static Files
    location /static/ {
        alias /opt/final-project-management/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias /opt/final-project-management/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API and Application
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    location /api/auth/login/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/final-project-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL Certificate

### Let's Encrypt SSL

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Auto-renewal

```bash
sudo crontab -e
```

Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### 1. Log Rotation

```bash
sudo nano /etc/logrotate.d/final-project-management
```

```
/var/log/supervisor/final-project-management.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        supervisorctl restart final-project-management
    endscript
}
```

### 2. System Monitoring

```bash
sudo apt install htop iotop nethogs -y
```

### 3. Database Monitoring

```bash
sudo -u postgres psql
```

```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

## Backup Strategy

### 1. Database Backup

```bash
nano /opt/final-project-management/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U fpm_user final_project_management > $BACKUP_DIR/fpm_db_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/fpm_db_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Database backup completed: fpm_db_$DATE.sql.gz"
```

```bash
chmod +x /opt/final-project-management/backup-db.sh
```

### 2. Media Files Backup

```bash
nano /opt/final-project-management/backup-media.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/media"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Create media backup
tar -czf $BACKUP_DIR/fpm_media_$DATE.tar.gz /opt/final-project-management/media/

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Media backup completed: fpm_media_$DATE.tar.gz"
```

```bash
chmod +x /opt/final-project-management/backup-media.sh
```

### 3. Automated Backups

```bash
sudo crontab -e
```

```
# Database backup daily at 2 AM
0 2 * * * /opt/final-project-management/backup-db.sh

# Media backup daily at 3 AM
0 3 * * * /opt/final-project-management/backup-media.sh
```

## Security Hardening

### 1. Firewall Configuration

```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 2. Fail2Ban Configuration

```bash
sudo apt install fail2ban -y
sudo nano /etc/fail2ban/jail.local
```

```
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

### 3. System Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX idx_users_academic_year ON users_user(academic_year);
CREATE INDEX idx_students_academic_year ON students_student(academic_year);
CREATE INDEX idx_projects_academic_year ON projects_project(academic_year);
CREATE INDEX idx_projects_status ON projects_project(status);
CREATE INDEX idx_projects_advisor ON projects_project(advisor_id);
```

### 2. Redis Configuration

```bash
sudo nano /etc/redis/redis.conf
```

```
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. Nginx Optimization

```bash
sudo nano /etc/nginx/nginx.conf
```

```
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;
}
```

## Scaling Considerations

### 1. Load Balancer Configuration

For multiple application servers:

```nginx
upstream final_project_management {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    location / {
        proxy_pass http://final_project_management;
        # ... other proxy settings
    }
}
```

### 2. Database Scaling

- **Read Replicas**: Configure PostgreSQL read replicas for read-heavy operations
- **Connection Pooling**: Use PgBouncer for connection pooling
- **Partitioning**: Implement table partitioning for large datasets

### 3. Caching Strategy

- **Redis Cluster**: For distributed caching
- **CDN**: For static file delivery
- **Application Caching**: Django cache framework

## Troubleshooting

### Common Issues

1. **Application Won't Start**
```bash
sudo supervisorctl status final-project-management
sudo supervisorctl tail final-project-management
```

2. **Database Connection Issues**
```bash
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

3. **Nginx Configuration Issues**
```bash
sudo nginx -t
sudo systemctl status nginx
```

4. **SSL Certificate Issues**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

### Log Files

- Application logs: `/var/log/supervisor/final-project-management.log`
- Nginx logs: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- PostgreSQL logs: `/var/log/postgresql/postgresql-12-main.log`
- System logs: `/var/log/syslog`

## Maintenance

### Regular Tasks

1. **Daily**
   - Check application status
   - Monitor disk space
   - Review error logs

2. **Weekly**
   - Update system packages
   - Check backup status
   - Review performance metrics

3. **Monthly**
   - Security updates
   - Database maintenance
   - Log rotation

### Health Checks

```bash
# Application health
curl -f http://localhost:8000/api/health/ || echo "Application down"

# Database health
sudo -u postgres psql -c "SELECT 1;" || echo "Database down"

# Redis health
redis-cli ping || echo "Redis down"
```

## Disaster Recovery

### 1. Recovery Procedures

1. **Database Recovery**
```bash
# Restore from backup
gunzip -c /opt/backups/database/fpm_db_YYYYMMDD_HHMMSS.sql.gz | psql -U fpm_user final_project_management
```

2. **Media Files Recovery**
```bash
# Restore media files
tar -xzf /opt/backups/media/fpm_media_YYYYMMDD_HHMMSS.tar.gz -C /
```

3. **Application Recovery**
```bash
# Redeploy application
cd /opt/final-project-management
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
sudo supervisorctl restart final-project-management
```

### 2. Backup Testing

```bash
# Test database backup
gunzip -c /opt/backups/database/fpm_db_latest.sql.gz | psql -U fpm_user test_database

# Test media backup
tar -tzf /opt/backups/media/fpm_media_latest.tar.gz
```

## Support and Maintenance

### Contact Information

- **Technical Support**: support@finalprojectmanagement.edu
- **Emergency Contact**: +1-555-0123
- **Documentation**: https://docs.finalprojectmanagement.edu

### Maintenance Windows

- **Scheduled Maintenance**: Sundays 2:00 AM - 4:00 AM UTC
- **Emergency Maintenance**: As needed with 24-hour notice
- **Security Updates**: Applied within 48 hours of release

### Monitoring

- **Uptime Monitoring**: https://status.finalprojectmanagement.edu
- **Performance Metrics**: Available in admin dashboard
- **Error Tracking**: Integrated with logging system

This deployment guide provides a comprehensive approach to deploying and maintaining the Final Project Management System in a production environment. Regular updates and monitoring are essential for optimal performance and security.
