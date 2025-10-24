# Production Deployment Guide
## Final Project Management System

เอกสารนี้อธิบายขั้นตอนสำหรับการ deploy app ไปยังสภาพแวดล้อมการผลิต

---

## 📋 ข้อกำหนดเบื้องต้น

### สำหรับ Server
- **OS**: Ubuntu 20.04+ หรือ Linux ที่เทียบเท่า
- **Python**: 3.10+
- **Node.js**: 18+
- **Database**: PostgreSQL 12+
- **Redis**: 6.0+
- **Nginx**: เป็น reverse proxy

### หรือ Platform as a Service (PaaS)
- Render.com
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Azure App Service

---

## 🚀 วิธีการ Deploy

### ตัวเลือก 1: Deploy บน Render.com (แนะนำสำหรับผู้เริ่มต้น)

#### ขั้นตอนที่ 1: เตรียม GitHub Repository
```bash
# ตรวจสอบว่า repo อยู่ใน GitHub
git remote -v

# ควรเห็น:
# origin  https://github.com/your-username/web101.git (fetch)
# origin  https://github.com/your-username/web101.git (push)
```

#### ขั้นตอนที่ 2: เข้าไปที่ Render.com
1. ไปที่ https://render.com
2. Sign up หรือ Login ด้วย GitHub account
3. Connect GitHub repository

#### ขั้นตอนที่ 3: สร้าง Web Service
1. ใน Render Dashboard, คลิก "Create +" → "Web Service"
2. เลือก repository `web101`
3. กรอกข้อมูล:
   - **Name**: `final-project-management`
   - **Environment**: Python 3
   - **Build Command**: 
     ```bash
     pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
     ```
   - **Start Command**: 
     ```bash
     cd backend && gunicorn final_project_management.wsgi:application --bind 0.0.0.0:$PORT
     ```

#### ขั้นตอนที่ 4: สร้าง PostgreSQL Database
1. ใน Render Dashboard, คลิก "Create +" → "PostgreSQL"
2. กรอก:
   - **Name**: `final-project-management-db`
   - **Database**: `final_project_management`
   - เลือก region เดียวกับ Web Service

#### ขั้นตอนที่ 5: สร้าง Redis Cache
1. ใน Render Dashboard, คลิก "Create +" → "Redis"
2. กรอก:
   - **Name**: `final-project-management-redis`
   - เลือก region เดียวกัน

#### ขั้นตอนที่ 6: ตั้งค่า Environment Variables
ใน Web Service settings, ไปที่ "Environment" และเพิ่ม:

```env
DEBUG=False
SECRET_KEY=your-unique-secret-key-here
ALLOWED_HOSTS=your-domain.render.com,www.your-domain.com
DATABASE_URL=postgresql://user:password@host/database
REDIS_URL=redis://user:password@host:port
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
GEMINI_API_KEY=your-api-key
```

#### ขั้นตอนที่ 7: Deploy
1. Render จะ auto-deploy เมื่อ push ไป main/master branch
2. ตรวจสอบ logs: Dashboard → Web Service → "Logs"

#### ขั้นตอนที่ 8: รัน Migrations
```bash
# ผ่าน Render Shell หรือ SSH:
cd backend && python manage.py migrate
```

#### ขั้นตอนที่ 9: สร้าง Superuser
```bash
cd backend && python manage.py createsuperuser
```

---

### ตัวเลือก 2: Deploy บน VPS (Linode, DigitalOcean, AWS EC2)

#### ขั้นตอนที่ 1: Setup Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.10 python3-pip python3.10-venv \
  nodejs npm postgresql postgresql-contrib redis-server nginx git

