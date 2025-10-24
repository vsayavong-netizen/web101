# BM23 - Quick Start Guide

## 🚀 เริ่มต้นใช้งาน BM23

### 1. การติดตั้ง (Development)

#### ขั้นตอนที่ 1: เตรียม Environment
```bash
# คัดลอกไฟล์ environment
cp .env.example .env

# แก้ไขค่าใน .env ตามต้องการ
# SECRET_KEY=your-secret-key-here
# DEBUG=True
# GEMINI_API_KEY=your-gemini-api-key
```

#### ขั้นตอนที่ 2: ติดตั้ง Dependencies
```bash
# ติดตั้ง Python packages
pip install -r requirements.txt

# หรือใช้ virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# หรือ
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

#### ขั้นตอนที่ 3: ตั้งค่า Database
```bash
# สร้าง migrations
python manage.py makemigrations

# รัน migrations
python manage.py migrate

# สร้าง superuser
python manage.py createsuperuser
```

#### ขั้นตอนที่ 4: รัน Development Server
```bash
# รัน server
python manage.py runserver

# เปิดเบราว์เซอร์ไปที่
# http://localhost:8000
```

### 2. การติดตั้ง (Production)

#### ขั้นตอนที่ 1: เตรียม Environment
```bash
# คัดลอกไฟล์ environment
cp .env.example .env

# แก้ไขค่าใน .env สำหรับ production
# DEBUG=False
# SECRET_KEY=your-production-secret-key
# DB_NAME=final_project_management
# DB_USER=postgres
# DB_PASSWORD=your-db-password
# DB_HOST=localhost
# DB_PORT=5432
```

#### ขั้นตอนที่ 2: ติดตั้ง Dependencies
```bash
# ติดตั้ง Python packages
pip install -r requirements.txt
```

#### ขั้นตอนที่ 3: ตั้งค่า Database
```bash
# สร้าง migrations
python manage.py makemigrations

# รัน migrations
python manage.py migrate

# สร้าง superuser
python manage.py createsuperuser

# รวบรวม static files
python manage.py collectstatic
```

#### ขั้นตอนที่ 4: รัน Production Server
```bash
# ใช้ Gunicorn
gunicorn --bind 0.0.0.0:8000 final_project_management.wsgi:application

# หรือใช้ Docker
docker-compose -f docker-compose.prod.yml up -d
```

### 3. การใช้งาน Docker

#### Development
```bash
# รัน development environment
docker-compose up -d

# ตรวจสอบ logs
docker-compose logs -f
```

#### Production
```bash
# รัน production environment
docker-compose -f docker-compose.prod.yml up -d

# ตรวจสอบ logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. การตรวจสอบระบบ

#### Health Check
```bash
# ตรวจสอบสุขภาพระบบ
python health_check.py
```

#### Monitoring
```bash
# เก็บข้อมูล monitoring
python monitor.py
```

#### Backup
```bash
# สร้าง backup
python backup.py
```

### 5. การเข้าถึงระบบ

#### URLs หลัก
- **Frontend**: http://localhost:3000 (React)
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/api/docs/

#### Default Credentials
- **Username**: admin
- **Password**: admin123 (เปลี่ยนใน production)

### 6. การตั้งค่า AI Features

#### Gemini API
```bash
# ตั้งค่า API key ใน .env
GEMINI_API_KEY=your-gemini-api-key

# ฟีเจอร์ AI ที่ใช้ได้:
# - Plagiarism Check
# - Grammar Check
# - Advisor Suggestions
# - Topic Similarity
# - Security Audit
```

### 7. การตั้งค่า Email

#### Gmail SMTP
```bash
# ตั้งค่าใน .env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### 8. การตั้งค่า Redis

#### Local Redis
```bash
# ติดตั้ง Redis
# Windows: ดาวน์โหลดจาก https://redis.io/download
# Linux: sudo apt-get install redis-server
# Mac: brew install redis

# รัน Redis
redis-server
```

#### Docker Redis
```bash
# ใช้ Docker Compose
docker-compose up -d redis
```

### 9. การตั้งค่า PostgreSQL

#### Local PostgreSQL
```bash
# ติดตั้ง PostgreSQL
# Windows: ดาวน์โหลดจาก https://www.postgresql.org/download/
# Linux: sudo apt-get install postgresql postgresql-contrib
# Mac: brew install postgresql

# สร้าง database
createdb final_project_management
```

#### Docker PostgreSQL
```bash
# ใช้ Docker Compose
docker-compose up -d db
```

### 10. การแก้ไขปัญหาเบื้องต้น

#### ปัญหาที่พบบ่อย

1. **Database Connection Error**
   ```bash
   # ตรวจสอบ database settings
   python manage.py dbshell
   ```

2. **Static Files Not Found**
   ```bash
   # รวบรวม static files
   python manage.py collectstatic
   ```

3. **Permission Denied**
   ```bash
   # เปลี่ยน permissions
   chmod +x deploy.sh
   ```

4. **Port Already in Use**
   ```bash
   # หา process ที่ใช้ port
   netstat -tulpn | grep :8000
   # หรือ
   lsof -i :8000
   ```

### 11. การอัปเดตระบบ

#### อัปเดต Code
```bash
# ดึง code ใหม่
git pull origin main

# ติดตั้ง dependencies ใหม่
pip install -r requirements.txt

# รัน migrations
python manage.py migrate

# รวบรวม static files
python manage.py collectstatic

# รีสตาร์ท server
python manage.py runserver
```

#### อัปเดต Docker
```bash
# สร้าง image ใหม่
docker-compose build

# รัน containers ใหม่
docker-compose up -d
```

### 12. การบำรุงรักษา

#### Daily Tasks
```bash
# ตรวจสอบสุขภาพระบบ
python health_check.py

# เก็บข้อมูล monitoring
python monitor.py
```

#### Weekly Tasks
```bash
# สร้าง backup
python backup.py

# ตรวจสอบ logs
tail -f logs/django.log
```

#### Monthly Tasks
```bash
# อัปเดต dependencies
pip install -r requirements.txt --upgrade

# ตรวจสอบ security
python manage.py check --deploy
```

### 13. การสนับสนุน

#### เอกสารเพิ่มเติม
- `README.md` - เอกสารหลัก
- `DEVELOPMENT_GUIDE.md` - คู่มือการพัฒนา
- `DEPLOYMENT_GUIDE.md` - คู่มือการ deploy
- `USER_MANUAL.md` - คู่มือผู้ใช้
- `TEST_RESULTS.md` - ผลการทดสอบ

#### การติดต่อ
- **Issues**: สร้าง issue ใน GitHub
- **Documentation**: ดูใน `docs/` directory
- **Logs**: ตรวจสอบใน `logs/` directory

---

**🎉 ยินดีต้อนรับสู่ BM23!**

ระบบจัดการโปรเจคจบการศึกษาที่ครบครันและทันสมัย
