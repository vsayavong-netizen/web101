# 🚀 Deployment Quick Start Guide

**วันที่สร้าง**: 2025-01-27  
**สถานะ**: ✅ Ready to Deploy

---

## 📋 Overview

คู่มือนี้จะช่วยให้คุณ deploy ระบบ BM23 ไปยัง production ได้อย่างรวดเร็ว

---

## ⚡ Quick Start (3 ขั้นตอน)

### Step 1: Pre-Deployment Check (5 นาที)

```bash
# ตรวจสอบความพร้อมของระบบ
python3 pre_deployment_check.py
```

**สิ่งที่ต้องทำ**:
- [ ] แก้ไข `backend/.env.production` ด้วยค่าจริง
- [ ] คัดลอก `.env.production` เป็น `.env`: `cp backend/.env.production backend/.env`
- [ ] อัพเดทค่าทั้งหมดใน `backend/.env` (database, domain, email, etc.)

---

### Step 2: Automated Deployment (10-15 นาที)

```bash
# รัน automated deployment script
bash deploy_production_automated.sh
```

**Script นี้จะทำ**:
- ✅ ตรวจสอบ dependencies
- ✅ สร้าง/activate virtual environment
- ✅ ติดตั้ง Python packages
- ✅ Run database migrations
- ✅ Collect static files
- ✅ Build frontend
- ✅ Run system checks

---

### Step 3: Post-Deployment Verification (5 นาที)

```bash
# ตรวจสอบว่าระบบทำงานถูกต้อง
python3 post_deployment_verify.py https://yourdomain.com
```

**หรือตรวจสอบด้วยตนเอง**:
- [ ] เปิดเว็บไซต์: `https://yourdomain.com`
- [ ] ทดสอบ login
- [ ] ทดสอบ API endpoints
- [ ] ตรวจสอบ static files

---

## 📝 Detailed Steps

### 1. Environment Configuration

#### 1.1 แก้ไข `.env.production`

```bash
cd backend
nano .env.production  # หรือใช้ editor อื่น
```

**ค่าที่ต้องแก้ไข**:
- `SECRET_KEY` - สร้างด้วย: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`
- `ALLOWED_HOSTS` - domain ของคุณ
- `DB_NAME`, `DB_USER`, `DB_PASSWORD` - ข้อมูล database
- `CORS_ALLOWED_ORIGINS` - domain ของ frontend
- `EMAIL_*` - การตั้งค่า email
- `STATIC_ROOT`, `MEDIA_ROOT` - paths สำหรับ static/media files

#### 1.2 คัดลอกเป็น `.env`

```bash
cp .env.production .env
```

---

### 2. Database Setup

#### 2.1 สร้าง PostgreSQL Database

```bash
sudo -u postgres psql

# ใน PostgreSQL prompt:
CREATE DATABASE final_project_management;
CREATE USER your_db_user WITH PASSWORD 'your_strong_password';
ALTER ROLE your_db_user SET client_encoding TO 'utf8';
ALTER ROLE your_db_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE your_db_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE final_project_management TO your_db_user;
\q
```

#### 2.2 Run Migrations

```bash
cd backend
python manage.py migrate
```

---

### 3. Web Server Setup

#### 3.1 Install Gunicorn

```bash
pip install gunicorn
```

#### 3.2 Create Gunicorn Service

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
    final_project_management.wsgi:application

[Install]
WantedBy=multi-user.target
```

#### 3.3 Start Gunicorn

```bash
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
sudo systemctl status gunicorn
```

---

### 4. Nginx Configuration

#### 4.1 Copy Nginx Config

```bash
sudo cp nginx_production.conf /etc/nginx/sites-available/yourdomain
```

#### 4.2 Edit Configuration

แก้ไข `/etc/nginx/sites-available/yourdomain`:
- เปลี่ยน `your-domain.com` เป็น domain จริง
- เปลี่ยน paths ให้ตรงกับระบบของคุณ
- ตรวจสอบ SSL certificate paths

#### 4.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## ✅ Verification Checklist

### Pre-Deployment
- [ ] `.env.production` แก้ไขแล้ว
- [ ] `.env` file สร้างแล้ว
- [ ] Database สร้างแล้ว
- [ ] PostgreSQL ทำงานอยู่
- [ ] Dependencies ติดตั้งแล้ว

### Post-Deployment
- [ ] Website โหลดได้: `https://yourdomain.com`
- [ ] Login ทำงานได้
- [ ] API endpoints ทำงานได้
- [ ] Static files โหลดได้
- [ ] HTTPS ทำงานได้ (🔒)
- [ ] Security headers ถูกต้อง
- [ ] ไม่มี console errors

---

## 🔧 Troubleshooting

### ปัญหา: 502 Bad Gateway

```bash
# ตรวจสอบ Gunicorn
sudo systemctl status gunicorn
sudo journalctl -u gunicorn -n 50

# Restart
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

# ตรวจสอบ credentials ใน .env
cat backend/.env | grep DB_
```

### ปัญหา: Permission errors

```bash
# ตั้งค่า permissions
sudo chown -R www-data:www-data /var/www/yourdomain
sudo chmod -R 755 /var/www/yourdomain
```

---

## 📚 Related Documents

- **`PRODUCTION_DEPLOYMENT_CHECKLIST.md`** - Checklist แบบละเอียด
- **`ACTION_PLAN.md`** - แผนปฏิบัติการ
- **`NEXT_STEPS_RECOMMENDATIONS.md`** - คำแนะนำขั้นตอนต่อไป
- **`nginx_production.conf`** - Nginx configuration template

---

## 🎯 Next Steps

หลัง deployment สำเร็จ:

1. **Security Hardening** (4-6 hours)
   - Review security settings
   - Set up monitoring
   - Configure backups

2. **Performance Optimization** (5-8 hours)
   - Set up Redis caching
   - Optimize database queries
   - Configure CDN (optional)

3. **Monitoring Setup** (4-6 hours)
   - Set up error tracking (Sentry)
   - Configure log aggregation
   - Set up uptime monitoring

---

## 🆘 Support

หากพบปัญหา:
1. ตรวจสอบ logs: `sudo journalctl -u gunicorn -f`
2. ตรวจสอบ Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. ตรวจสอบ Django logs: `tail -f /var/log/django/error.log`
4. Review `PRODUCTION_DEPLOYMENT_CHECKLIST.md` สำหรับ troubleshooting

---

**Last Updated**: 2025-01-27  
**Status**: ✅ Ready  
**Estimated Time**: 30-45 minutes

---

*Quick start guide for production deployment*
