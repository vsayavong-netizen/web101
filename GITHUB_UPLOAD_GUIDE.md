# GitHub Upload Guide

## การอัปโหลดโปรเจคไปยัง GitHub

### 1. สร้าง Repository บน GitHub
1. ไปที่ [GitHub.com](https://github.com)
2. คลิก "New repository"
3. ตั้งชื่อ repository เช่น `final-project-management`
4. เลือก "Public" หรือ "Private"
5. **อย่า** ติ๊ก "Initialize with README"
6. คลิก "Create repository"

### 2. เชื่อมต่อกับ GitHub Repository

```bash
# เพิ่ม remote origin
git remote add origin https://github.com/YOUR_USERNAME/final-project-management.git

# ตั้งค่า branch หลัก
git branch -M main

# Push ไปยัง GitHub
git push -u origin main
```

### 3. คำสั่งที่ใช้แล้ว

```bash
# เริ่มต้น Git repository
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit การเปลี่ยนแปลง
git commit -m "Fix API endpoints: resolve 404 and 500 errors"

# เชื่อมต่อกับ GitHub (ต้องทำเอง)
git remote add origin https://github.com/YOUR_USERNAME/final-project-management.git
git branch -M main
git push -u origin main
```

### 4. ไฟล์ที่แก้ไขแล้ว

- ✅ `backend/students/urls.py` - แก้ไข URL patterns
- ✅ `backend/students/views.py` - เพิ่ม StudentViewSet
- ✅ `frontend/config/api.ts` - อัปเดต API configuration
- ✅ `backend/final_project_management/urls.py` - เปลี่ยน authentication URLs
- ✅ `backend/fix_production_errors.py` - แก้ไขปัญหา production
- ✅ `test_simple_api.py` - ทดสอบ API endpoints

### 5. การ Deploy ใน Production

หลังจาก push ไปยัง GitHub แล้ว:

1. **ใน Production Server**:
   ```bash
   git pull origin main
   python manage.py migrate
   python manage.py collectstatic --noinput
   python fix_production_errors.py
   ```

2. **Restart Production Server**

### 6. ตรวจสอบการทำงาน

```bash
# ทดสอบ API endpoints
python test_simple_api.py

# ตรวจสอบ health check
curl https://eduinfo.online/health/

# ตรวจสอบ students endpoint
curl https://eduinfo.online/api/students/
```

## หมายเหตุ

- ต้องเปลี่ยน `YOUR_USERNAME` เป็น username ของคุณใน GitHub
- ต้องมี GitHub account และ repository ที่สร้างแล้ว
- ต้องตั้งค่า Git credentials (username/password หรือ SSH key)
