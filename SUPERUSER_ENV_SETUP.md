# การตั้งค่า Superuser จาก .env File

เอกสารนี้จะอธิบายวิธีการตั้งค่าและใช้งานระบบสร้าง superuser จาก environment variables ใน .env file

## ไฟล์ที่เกี่ยวข้อง

1. **Django Management Command**: `backend/management/commands/create_superuser_from_env.py`
2. **Production Script**: `create_superuser_production.py` (อัปเดตแล้ว)
3. **Environment Files**: `.env`, `.env.example`

## Environment Variables สำหรับ Superuser

เพิ่มตัวแปรเหล่านี้ในไฟล์ `.env` ของคุณ:

```bash
# Superuser Settings (สำหรับสร้าง superuser จาก .env)
SUPERUSER_USERNAME=admin
SUPERUSER_EMAIL=admin@your-domain.com
SUPERUSER_PASSWORD=your-secure-password-here
SUPERUSER_FIRST_NAME=System
SUPERUSER_LAST_NAME=Administrator
```

## วิธีการใช้งาน

### 1. ใช้ Django Management Command

```bash
# สร้าง superuser ใหม่
python manage.py create_superuser_from_env

# ตรวจสอบ superuser ที่มีอยู่ (ไม่สร้างใหม่)
python manage.py create_superuser_from_env --check-only

# บังคับสร้าง superuser ใหม่ (แม้ว่าจะมีอยู่แล้ว)
python manage.py create_superuser_from_env --force
```

### 2. ใช้ Production Script

```bash
# รัน script โดยตรง
python create_superuser_production.py
```

## ตัวอย่างการตั้งค่า

### Development Environment (.env)
```bash
SUPERUSER_USERNAME=admin
SUPERUSER_EMAIL=admin@eduinfo.online
SUPERUSER_PASSWORD=admin123
SUPERUSER_FIRST_NAME=System
SUPERUSER_LAST_NAME=Administrator
```

### Production Environment (.env.production)
```bash
SUPERUSER_USERNAME=admin
SUPERUSER_EMAIL=admin@your-production-domain.com
SUPERUSER_PASSWORD=very-secure-password-123
SUPERUSER_FIRST_NAME=Production
SUPERUSER_LAST_NAME=Admin
```

## ฟีเจอร์ที่รองรับ

### Django Management Command
- ✅ อ่านค่าจาก environment variables
- ✅ ตรวจสอบ superuser ที่มีอยู่
- ✅ สร้าง superuser ใหม่
- ✅ อัปเดต superuser ที่มีอยู่
- ✅ ทดสอบการ login
- ✅ รองรับ `--force` และ `--check-only` flags

### Production Script
- ✅ อ่านค่าจาก environment variables
- ✅ ตรวจสอบ superuser ที่มีอยู่
- ✅ สร้างหรืออัปเดต superuser
- ✅ ทดสอบการ login
- ✅ แสดงข้อมูลการตั้งค่า

## การตั้งค่าเริ่มต้น

หากไม่มีการกำหนดค่าใน .env file ระบบจะใช้ค่าเริ่มต้น:

```python
SUPERUSER_USERNAME = 'admin'
SUPERUSER_EMAIL = 'admin@eduinfo.online'
SUPERUSER_PASSWORD = 'admin123'
SUPERUSER_FIRST_NAME = 'System'
SUPERUSER_LAST_NAME = 'Administrator'
```

## การใช้งานใน Production

1. **ตั้งค่า Environment Variables**:
   ```bash
   export SUPERUSER_USERNAME=admin
   export SUPERUSER_EMAIL=admin@your-domain.com
   export SUPERUSER_PASSWORD=your-secure-password
   ```

2. **รัน Management Command**:
   ```bash
   python manage.py create_superuser_from_env --force
   ```

3. **หรือใช้ Production Script**:
   ```bash
   python create_superuser_production.py
   ```

## การตรวจสอบ

หลังจากสร้าง superuser แล้ว ระบบจะ:
- แสดงข้อมูล superuser ที่สร้าง
- ทดสอบการ login
- แสดงข้อมูลการเข้าสู่ระบบ

## ข้อควรระวัง

1. **ความปลอดภัย**: อย่าเก็บรหัสผ่านในไฟล์ .env ที่ commit ไปยัง repository
2. **Production**: ใช้รหัสผ่านที่แข็งแกร่งใน production environment
3. **Backup**: สำรองข้อมูลก่อนสร้าง superuser ใหม่

## Troubleshooting

### ปัญหาที่พบบ่อย

1. **Import Error**: ตรวจสอบว่า `python-decouple` ติดตั้งแล้ว
   ```bash
   pip install python-decouple
   ```

2. **Environment Variables ไม่ถูกอ่าน**: ตรวจสอบว่าไฟล์ .env อยู่ในตำแหน่งที่ถูกต้อง

3. **Database Connection**: ตรวจสอบการเชื่อมต่อฐานข้อมูล

### การ Debug

```bash
# ตรวจสอบ environment variables
python -c "from decouple import config; print(config('SUPERUSER_USERNAME', default='NOT_SET'))"

# ตรวจสอบ superuser ที่มีอยู่
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.filter(is_superuser=True).count())"
```

## การอัปเดต

หากต้องการอัปเดต superuser ที่มีอยู่:

```bash
# อัปเดต .env file ด้วยข้อมูลใหม่
# จากนั้นรัน:
python manage.py create_superuser_from_env --force
```

## การลบ Superuser

```bash
# ใช้ Django shell
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.filter(username='admin').delete()
```
