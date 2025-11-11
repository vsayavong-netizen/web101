# 📚 Academic Year Implementation Guide

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. Backend Implementation

#### API Endpoints
- ✅ `GET /api/settings/academic-years/` - List all academic years
- ✅ `GET /api/settings/academic-years/{id}/` - Get specific academic year
- ✅ `GET /api/settings/academic-years/current/` - Get current active year
- ✅ `GET /api/settings/academic-years/available/` - Get available years for dropdown
- ✅ `POST /api/settings/academic-years/` - Create new academic year
- ✅ `PUT /api/settings/academic-years/{id}/` - Update academic year
- ✅ `DELETE /api/settings/academic-years/{id}/` - Delete academic year
- ✅ `POST /api/settings/academic-years/{id}/activate/` - Activate academic year
- ✅ `POST /api/settings/academic-years/create_next_year/` - Create next year automatically

#### Files Created/Modified
- `backend/settings/serializers.py` - Academic Year serializers
- `backend/settings/views.py` - AcademicYearViewSet with all actions
- `backend/settings/urls.py` - URL routing with DRF router
- `backend/settings/management/commands/create_academic_year.py` - Management command

### 2. Frontend Implementation

#### Hook Created
- ✅ `frontend/hooks/useAcademicYear.ts` - React hook for Academic Year management
  - Connects to backend API
  - Handles loading, error states
  - Fallback to localStorage if API fails

#### Files Modified
- ✅ `frontend/App.tsx` - Integrated useAcademicYear hook
- ✅ `frontend/utils/apiClient.ts` - Added Academic Year API methods
- ✅ `frontend/config/api.ts` - Added Academic Year endpoints

### 3. Django Settings Optimization

#### Improvements
- ✅ Removed duplicate JWT and CORS configurations
- ✅ Improved logging configuration with error file handler
- ✅ Better CORS configuration using environment variables
- ✅ Organized settings structure

## 🚀 การใช้งาน

### สร้าง Academic Year

#### วิธีที่ 1: Management Command (แนะนำ)
```bash
cd backend
python manage.py create_academic_year 2024 --active
```

#### วิธีที่ 2: Django Shell
```python
from settings.models import AcademicYear
from datetime import date

year = AcademicYear.objects.create(
    year='2024',
    start_date=date(2024, 8, 1),
    end_date=date(2025, 7, 31),
    is_active=True
)
```

### ทดสอบ API

1. **เปิด Swagger UI:**
   ```
   http://localhost:8000/api/docs/
   ```

2. **ทดสอบด้วย curl:**
   ```bash
   # Get current academic year
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/settings/academic-years/current/

   # Get available years
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/settings/academic-years/available/
   ```

### Frontend Usage

```typescript
import { useAcademicYear } from './hooks/useAcademicYear';

function MyComponent() {
  const {
    currentAcademicYear,
    availableYears,
    loading,
    changeAcademicYear,
    startNewYear,
  } = useAcademicYear();

  // Use the hook...
}
```

## 📋 API Response Examples

### Get Current Academic Year
```json
{
  "id": 1,
  "year": "2024",
  "start_date": "2024-08-01",
  "end_date": "2025-07-31",
  "is_active": true,
  "description": "Academic Year 2024-2025"
}
```

### Get Available Years
```json
[
  {
    "id": 1,
    "year": "2024",
    "is_active": true,
    "start_date": "2024-08-01",
    "end_date": "2025-07-31"
  },
  {
    "id": 2,
    "year": "2023",
    "is_active": false,
    "start_date": "2023-08-01",
    "end_date": "2024-07-31"
  }
]
```

## 🔒 Permissions

- **View**: All authenticated users can view academic years
- **Create/Update/Delete**: Only Admin users
- **Activate**: Only Admin users (automatically deactivates others)

## 🎯 Features

1. **Multi-Year Support**: System can handle multiple academic years
2. **Active Year Management**: Only one year can be active at a time
3. **Automatic Next Year Creation**: Create next year based on current year
4. **Frontend Integration**: Seamless integration with React frontend
5. **Fallback Mechanism**: Falls back to localStorage if API fails

## 📝 Next Steps

1. ✅ Create initial Academic Year using management command
2. ✅ Test API endpoints via Swagger UI
3. ✅ Test frontend integration
4. ⏳ Add unit tests for Academic Year API
5. ⏳ Add integration tests

## 🐛 Troubleshooting

### Problem: No Academic Year found
**Solution:** Create one using:
```bash
python manage.py create_academic_year 2024 --active
```

### Problem: API returns 401 Unauthorized
**Solution:** Make sure you're authenticated and have valid JWT token

### Problem: Frontend shows localStorage data instead of API
**Solution:** Check API connection and ensure backend is running

## 📚 Related Files

- Backend Models: `backend/settings/models.py`
- Backend Views: `backend/settings/views.py`
- Backend Serializers: `backend/settings/serializers.py`
- Frontend Hook: `frontend/hooks/useAcademicYear.ts`
- API Client: `frontend/utils/apiClient.ts`

