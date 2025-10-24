# BM23 - Quick Start Guide (Fixed Version)

## 🚀 การเริ่มต้นใช้งานอย่างรวดเร็ว

### 1. การแก้ไขปัญหา
ปัญหาหลักที่แก้ไขแล้ว:
- ✅ แก้ไข fixture format ให้ใช้ custom user model
- ✅ จัดลำดับการทำงาน: migrations → superuser → fixtures → static files
- ✅ สร้าง scripts และ commands ที่แก้ไขแล้ว

### 2. วิธีการใช้งาน

#### วิธีที่ 1: ใช้ Management Command (แนะนำ)
```bash
cd backend
python manage.py setup_system
```

#### วิธีที่ 2: ใช้ Build Script
```bash
cd backend
chmod +x build_fixed.sh
./build_fixed.sh
```

#### วิธีที่ 3: ใช้ Docker
```bash
cd backend
docker-compose up --build
```

#### วิธีที่ 4: Manual Setup
```bash
cd backend

# 1. รัน migrations
python manage.py migrate

# 2. สร้าง superuser
python manage.py createsuperuser

# 3. โหลด initial data (ถ้าต้องการ)
python manage.py loaddata fixtures/initial_data.json

# 4. รวบรวม static files
python manage.py collectstatic --noinput

# 5. เริ่มแอป
python manage.py runserver
```

### 3. การทดสอบ

#### ทดสอบการแก้ไข
```bash
cd backend
python test_fix.py
```

#### ทดสอบการเข้าสู่ระบบ
```bash
# เปิดเบราว์เซอร์ไปที่
http://localhost:8000/admin/

# ใช้ข้อมูล:
Username: admin
Password: admin123
```

### 4. ไฟล์ที่สำคัญ

#### ไฟล์ที่แก้ไขแล้ว:
- `fixtures/initial_data.json` - แก้ไข format ให้ใช้ custom user model
- `build_fixed.sh` - Build script ที่แก้ไขแล้ว
- `settings_production.py` - Production settings
- `management/commands/setup_system.py` - Management command
- `Dockerfile` - แก้ไข startup process
- `docker-compose.yml` - แก้ไข command order

#### ไฟล์ใหม่:
- `test_fix.py` - Script ทดสอบการแก้ไข
- `FIXES_APPLIED.md` - รายละเอียดการแก้ไข

### 5. การแก้ไขปัญหา

#### หากยังมีปัญหา:
1. ตรวจสอบ logs:
   ```bash
   tail -f logs/django.log
   ```

2. ตรวจสอบ database:
   ```bash
   python manage.py dbshell
   ```

3. ตรวจสอบ migrations:
   ```bash
   python manage.py showmigrations
   ```

4. รีเซ็ต database (ถ้าจำเป็น):
   ```bash
   python manage.py flush
   python manage.py migrate
   ```

### 6. การ Deploy

#### สำหรับ Production:
```bash
# ใช้ production settings
export DJANGO_SETTINGS_MODULE=final_project_management.settings_production

# รัน setup
python manage.py setup_system

# เริ่มแอป
python manage.py runserver 0.0.0.0:8000
```

#### สำหรับ Docker Production:
```bash
# Build image
docker build -t bm23-app .

# Run container
docker run -p 8000:8000 bm23-app
```

### 7. ข้อมูลการเข้าสู่ระบบ

#### Admin User:
- **Username**: admin
- **Password**: admin123
- **Email**: admin@bm23.com

#### ข้อมูลเริ่มต้น:
- Major: Computer Science, Information Technology
- Classrooms: CS-2024-1, IT-2024-1
- Scoring Rubrics: Advisor Evaluation, Committee Evaluation

### 8. การตรวจสอบสถานะ

#### ตรวจสอบว่าแอปทำงาน:
```bash
curl http://localhost:8000/admin/
```

#### ตรวจสอบ API:
```bash
curl http://localhost:8000/api/
```

### 9. การแก้ไขเพิ่มเติม

หากยังมีปัญหา ให้ตรวจสอบ:
1. **Database Connection**: ตรวจสอบการเชื่อมต่อฐานข้อมูล
2. **Migrations**: ตรวจสอบว่า migrations รันสำเร็จ
3. **User Model**: ตรวจสอบว่า custom user model ทำงาน
4. **Fixtures**: ตรวจสอบว่า fixture format ถูกต้อง
5. **Static Files**: ตรวจสอบว่า static files ถูกเก็บรวบรวม

### 10. การติดต่อ

หากยังมีปัญหา:
1. ตรวจสอบ logs ใน `logs/` directory
2. ดูรายละเอียดใน `FIXES_APPLIED.md`
3. ใช้ `test_fix.py` เพื่อทดสอบการแก้ไข
