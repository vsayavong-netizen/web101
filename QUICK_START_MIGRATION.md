# 🚀 Quick Start Guide - Settings API Migration

## 📋 Overview

ระบบได้ถูก migrate จาก `localStorage` ไปใช้ Backend API เรียบร้อยแล้ว คู่มือนี้จะช่วยให้คุณเริ่มใช้งานได้อย่างรวดเร็ว

---

## ✅ สิ่งที่พร้อมใช้งานแล้ว

### 1. Backend API Endpoints

**Settings API:**
```
GET    /api/settings/app-settings/{setting_type}/{academic_year}/
POST   /api/settings/app-settings/{setting_type}/{academic_year}/
PUT    /api/settings/app-settings/{setting_type}/{academic_year}/
DELETE /api/settings/app-settings/{setting_type}/{academic_year}/
```

**Supported Setting Types:**
- `milestone_templates` - Template สำหรับ milestones
- `announcements` - ประกาศต่างๆ
- `defense_settings` - การตั้งค่าการสอบป้องกัน
- `scoring_settings` - การตั้งค่าระบบให้คะแนน

### 2. Frontend Integration

**API Client Methods:**
```typescript
// Get setting
await apiClient.getAppSetting('milestone_templates', '2024');

// Update setting
await apiClient.updateAppSetting('milestone_templates', data, '2024');

// Delete setting
await apiClient.deleteAppSetting('milestone_templates', '2024');
```

---

## 🏃‍♂️ Quick Start

### Step 1: เริ่ม Django Server

```bash
cd backend
python manage.py runserver
```

Server จะรันที่ `http://localhost:8000`

### Step 2: เริ่ม Frontend

```bash
cd frontend
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

### Step 3: Login และทดสอบ

1. Login เข้าระบบ
2. ไปที่ Settings page
3. ทดสอบสร้าง/แก้ไข settings:
   - Milestone Templates
   - Announcements
   - Defense Settings
   - Scoring Settings

---

## 🧪 Testing

### Option 1: Django Unit Tests

```bash
cd backend
python manage.py test settings.tests.AppSettingsAPITestCase
```

### Option 2: PowerShell Script

```powershell
.\test_api_simple.ps1
```

### Option 3: Python Script

```bash
python test_settings_api.py
```

---

## 📝 Usage Examples

### Example 1: Get Milestone Templates

```typescript
import { apiClient } from './utils/apiClient';

// Get milestone templates for 2024
const response = await apiClient.getAppSetting('milestone_templates', '2024');
if (response.status >= 200 && response.status < 300) {
  const templates = response.data.value;
  console.log('Templates:', templates);
}
```

### Example 2: Update Announcements

```typescript
const announcements = [
  {
    id: 'ANN01',
    title: 'Welcome to 2024!',
    content: 'Welcome everyone...',
    audience: 'All',
    authorName: 'Admin'
  }
];

const response = await apiClient.updateAppSetting(
  'announcements',
  announcements,
  '2024'
);
```

### Example 3: Using in React Component

```typescript
import { useMockData } from './hooks/useMockData';

function SettingsPage() {
  const { 
    milestoneTemplates, 
    announcements,
    defenseSettings,
    scoringSettings,
    updateSettings 
  } = useMockData(currentAcademicYear, addNotification, addToast);

  const handleUpdate = async () => {
    await updateSettings(currentAcademicYear, 'milestoneTemplates', newTemplates);
  };

  return (
    // Your component JSX
  );
}
```

---

## 🔧 Configuration

### Academic Year

Settings จะถูกเก็บแยกตามปีการศึกษา:
- Format: `{setting_type}_{academic_year}`
- Example: `milestone_templates_2024`

### Permissions

- **GET**: ทุก authenticated users
- **POST/PUT/DELETE**: Admin หรือ DepartmentAdmin เท่านั้น

---

## 🛡️ Error Handling

ระบบมี fallback mechanism อัตโนมัติ:

1. **Primary**: เรียก Backend API
2. **Fallback**: ใช้ localStorage หาก API ล้มเหลว
3. **Cache**: เก็บ response ใน localStorage เพื่อ performance

### Example Error Handling

```typescript
try {
  const response = await apiClient.getAppSetting('milestone_templates', '2024');
  if (response.status >= 200 && response.status < 300) {
    return response.data.value;
  }
} catch (error) {
  // Fallback to localStorage
  const cached = localStorage.getItem('milestoneTemplates_2024');
  return cached ? JSON.parse(cached) : [];
}
```

---

## 📊 Data Flow

```
Frontend Component
    ↓
useMockData Hook
    ↓
apiClient.getAppSetting()
    ↓
Backend API (/api/settings/app-settings/...)
    ↓
SystemSettings Model
    ↓
Database
```

**Fallback Path:**
```
Backend API fails
    ↓
localStorage.getItem()
    ↓
Return cached data
```

---

## 🔍 Troubleshooting

### Issue: "401 Unauthorized"
**Solution**: ตรวจสอบว่า login แล้วและ token ยังไม่หมดอายุ

### Issue: "403 Forbidden"
**Solution**: ตรวจสอบว่า user มีสิทธิ์ Admin หรือ DepartmentAdmin

### Issue: "400 Bad Request"
**Solution**: ตรวจสอบว่า:
- Setting type ถูกต้อง
- JSON payload ถูกต้อง
- Academic year format ถูกต้อง

### Issue: "404 Not Found"
**Solution**: ตรวจสอบว่า:
- URL path ถูกต้อง
- Academic year มีอยู่ใน database

---

## 📚 Related Documentation

- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Technical details
- [TEST_API_ENDPOINTS.md](./TEST_API_ENDPOINTS.md) - Testing guide
- [FINAL_MIGRATION_COMPLETE.md](./FINAL_MIGRATION_COMPLETE.md) - Complete summary

---

## ✅ Checklist

- [x] Backend API endpoints created
- [x] Frontend integration complete
- [x] Error handling implemented
- [x] Fallback mechanism working
- [x] Unit tests passing (10/10)
- [x] Documentation complete

**Status**: ✅ **Ready to Use**

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0

