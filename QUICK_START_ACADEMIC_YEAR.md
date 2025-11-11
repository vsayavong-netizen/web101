# 🚀 Quick Start: Academic Year Setup

## ขั้นตอนการตั้งค่า Academic Year

### 1. สร้าง Academic Year เริ่มต้น

```powershell
# เปิด terminal ในโฟลเดอร์ backend
cd C:\Users\bb\Desktop\web101\backend

# ใช้ management command สร้างปีการศึกษา 2024
python manage.py create_academic_year 2024 --active
```

### 2. ตรวจสอบว่าสร้างสำเร็จ

```powershell
# เปิด Django shell
python manage.py shell
```

แล้วพิมพ์:
```python
from settings.models import AcademicYear
AcademicYear.objects.all()
```

ควรเห็นปีการศึกษา 2024 ที่สร้างไว้

### 3. ทดสอบ API

#### วิธีที่ 1: ใช้ Swagger UI
1. เปิด browser ไปที่: `http://localhost:8000/api/docs/`
2. Login ด้วย admin account
3. ทดสอบ endpoints:
   - `GET /api/settings/academic-years/current/`
   - `GET /api/settings/academic-years/available/`

#### วิธีที่ 2: ใช้ curl (ถ้ามี token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/settings/academic-years/current/
```

### 4. ทดสอบ Frontend

1. เริ่ม frontend server:
   ```powershell
   cd C:\Users\bb\Desktop\web101\frontend
   npm run dev
   ```

2. เปิด browser ไปที่: `http://localhost:5173`
3. Login และตรวจสอบว่า Academic Year dropdown แสดงปีการศึกษา 2024

## ✅ Checklist

- [ ] สร้าง Academic Year 2024 สำเร็จ
- [ ] API endpoint `/api/settings/academic-years/current/` ทำงาน
- [ ] Frontend แสดงปีการศึกษาใน dropdown
- [ ] สามารถเปลี่ยนปีการศึกษาได้
- [ ] Admin สามารถสร้างปีการศึกษาใหม่ได้

## 🆘 ปัญหาที่พบบ่อย

### ❌ "No Academic Year found"
**แก้ไข:** สร้างปีการศึกษา:
```bash
python manage.py create_academic_year 2024 --active
```

### ❌ "Permission denied"
**แก้ไข:** ตรวจสอบว่า login ด้วย admin account

### ❌ Frontend ไม่แสดงปีการศึกษา
**แก้ไข:** 
1. ตรวจสอบว่า backend ทำงานอยู่
2. ตรวจสอบ console ใน browser สำหรับ errors
3. ตรวจสอบ network tab ว่า API call สำเร็จหรือไม่

## 📞 ต้องการความช่วยเหลือ?

ดูเอกสารเต็มที่: `ACADEMIC_YEAR_IMPLEMENTATION.md`

