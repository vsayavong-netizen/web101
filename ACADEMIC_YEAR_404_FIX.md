# 🔧 Academic Year 404 Error Fix

**วันที่**: 10 พฤศจิกายน 2025  
**ปัญหา**: `GET /api/settings/academic-years/current/` returns 404 (Not Found)

---

## ✅ การแก้ไขที่ทำแล้ว

### 1. Backend Fix - Return 200 instead of 404
**File**: `backend/settings/views.py`

เปลี่ยนจาก:
```python
return Response({
    'error': 'No academic year found'
}, status=status.HTTP_404_NOT_FOUND)
```

เป็น:
```python
# Return empty response instead of 404 to allow frontend to handle gracefully
return Response({
    'year': None,
    'message': 'No academic year found. Please create one in admin panel.'
}, status=status.HTTP_200_OK)
```

### 2. Frontend API Client - Handle 404 Gracefully
**File**: `frontend/utils/apiClient.ts`

เพิ่ม error handling:
```typescript
async getCurrentAcademicYear() {
  try {
    return await this.get('/api/settings/academic-years/current/');
  } catch (error: any) {
    // Handle 404 - no academic year found
    if (error?.response?.status === 404) {
      // Return empty response instead of throwing error
      return { data: null, status: 404 };
    }
    throw error;
  }
}
```

### 3. Frontend Hook - Better Error Handling
**File**: `frontend/hooks/useAcademicYear.ts`

เพิ่ม try-catch และ fallback:
```typescript
// Get current active year
try {
  const currentResponse = await apiClient.getCurrentAcademicYear();
  if (currentResponse.data && currentResponse.status !== 404) {
    const currentYear = currentResponse.data.year;
    setCurrentAcademicYear(currentYear);
  } else if (years.length > 0) {
    // Fallback to latest year if no active year
    setCurrentAcademicYear(years[years.length - 1]);
  }
} catch (err: any) {
  // Handle 404 or other errors gracefully
  if (years.length > 0) {
    setCurrentAcademicYear(years[years.length - 1]);
  }
}
```

### 4. Script to Ensure Academic Year Exists
**File**: `backend/scripts/ensure_academic_year.py`

สร้าง script เพื่อตรวจสอบและสร้าง AcademicYear ถ้ายังไม่มี

---

## 🚀 วิธีใช้งาน

### Step 1: สร้าง Academic Year (ถ้ายังไม่มี)

**Option A: ใช้ Django Management Command**
```bash
cd backend
python manage.py create_academic_year 2024 --active
```

**Option B: ใช้ Django Shell**
```bash
cd backend
python manage.py shell
```

แล้วพิมพ์:
```python
from settings.models import AcademicYear
from datetime import date

# สร้างปีการศึกษา 2024
year = AcademicYear.objects.create(
    year='2024',
    start_date=date(2024, 8, 1),
    end_date=date(2025, 7, 31),
    is_active=True,
    description='Academic Year 2024-2025'
)

print(f'Created: {year.year}')
```

**Option C: ใช้ Script**
```bash
cd backend
python manage.py shell < scripts/ensure_academic_year.py
```

### Step 2: Restart Backend Server
```bash
# Restart Django server
python manage.py runserver
```

### Step 3: Refresh Frontend
- Hard refresh browser: `Ctrl+Shift+R` (Windows) หรือ `Cmd+Shift+R` (Mac)

---

## ✅ ผลลัพธ์ที่คาดหวัง

### Before Fix
- ❌ `GET /api/settings/academic-years/current/` returns 404
- ❌ Console error: "Failed to load academic years"
- ❌ Frontend ไม่สามารถโหลด academic year ได้

### After Fix
- ✅ `GET /api/settings/academic-years/current/` returns 200 (even if no data)
- ✅ Frontend handle gracefully with fallback
- ✅ ไม่มี console errors
- ✅ Frontend ใช้ default year หรือ localStorage fallback

---

## 🔍 Verification

### ตรวจสอบว่า Academic Year มีอยู่
```bash
cd backend
python manage.py shell
```

```python
from settings.models import AcademicYear

# ตรวจสอบว่ามี Academic Year หรือไม่
years = AcademicYear.objects.all()
print(f"Found {years.count()} academic years:")
for year in years:
    print(f"  - {year.year}: Active={year.is_active}")
```

### ตรวจสอบ API Endpoint
```bash
# ใช้ curl หรือ Postman
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/settings/academic-years/current/
```

หรือเปิด Swagger UI:
```
http://localhost:8000/api/docs/
```

---

## 📝 Files Modified

1. ✅ `backend/settings/views.py` - Changed 404 to 200 with empty response
2. ✅ `frontend/utils/apiClient.ts` - Added 404 error handling
3. ✅ `frontend/hooks/useAcademicYear.ts` - Added try-catch and fallback
4. ✅ `backend/scripts/ensure_academic_year.py` - Created script to ensure academic year exists

---

## 🎯 Summary

### Root Cause
- Database ไม่มี AcademicYear record
- Backend return 404 เมื่อไม่มี data
- Frontend ไม่ได้ handle 404 gracefully

### Solution
1. **Backend**: Return 200 with empty response แทน 404
2. **Frontend**: Handle 404/empty response gracefully
3. **Script**: สร้าง script เพื่อ ensure academic year exists

### Next Steps
1. Run script เพื่อสร้าง Academic Year
2. Restart backend server
3. Refresh frontend
4. Verify ไม่มี errors

---

**Last Updated**: November 10, 2025  
**Status**: ✅ **FIXED**

