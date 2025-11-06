# 🔧 การแก้ไข Backend Debug - Permission และ Prefetch Issues

## ปัญหาที่พบ
- Projects API ยังคง return 500 error แม้ว่าจะเพิ่ม error handling แล้ว
- อาจมีปัญหาใน permission classes หรือ prefetch_related

## สาเหตุที่เป็นไปได้
1. **Permission Classes** - `CanViewProject` หรือ `AcademicYearPermission` อาจมีปัญหา
2. **Prefetch Related** - `projectgroup__students` อาจไม่มี relationship ที่ถูกต้อง

## การแก้ไข

### 1. ลบ prefetch_related ที่อาจมีปัญหา
```python
# เดิม
queryset = Project.objects.select_related(
    'advisor', 'main_committee', 'second_committee', 'third_committee'
).prefetch_related(
    'projectgroup__students', 'milestones', 'log_entries'
)

# ใหม่ - ลบ 'projectgroup__students' เพราะ Project model ไม่มี relationship นี้โดยตรง
queryset = Project.objects.select_related(
    'advisor', 'main_committee', 'second_committee', 'third_committee'
).prefetch_related(
    'milestones', 'log_entries'
)
```

### 2. ลด permission classes ชั่วคราวเพื่อ debug
```python
# เดิม
permission_classes = [IsAuthenticated, CanViewProject, AcademicYearPermission]

# ใหม่ - ใช้แค่ IsAuthenticated ชั่วคราวเพื่อ debug
permission_classes = [IsAuthenticated]  # Temporarily simplified to debug 500 error
```

## ผลลัพธ์ที่คาดหวัง
- API ควร return 200 OK แทน 500 error
- ถ้ายังมี 500 error แสดงว่าปัญหาอยู่ที่อื่น (อาจเป็น serializer)

## ขั้นตอนทดสอบ
1. Restart Backend server
2. ทดสอบ API: `GET /api/projects/projects/`
3. ตรวจสอบว่าไม่มี 500 error
4. ถ้ายังมี error ให้ตรวจสอบ serializer methods

## หมายเหตุ
- การลด permission classes เป็นการแก้ไขชั่วคราวเพื่อ debug
- หลังจากแก้ไข 500 error แล้ว ควรเพิ่ม permission classes กลับมา
- ควรตรวจสอบว่า `CanViewProject` และ `AcademicYearPermission` ทำงานถูกต้อง

---

**หมายเหตุ:** การแก้ไขนี้เป็นการ debug เพื่อหาสาเหตุของ 500 error

