# 📋 Production Deployment Checklist

## 🔐 ขั้นตอนที่ 1: ตั้งค่า Environment Variables

### Backend (.env)

1. **คัดลอกไฟล์ Production**
   ```bash
   cd backend
   cp .env.production .env
   ```

2. **อัพเดทค่าสำคัญ** ใน `backend/.env`:

   ✅ **Domain & Hosts**
   ```env
   ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
   ```

   ✅ **Database (PostgreSQL)**
   ```env
   DB_NAME=your_database_name
   DB_USER=your_db_user
   DB_PASSWORD=your_strong_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

   ✅ **Email Settings**
   ```env
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   DEFAULT_FROM_EMAIL=noreply@yourdomain.com
   ```

   ✅ **CORS Origins**
   ```env
   CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

   ✅ **CSRF Trusted Origins**
   ```env
   CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

   ✅ **Static/Media Paths**
   ```env
   STATIC_ROOT=/var/www/yourdomain/static
   MEDIA_ROOT=/var/www/yourdomain/media
   ```

---

### Frontend (.env)

สร้างไฟล์ `frontend/.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=EduInfo Project Management
VITE_ENVIRONMENT=production
```

---

## 🗄️ ขั้นตอนที่ 2: ตั้งค่า Database

### ติดตั้ง PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### สร้าง Database

```bash
# เข้าสู่ PostgreSQL
sudo -u postgres psql

# สร้าง database และ user
CREATE DATABASE final_project_management;
CREATE USER your_db_user WITH PASSWORD 'your_strong_password';
ALTER ROLE your_db_user SET client_encoding TO 'utf8';
ALTER ROLE your_db_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE your_db_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE final_project_management TO your_db_user;
\q
```

### Migrate Database

```bash
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

---

## 🔒 ขั้นตอนที่ 3: ตั้งค่า Security

### 1. SSL/TLS Certificate

**ใช้ Let's Encrypt (แนะนำ):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 2. Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 3. ตรวจสอบการตั้งค่าใน .env

```env
DEBUG=False                      # ✅ ต้องเป็น False
SECURE_SSL_REDIRECT=True         # ✅ บังคับ HTTPS
SESSION_COOKIE_SECURE=True       # ✅ Secure cookies
CSRF_COOKIE_SECURE=True          # ✅ CSRF protection
```

---

## 🚀 ขั้นตอนที่ 4: Deploy Application

### Option 1: Deploy ด้วย Nginx + Gunicorn

#### 1. ติดตั้ง Dependencies

```bash
pip install gunicorn
```

#### 2. สร้าง Gunicorn Service

สร้างไฟล์ `/etc/systemd/system/gunicorn.service`:

```ini
[Unit]
Description=gunicorn daemon for Django
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/yourdomain/backend
Environment="PATH=/var/www/yourdomain/.venv/bin"
ExecStart=/var/www/yourdomain/.venv/bin/gunicorn \
    --workers 3 \
    --bind unix:/var/www/yourdomain/gunicorn.sock \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
```

#### 3. Start Gunicorn

```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
sudo systemctl status gunicorn
```

#### 4. Configure Nginx

สร้างไฟล์ `/etc/nginx/sites-available/yourdomain`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/yourdomain/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://unix:/var/www/yourdomain/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static/ {
        alias /var/www/yourdomain/static/;
    }

    # Media files
    location /media/ {
        alias /var/www/yourdomain/media/;
    }
}
```

#### 5. Enable site และ restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Option 2: Deploy ด้วย Docker

สร้างไฟล์ `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: final_project_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    env_file:
      - ./backend/.env
    depends_on:
      - db
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    volumes:
      - ./frontend/dist:/usr/share/nginx/html

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html
      - static_volume:/static
      - media_volume:/media
      - certbot_certs:/etc/letsencrypt
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
  static_volume:
  media_volume:
  certbot_certs:
```

---

## ✅ ขั้นตอนที่ 5: Post-Deployment Checklist

### 1. ทดสอบ Backend

```bash
# ทดสอบ API endpoint
curl https://api.yourdomain.com/api/health/
curl https://api.yourdomain.com/api/students/
```

### 2. ทดสอบ Frontend

เปิด browser: `https://yourdomain.com`

- ✅ หน้าเว็บโหลดได้
- ✅ Login ทำงานได้
- ✅ API calls สำเร็จ
- ✅ ไม่มี console errors
- ✅ HTTPS ทำงานได้ (🔒 สีเขียว)

### 3. ตรวจสอบ Security Headers

```bash
curl -I https://yourdomain.com
```

ควรเห็น headers:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

### 4. Monitor Logs

```bash
# Django logs
sudo journalctl -u gunicorn -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 ขั้นตอนที่ 6: Backup & Monitoring

### Backup Database

สร้าง cron job สำหรับ backup:

```bash
# เปิด crontab
crontab -e

# เพิ่มบรรทัดนี้ (backup ทุกวันเวลา 2 AM)
0 2 * * * pg_dump -U your_db_user final_project_management > /backups/db_$(date +\%Y\%m\%d).sql
```

### Setup Monitoring (Optional)

- **Sentry**: Error tracking
- **New Relic**: Performance monitoring
- **Grafana + Prometheus**: System metrics

---

## 📝 Final Checklist

ก่อน Go Live ตรวจสอบอีกครั้ง:

- [ ] `DEBUG=False` ใน backend/.env
- [ ] Database เป็น PostgreSQL (ไม่ใช่ SQLite)
- [ ] SSL/HTTPS ทำงานได้
- [ ] CORS ตั้งค่าถูกต้อง
- [ ] Email sending ทำงานได้
- [ ] Static files serve ได้
- [ ] Media uploads ทำงานได้
- [ ] Backup system ตั้งค่าแล้ว
- [ ] Monitoring/Logging ทำงานได้
- [ ] Superuser account สร้างแล้ว
- [ ] ทดสอบทุก feature แล้ว

---

## 🆘 Troubleshooting

### ปัญหา: 502 Bad Gateway

```bash
# ตรวจสอบ Gunicorn
sudo systemctl status gunicorn
sudo journalctl -u gunicorn -n 50

# Restart Gunicorn
sudo systemctl restart gunicorn
```

### ปัญหา: Static files ไม่โหลด

```bash
cd backend
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

### ปัญหา: Database connection error

```bash
# ตรวจสอบ PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -l

# ตรวจสอบ credentials ใน .env
```

---

## 📚 เอกสารเพิ่มเติม

- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/getting-started/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)

---

**สำเร็จแล้ว! 🎉**

Application ของคุณพร้อม production แล้วครับ!

