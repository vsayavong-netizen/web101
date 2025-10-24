# 🚀 Production Quick Start Guide

เอกสารฉบับย่อสำหรับ Deploy Production อย่างรวดเร็ว

---

## ⚡ ขั้นตอนย่อ (5 นาที)

### 1️⃣ Setup Environment Files

```bash
# Backend
cd backend
cp .env.production .env
nano .env  # แก้ไข: ALLOWED_HOSTS, DB_*, EMAIL_*, CORS_*

# Frontend
cd ../frontend
cp .env.production .env.production
nano .env.production  # แก้ไข: VITE_API_URL
```

### 2️⃣ Update Critical Settings

ใน `backend/.env` แก้ไขอย่างน้อย:

```env
# ⚠️ สำคัญมาก!
DEBUG=False
SECRET_KEY=<ใช้ key ที่สร้างไว้ใน .env.production>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_PASSWORD=<รหัสผ่านที่แข็งแรง>

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
```

### 3️⃣ Setup Database

```bash
# สร้าง PostgreSQL database
sudo -u postgres psql
CREATE DATABASE final_project_management;
CREATE USER dbuser WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE final_project_management TO dbuser;
\q
```

### 4️⃣ Run Deployment Script

**Linux/Mac:**
```bash
chmod +x deploy_to_production.sh
./deploy_to_production.sh
```

**Windows:**
```cmd
deploy_to_production.bat
```

### 5️⃣ Start Services

**Option A: Gunicorn + Nginx**
```bash
sudo systemctl start gunicorn
sudo systemctl start nginx
```

**Option B: Docker**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Quick Verification

### ตรวจสอบ Backend
```bash
curl https://yourdomain.com/api/health/
```

### ตรวจสอบ Frontend
เปิด browser: `https://yourdomain.com`

---

## 🔐 Security Checklist (ต้องทำ!)

- [ ] `DEBUG=False` ✅
- [ ] `SECRET_KEY` ใหม่ (ไม่ใช่ development key) ✅
- [ ] `ALLOWED_HOSTS` มี production domain ✅
- [ ] Database เป็น PostgreSQL (ไม่ใช่ SQLite) ✅
- [ ] SSL/HTTPS เปิดใช้งาน ✅
- [ ] `SECURE_SSL_REDIRECT=True` ✅
- [ ] `SESSION_COOKIE_SECURE=True` ✅
- [ ] `CSRF_COOKIE_SECURE=True` ✅
- [ ] Email settings ถูกต้อง ✅

---

## 📁 ไฟล์สำคัญที่ต้องอัพเดท

| ไฟล์ | สิ่งที่ต้องแก้ |
|------|---------------|
| `backend/.env` | Domain, Database, Email, CORS |
| `frontend/.env.production` | VITE_API_URL |

---

## 🆘 ปัญหาที่พบบ่อย

### ❌ 502 Bad Gateway
```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

### ❌ Static files ไม่โหลด
```bash
cd backend
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn
```

### ❌ CORS Error
ตรวจสอบ `CORS_ALLOWED_ORIGINS` ใน `backend/.env`:
```env
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### ❌ Database connection error
ตรวจสอบ:
1. PostgreSQL กำลังรันอยู่: `sudo systemctl status postgresql`
2. Database credentials ใน `.env` ถูกต้อง
3. Database ถูกสร้างแล้ว

---

## 📚 เอกสารแบบละเอียด

สำหรับรายละเอียดเพิ่มเติม อ่าน:
- **[PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - คู่มือแบบละเอียด

---

## 🎯 หลังจาก Deploy แล้ว

### Setup Monitoring
1. ติดตั้ง logging system
2. Setup error tracking (Sentry)
3. Configure backup automation

### Maintenance
1. สร้าง database backup schedule
2. Monitor disk space
3. Review logs เป็นประจำ

---

**🎉 ขอให้ deployment สำเร็จ!**

ติดปัญหาอะไร ให้เช็คใน `PRODUCTION_DEPLOYMENT_CHECKLIST.md` ครับ

