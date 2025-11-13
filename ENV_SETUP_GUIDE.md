# 🔧 Environment Setup Guide

**วันที่สร้าง**: 2025-01-27  
**สถานะ**: ⚠️ Action Required

---

## 📋 Overview

คู่มือนี้จะช่วยคุณตั้งค่าไฟล์ `.env` สำหรับ production deployment

---

## ⚠️ IMPORTANT: Values to Update

ไฟล์ `backend/.env` ถูกสร้างจาก template แล้ว แต่คุณ**ต้องแก้ไขค่าต่อไปนี้**ก่อน deployment:

---

## 🔐 Critical Values (ต้องแก้ไข)

### 1. SECRET_KEY (Required)
```bash
# สร้าง SECRET_KEY ใหม่
cd backend
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Copy output และใส่ใน `.env`**:
```env
SECRET_KEY=<generated-secret-key-here>
```

---

### 2. ALLOWED_HOSTS (Required)
```env
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
```

**ตัวอย่าง**:
```env
ALLOWED_HOSTS=example.com,www.example.com,api.example.com
```

---

### 3. Database Configuration (Required)

#### 3.1 สร้าง Database ก่อน
```bash
sudo -u postgres psql

# ใน PostgreSQL:
CREATE DATABASE final_project_management;
CREATE USER your_db_user WITH PASSWORD 'your_strong_password';
ALTER ROLE your_db_user SET client_encoding TO 'utf8';
ALTER ROLE your_db_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE your_db_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE final_project_management TO your_db_user;
\q
```

#### 3.2 อัพเดทใน `.env`
```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=final_project_management
DB_USER=your_db_user
DB_PASSWORD=your_strong_password
DB_HOST=localhost
DB_PORT=5432
```

---

### 4. CORS & CSRF Origins (Required)
```env
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**ตัวอย่าง**:
```env
CORS_ALLOWED_ORIGINS=https://example.com,https://www.example.com
CSRF_TRUSTED_ORIGINS=https://example.com,https://www.example.com
```

---

### 5. Email Configuration (Optional but Recommended)
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**สำหรับ Gmail**:
1. เปิด 2-Step Verification
2. สร้าง App Password: https://myaccount.google.com/apppasswords
3. ใช้ App Password แทน regular password

---

### 6. Static & Media Paths (Required)
```env
STATIC_ROOT=/var/www/yourdomain/static
MEDIA_ROOT=/var/www/yourdomain/media
```

**ปรับให้ตรงกับ path จริงบน server**:
```env
STATIC_ROOT=/var/www/example.com/static
MEDIA_ROOT=/var/www/example.com/media
```

---

## ✅ Quick Setup Steps

### Step 1: Generate SECRET_KEY
```bash
cd backend
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Step 2: Edit .env File
```bash
nano .env  # หรือใช้ editor อื่น
```

### Step 3: Update All Values
แก้ไขค่าทั้งหมดตามที่ระบุด้านบน

### Step 4: Verify Configuration
```bash
cd ..
python3 pre_deployment_check.py
```

---

## 📝 Checklist

ก่อนรัน deployment script ตรวจสอบว่า:

- [ ] `SECRET_KEY` ถูกสร้างและอัพเดทแล้ว
- [ ] `ALLOWED_HOSTS` ตั้งค่าเป็น domain จริงแล้ว
- [ ] Database สร้างแล้วและ credentials ถูกต้อง
- [ ] `CORS_ALLOWED_ORIGINS` ตั้งค่าเป็น domain จริงแล้ว
- [ ] `CSRF_TRUSTED_ORIGINS` ตั้งค่าเป็น domain จริงแล้ว
- [ ] `STATIC_ROOT` และ `MEDIA_ROOT` ตั้งค่าเป็น paths จริงแล้ว
- [ ] Email settings ตั้งค่าแล้ว (ถ้าต้องการ)
- [ ] `DEBUG=False` (ตรวจสอบว่ายังเป็น False)
- [ ] Security settings ทั้งหมดเป็น `True` (สำหรับ production)

---

## 🔍 Verify Your Configuration

### Check Current Values
```bash
cd backend
grep -E "^(SECRET_KEY|ALLOWED_HOSTS|DB_|CORS_|STATIC_ROOT|MEDIA_ROOT|DEBUG)=" .env
```

### Test Database Connection
```bash
cd backend
python manage.py check --database default
```

---

## ⚠️ Security Notes

1. **อย่า commit `.env` file** - ไฟล์นี้มี sensitive information
2. **ใช้ strong passwords** - สำหรับ database และ SECRET_KEY
3. **ตรวจสอบ permissions** - `.env` ควรมี permissions 600
   ```bash
   chmod 600 backend/.env
   ```

---

## 🆘 Troubleshooting

### ปัญหา: Database connection error
- ตรวจสอบว่า PostgreSQL ทำงานอยู่: `sudo systemctl status postgresql`
- ตรวจสอบ credentials ใน `.env`
- ทดสอบ connection: `psql -U your_db_user -d final_project_management`

### ปัญหา: SECRET_KEY not set
- สร้าง SECRET_KEY ใหม่ตามขั้นตอนด้านบน
- ตรวจสอบว่าไม่มี spaces หรือ quotes ใน `.env`

### ปัญหา: ALLOWED_HOSTS error
- ตรวจสอบว่า domain ถูกต้องและไม่มี spaces
- ใช้ comma-separated list: `domain1.com,domain2.com`

---

**Last Updated**: 2025-01-27  
**Status**: ⚠️ Action Required

---

*Guide for setting up production environment variables*