# Create app user
sudo useradd -m -s /bin/bash app
sudo su - app
```

#### ขั้นตอนที่ 2: Clone Repository

```bash
cd /home/app
git clone https://github.com/your-username/web101.git
cd web101
```

#### ขั้นตอนที่ 3: Setup Python Environment

```bash
python3.10 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
pip install gunicorn
```

#### ขั้นตอนที่ 4: Setup Database

```bash
sudo -u postgres psql
CREATE DATABASE final_project_management;
CREATE USER app_user WITH PASSWORD 'strong_password';
ALTER ROLE app_user SET client_encoding TO 'utf8';
ALTER ROLE app_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE app_user SET default_transaction_deferrable TO on;
ALTER ROLE app_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE final_project_management TO app_user;
\q
```

#### ขั้นตอนที่ 5: Configure .env

```bash
cp backend/.env.production backend/.env
nano backend/.env  # Edit with your settings
```

#### ขั้นตอนที่ 6: Run Migrations

```bash
cd backend
source ../venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

#### ขั้นตอนที่ 7: Build Frontend

```bash
cd /home/app/web101/frontend
npm install
npm run build
```

#### ขั้นตอนที่ 8: Setup Gunicorn

สร้าง `/home/app/web101/gunicorn_config.py`:

```python
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
timeout = 30
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
```

#### ขั้นตอนที่ 9: Create Systemd Service

สร้าง `/etc/systemd/system/final-project-management.service`:

```ini
[Unit]
Description=Final Project Management Application
After=network.target postgresql.service redis-server.service

[Service]
Type=notify
User=app
WorkingDirectory=/home/app/web101/backend
ExecStart=/home/app/web101/venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --bind 127.0.0.1:8000 \
    --timeout 30 \
    final_project_management.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable final-project-management
sudo systemctl start final-project-management
sudo systemctl status final-project-management
```

#### ขั้นตอนที่ 10: Setup Nginx

สร้าง `/etc/nginx/sites-available/final-project-management`:

```nginx
upstream app {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    client_max_body_size 100M;
    
    location /static/ {
        alias /home/app/web101/backend/staticfiles/;
        expires 30d;
    }
    
    location /media/ {
        alias /home/app/web101/backend/media/;
    }
    
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/final-project-management \
    /etc/nginx/sites-enabled/

sudo nginx -t
sudo systemctl restart nginx
```

#### ขั้นตอนที่ 11: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🔒 Security Checklist

- [ ] `DEBUG=False` ใน production
- [ ] `SECRET_KEY` ถูกเปลี่ยนเป็นค่าที่สุ่ม
- [ ] `ALLOWED_HOSTS` ตั้งค่าให้ถูกต้อง
- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] Database password เก็บเป็นความลับ
- [ ] Redis มี authentication
- [ ] CORS origins ตั้งค่าให้เข้มงวด
- [ ] Email configuration สำหรับ production
- [ ] Backup strategy ตั้งค่าแล้ว
- [ ] Monitoring & logging เปิดใช้งาน

---

## 📊 Monitoring & Maintenance

### Logs
```bash
# Django logs
sudo tail -f /var/log/final-project-management/error.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u final-project-management -f
```

### Database Backup
```bash
# Daily backup
sudo -u postgres pg_dump final_project_management > backup_$(date +%Y%m%d).sql

# Restore
sudo -u postgres psql final_project_management < backup_20231024.sql
```

### Update Application
```bash
cd /home/app/web101
git pull origin master
source venv/bin/activate
pip install -r backend/requirements.txt
cd backend && python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart final-project-management
```

---

## 🆘 Troubleshooting

### Connection Refused
```bash
sudo systemctl status final-project-management
sudo journalctl -u final-project-management -n 20
```

### Static Files Not Loading
```bash
cd backend
python manage.py collectstatic --clear --noinput
sudo systemctl restart final-project-management
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U app_user -d final_project_management -h localhost
```

### Memory Issues
```bash
# Monitor
free -h
top

# Reduce gunicorn workers
nano /etc/systemd/system/final-project-management.service
# Change workers to 2
sudo systemctl restart final-project-management
```

---

## 📞 Support

สำหรับปัญหาเพิ่มเติม:
1. ตรวจสอบ logs
2. ดูเอกสาร Django: https://docs.djangoproject.com/
3. ตรวจสอบ repository issues

---

**ปรับปรุงครั้งล่าสุด**: October 24, 2025

