# 🔧 การแก้ไข Projects API 500 Error

## ปัญหาที่พบ
- `/api/projects/projects/` ได้ 500 Internal Server Error
- Error เกิดจากการ filter `academic_year` ใน views.py

## สาเหตุ
ใน `web101/backend/projects/views.py` บรรทัด 113 มีการ filter:
```python
queryset = queryset.filter(academic_year=academic_year)
```

แต่ **Project model ไม่มี field `academic_year`**!

Project model มีแค่:
- project_id
- title
- description
- status
- advisor
- created_at
- updated_at

## การแก้ไข

### แก้ไข `web101/backend/projects/views.py`
เปลี่ยนจาก:
```python
queryset = queryset.filter(academic_year=academic_year)
```

เป็น:
```python
# Project model doesn't have academic_year field, filter by project_id prefix
queryset = queryset.filter(project_id__startswith=academic_year)
```

## ผลลัพธ์ที่คาดหวัง
- Projects API จะไม่เกิด 500 error อีกต่อไป
- การ filter โดย academic_year จะใช้ project_id prefix แทน
- API จะ return projects ได้ถูกต้อง

## ขั้นตอนทดสอบ
1. Restart Backend server (ถ้าจำเป็น)
2. Refresh browser
3. Login ใหม่
4. ตรวจสอบ Network tab ว่า `/api/projects/projects/` ไม่ได้ 500 error แล้ว
5. ตรวจสอบว่า projects แสดงผลได้

---

**หมายเหตุ:** Project model ไม่มี academic_year field เพราะ academic_year ถูกเก็บใน ProjectGroup model แทน แต่เราสามารถ extract จาก project_id ได้ (format: "2024-2025-P001")

