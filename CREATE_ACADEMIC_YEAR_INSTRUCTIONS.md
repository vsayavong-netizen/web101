# 📝 คำสั่งสร้าง Academic Year

## ✅ Step 1: สร้าง Academic Year

เปิด **PowerShell** หรือ **Command Prompt** แล้วรันคำสั่งต่อไปนี้:

### Option A: ใช้ Python Script (แนะนำ)
```powershell
cd C:\Users\bb\Desktop\web101
python create_academic_year_now.py
```

### Option B: ใช้ Django Shell
```powershell
cd C:\Users\bb\Desktop\web101\backend
python manage.py shell
```

แล้วพิมพ์คำสั่งต่อไปนี้:
```python
from settings.models import AcademicYear
from datetime import date

year = AcademicYear.objects.create(
    year='2024',
    start_date=date(2024, 8, 1),
    end_date=date(2025, 7, 31),
    is_active=True,
    description='Academic Year 2024-2025'
)

print(f'Created: {year.year}')
exit()
```

### Option C: ใช้ Management Command (ถ้ามี)
```powershell
cd C:\Users\bb\Desktop\web101\backend
python manage.py create_academic_year 2024 --active
```

---

## ✅ Step 2: Restart Backend Server

### ถ้า Server กำลังรันอยู่:
1. ไปที่ terminal ที่รัน Django server
2. กด `Ctrl+C` เพื่อหยุด server
3. รันคำสั่ง:
```powershell
cd C:\Users\bb\Desktop\web101\backend
python manage.py runserver
```

### ถ้า Server ไม่ได้รัน:
```powershell
cd C:\Users\bb\Desktop\web101\backend
python manage.py runserver
```

---

## ✅ Step 3: Refresh Frontend

1. เปิด browser
2. ไปที่ frontend (http://localhost:5173)
3. กด **Hard Refresh**:
   - **Windows/Linux**: `Ctrl+Shift+R`
   - **Mac**: `Cmd+Shift+R`

---

## 🔍 ตรวจสอบผลลัพธ์

### ตรวจสอบว่า Academic Year ถูกสร้างแล้ว:
```powershell
cd C:\Users\bb\Desktop\web101\backend
python manage.py shell
```

```python
from settings.models import AcademicYear

years = AcademicYear.objects.all()
for year in years:
    print(f"{year.year}: Active={year.is_active}")
```

### ตรวจสอบ API Endpoint:
เปิด browser ไปที่:
```
http://localhost:8000/api/settings/academic-years/current/
```

หรือใช้ Swagger UI:
```
http://localhost:8000/api/docs/
```

---

## ✅ ผลลัพธ์ที่คาดหวัง

- ✅ ไม่มี 404 error
- ✅ Console ไม่มี error messages
- ✅ Frontend โหลด academic year ได้
- ✅ API endpoint ทำงานถูกต้อง

---

**Last Updated**: November 10, 2025

