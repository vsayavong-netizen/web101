# BM23 - การแก้ไขปัญหา Database และ Migration

## 🔧 ปัญหาที่พบ

### 1. ปัญหาหลัก
```
django.db.utils.ProgrammingError: Problem installing fixture '/opt/render/project/src/backend/fixtures/initial_data.json': Could not load auth.User(pk=1): relation "auth_user" does not exist
```

### 2. สาเหตุของปัญหา
- **Custom User Model**: แอปใช้ `AUTH_USER_MODEL = 'accounts.User'` แต่ fixture ใช้ `auth.user`
- **Migration Order**: ระบบพยายามโหลด fixture ก่อนรัน migrations
- **Fixture Format**: ข้อมูลใน fixture ไม่ตรงกับ custom user model

## ✅ การแก้ไขที่ทำ

### 1. แก้ไข Fixture Data
**ไฟล์**: `backend/fixtures/initial_data.json`
- เปลี่ยนจาก `auth.user` เป็น `accounts.user`
- รวมข้อมูล user fields ทั้งหมดใน record เดียว
- ลบ duplicate user records

### 2. สร้าง Build Scripts ที่แก้ไขแล้ว
**ไฟล์**: `backend/build_fixed.sh`
- รัน migrations ก่อนโหลด fixture
- สร้าง superuser ก่อนโหลด data
- จัดลำดับการทำงานที่ถูกต้อง

### 3. สร้าง Production Settings
**ไฟล์**: `backend/settings_production.py`
- การตั้งค่าสำหรับ production
- Database configuration
- Security settings

### 4. สร้าง Management Command
**ไฟล์**: `backend/management/commands/setup_system.py`
- Command สำหรับ setup ระบบ
- จัดลำดับการทำงานที่ถูกต้อง
- รองรับ options ต่างๆ

### 5. แก้ไข Dockerfile
**ไฟล์**: `backend/Dockerfile`
- สร้าง startup script ที่รัน migrations ก่อน
- จัดลำดับการทำงานใน container
- รองรับการ deploy บน production

### 6. แก้ไข Docker Compose
**ไฟล์**: `backend/docker-compose.yml`
- รัน migrations ก่อนโหลด fixture
- สร้าง superuser ก่อนโหลด data
- จัดลำดับการทำงานใน development

## 🚀 วิธีการใช้งาน

### 1. สำหรับ Development
```bash
# ใช้ docker-compose
cd backend
docker-compose up --build

# หรือใช้ management command
python manage.py setup_system
```

### 2. สำหรับ Production
```bash
# ใช้ build script
chmod +x backend/build_fixed.sh
./backend/build_fixed.sh

# หรือใช้ management command
python manage.py setup_system
```

### 3. สำหรับ Manual Setup
```bash
# 1. รัน migrations
python manage.py migrate

# 2. สร้าง superuser
python manage.py createsuperuser

# 3. โหลด fixture (ถ้าต้องการ)
python manage.py loaddata fixtures/initial_data.json

# 4. รวบรวม static files
python manage.py collectstatic --noinput
```

## 📋 ลำดับการทำงานที่ถูกต้อง

1. **Install Dependencies** - ติดตั้ง packages
2. **Run Migrations** - สร้าง database tables
3. **Create Superuser** - สร้าง admin user
4. **Load Fixtures** - โหลด initial data
5. **Collect Static Files** - รวบรวม static files
6. **Start Application** - เริ่มแอปพลิเคชัน

## 🔍 การตรวจสอบ

### 1. ตรวจสอบ Database
```bash
python manage.py dbshell
# ตรวจสอบว่ามีตาราง users หรือไม่
```

### 2. ตรวจสอบ User Model
```bash
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.all()
```

### 3. ตรวจสอบ Migrations
```bash
python manage.py showmigrations
```

## 🛠️ ไฟล์ที่แก้ไข

1. `backend/fixtures/initial_data.json` - แก้ไข fixture format
2. `backend/build_fixed.sh` - Build script ใหม่
3. `backend/settings_production.py` - Production settings
4. `backend/management/commands/setup_system.py` - Management command
5. `backend/Dockerfile` - แก้ไข startup process
6. `backend/docker-compose.yml` - แก้ไข command order

## 📝 หมายเหตุ

- การแก้ไขนี้จะทำให้ระบบทำงานได้ถูกต้อง
- ลำดับการทำงานเป็นสิ่งสำคัญ
- ควรทดสอบใน development environment ก่อน deploy
- ตรวจสอบ logs เพื่อดูว่าทุกขั้นตอนทำงานสำเร็จ