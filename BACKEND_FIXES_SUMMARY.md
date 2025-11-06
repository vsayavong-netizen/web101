# สรุปการแก้ไข Backend API Errors

## ปัญหาที่พบ
1. **500 Error** เมื่อเรียก `/api/projects/projects/`
2. **Serializer errors** ในการ serialize Project objects
3. **Missing imports** ใน serializers
4. **Field name mismatches** ระหว่าง serializer และ model

## การแก้ไขที่ทำ

### 1. แก้ไข `web101/backend/projects/serializers.py`

#### เพิ่ม Import ProjectStudent
```python
from .models import Project, ProjectGroup, ProjectStatus, ProjectStudent
```

#### แก้ไข ProjectLogEntrySerializer
- เปลี่ยนจาก `message` field เป็น `content` field (ตาม LogEntry model)
- เพิ่ม `get_author_name()` และ `get_author_role()` methods
- แก้ไข `create()` method ให้ handle `content` field ถูกต้อง

#### แก้ไข ProjectSerializer.create()
- แก้ไขการหา `academic_year` ให้ใช้ `current_academic_year` จาก user
- แก้ไขการ filter projects โดยใช้ `project_id__startswith` แทน `academic_year` field (เพราะ Project model ไม่มี academic_year field)

### 2. แก้ไข `web101/backend/projects/views.py`

#### แก้ไข get_queryset()
- เพิ่ม error handling สำหรับกรณีที่ user ไม่มี `student_profile` หรือ `advisor_profile`
- แก้ไขการ filter projects สำหรับ students โดยใช้ ProjectStudent relationship
- เพิ่ม `hasattr()` checks เพื่อป้องกัน AttributeError

#### แก้ไข perform_create()
- แก้ไขการหา `academic_year` ให้ใช้ `current_academic_year` จาก user

## ไฟล์ที่แก้ไข
1. `web101/backend/projects/serializers.py`
   - เพิ่ม import ProjectStudent
   - แก้ไข ProjectLogEntrySerializer
   - แก้ไข ProjectSerializer.create()

2. `web101/backend/projects/views.py`
   - แก้ไข get_queryset() method
   - แก้ไข perform_create() method

## ขั้นตอนทดสอบ

### 1. เริ่ม Backend Server
```bash
cd web101\backend
..\venv\Scripts\Activate.ps1
python manage.py runserver
```

### 2. ทดสอบ API Endpoint
เปิด browser หรือใช้ curl:
```bash
# Login เพื่อรับ token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# ใช้ token ที่ได้ทดสอบ Projects API
curl -X GET http://localhost:8000/api/projects/projects/ \
  -H "Authorization: Bearer <token>"
```

### 3. ทดสอบใน Frontend
1. เปิด frontend application
2. Login ด้วย admin account
3. ไปที่หน้า Projects
4. ตรวจสอบว่า projects แสดงผลได้ถูกต้อง

## สิ่งที่ควรตรวจสอบ
- [ ] Backend server เริ่มต้นได้โดยไม่มี errors
- [ ] `/api/projects/projects/` endpoint ทำงานได้ (ไม่ใช่ 500 error)
- [ ] Projects แสดงผลใน frontend ได้ถูกต้อง
- [ ] Register Project ทำงานได้
- [ ] Milestone Submission ทำงานได้
- [ ] Final File Submission ทำงานได้

## หมายเหตุ
- หากยังมี errors ให้ตรวจสอบ Django logs ใน terminal
- ตรวจสอบว่า database มีข้อมูล projects อยู่หรือไม่
- ตรวจสอบว่า user ที่ login มี permissions ที่ถูกต้อง

