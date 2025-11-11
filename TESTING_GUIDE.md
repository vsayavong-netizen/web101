# 🧪 BM23 Application Testing Guide
## คู่มือการทดสอบแอปพลิเคชัน BM23

---

## 📋 สารบัญ
1. [การเข้าสู่ระบบ](#การเข้าสู่ระบบ)
2. [การตรวจสอบข้อมูล](#การตรวจสอบข้อมูล)
3. [การทดสอบฟีเจอร์](#การทดสอบฟีเจอร์)
4. [การใช้งานข้อมูลทดสอบ](#การใช้งานข้อมูลทดสอบ)

---

## 🔐 การเข้าสู่ระบบ

### 1. Admin Account
```
URL: http://localhost:5173
Username: admin
Password: admin123
```

**ฟีเจอร์ที่เข้าถึงได้:**
- ✅ จัดการผู้ใช้ทั้งหมด
- ✅ จัดการโปรเจ็กต์ทั้งหมด
- ✅ ดูรายงานและสถิติ
- ✅ ตั้งค่าระบบ

### 2. Advisor Accounts

#### Department Admin
```
Username: souphap
Password: password123
Role: Department Admin
```

#### Advisor 1
```
Username: phayvanh
Password: password123
Role: Advisor
```

#### Advisor 2
```
Username: phetsamone
Password: password123
Role: Advisor
```

**ฟีเจอร์ที่เข้าถึงได้:**
- ✅ ดูและจัดการโปรเจ็กต์ที่รับผิดชอบ
- ✅ ให้คำแนะนำนักศึกษา
- ✅ ประเมินผลงาน
- ✅ ดูรายงาน

### 3. Student Accounts
```
Student IDs: 155N1001/21 ถึง 155N1008/21
Password: password123
```

**ตัวอย่าง:**
- `155n1001_21` / `password123` - Thongchai Vongvilay
- `155n1002_21` / `password123` - Soudalath Phommasone
- `155n1003_21` / `password123` - Ketsana Inthavong

**ฟีเจอร์ที่เข้าถึงได้:**
- ✅ ดูโปรเจ็กต์ของตัวเอง
- ✅ ส่งงาน
- ✅ ดูความคืบหน้า
- ✅ ติดต่ออาจารย์

---

## 📊 การตรวจสอบข้อมูล

### 1. ตรวจสอบผ่าน Frontend

#### ดูรายชื่อนักศึกษา
```
1. เข้าสู่ระบบด้วย admin/admin123
2. ไปที่ "Student Management"
3. ควรเห็นนักศึกษา 9 คน:
   - 155N1001/21 - Thongchai Vongvilay
   - 155N1002/21 - Soudalath Phommasone
   - 155N1003/21 - Ketsana Inthavong
   - 155N1004/21 - Bounthanh Chanthavong
   - 155N1005/21 - Anousone Douangphachanh
   - 155N1006/21 - Vilayphone Siphanthong
   - 155N1007/21 - Phonexay Phanthavong
   - 155N1008/21 - Sompasong Saysanavong
```

#### ดูรายชื่ออาจารย์
```
1. ไปที่ "Advisor Management"
2. ควรเห็นอาจารย์ 3 คน:
   - Ms. Souphap (Department Admin)
   - Assoc. Prof. Phayvanh
   - Ms. Phetsamone
```

#### ดูโปรเจ็กต์ที่สร้างไว้
```
1. ไปที่ "Projects"
2. ควรเห็นโปรเจ็กต์ 3 โปรเจ็กต์:
   - 2024-2025-P001: Development of Information Management System for Small Businesses
   - 2024-2025-P002: Analysis of Online Shopping Decision Making
   - 2024-2025-P003: Mobile Application for Inventory Management
```

### 2. ตรวจสอบผ่าน API

#### ใช้ Browser DevTools
```
1. เปิด Browser → http://localhost:5173
2. เปิด Developer Tools (F12)
3. ไปที่ Network tab
4. ใช้งานแอปพลิเคชัน
5. ตรวจสอบ API calls:
   - GET /api/students/
   - GET /api/advisors/
   - GET /api/projects/
```

#### ใช้ curl หรือ Postman
```bash
# Get Students
curl http://localhost:8000/api/students/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Advisors
curl http://localhost:8000/api/advisors/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get Projects
curl http://localhost:8000/api/projects/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 การทดสอบฟีเจอร์

### 1. Authentication & Authorization

#### ทดสอบ Login
```
✅ Test Case 1: Login with valid credentials
   - Username: admin
   - Password: admin123
   - Expected: Login successful, redirect to dashboard

✅ Test Case 2: Login with invalid credentials
   - Username: admin
   - Password: wrongpassword
   - Expected: Error message displayed

✅ Test Case 3: Logout
   - Click logout button
   - Expected: Redirect to login page
```

#### ทดสอบ Role-based Access
```
✅ Test Case 4: Admin access
   - Login as admin
   - Expected: Can access all features

✅ Test Case 5: Advisor access
   - Login as advisor
   - Expected: Can access advisor features only

✅ Test Case 6: Student access
   - Login as student
   - Expected: Can access student features only
```

### 2. CRUD Operations

#### Create (สร้าง)
```
✅ Test Case 7: Create new student
   1. Go to Student Management
   2. Click "Add Student"
   3. Fill in form
   4. Click Save
   Expected: Student created successfully

✅ Test Case 8: Create new project
   1. Go to Projects
   2. Click "Register Project"
   3. Fill in form
   4. Click Save
   Expected: Project created successfully
```

#### Read (อ่าน)
```
✅ Test Case 9: View student list
   Expected: All students displayed

✅ Test Case 10: View project details
   Expected: Project information displayed correctly
```

#### Update (แก้ไข)
```
✅ Test Case 11: Edit student information
   1. Click on student
   2. Click Edit
   3. Modify information
   4. Click Save
   Expected: Changes saved successfully

✅ Test Case 12: Update project status
   Expected: Status updated correctly
```

#### Delete (ลบ)
```
✅ Test Case 13: Delete student
   Expected: Student deleted (with confirmation)

✅ Test Case 14: Delete project
   Expected: Project deleted (with confirmation)
```

### 3. WebSocket Real-time Features

#### ทดสอบ Notifications
```
✅ Test Case 15: Real-time notifications
   1. Open Developer Tools → Console
   2. Check WebSocket connection
   Expected: "WebSocket connection established"

✅ Test Case 16: Receive notifications
   Expected: Notifications appear in real-time
```

### 4. Search & Filter

#### ทดสอบการค้นหา
```
✅ Test Case 17: Search students
   - Enter search term
   Expected: Filtered results displayed

✅ Test Case 18: Filter projects by status
   Expected: Only matching projects shown
```

### 5. File Upload/Download

#### ทดสอบการอัปโหลดไฟล์
```
✅ Test Case 19: Upload project file
   Expected: File uploaded successfully

✅ Test Case 20: Download file
   Expected: File downloaded correctly
```

---

## 📚 การใช้งานข้อมูลทดสอบ

### 1. ดูรายชื่อนักศึกษา

#### ผ่าน Frontend
```
1. Login as admin/admin123
2. Navigate to "Student Management"
3. View student list
4. Click on student to see details
```

#### ข้อมูลที่ควรเห็น:
- Student ID
- Name
- Email
- Major
- Classroom
- Enrollment Year
- Expected Graduation Year

### 2. ดูรายชื่ออาจารย์

#### ผ่าน Frontend
```
1. Navigate to "Advisor Management"
2. View advisor list
3. Click on advisor to see details
```

#### ข้อมูลที่ควรเห็น:
- Advisor ID
- Name
- Email
- Employee ID
- Max Students
- Current Quota

### 3. ดูโปรเจ็กต์ที่สร้างไว้

#### ผ่าน Frontend
```
1. Navigate to "Projects"
2. View project list
3. Click on project to see details
```

#### ข้อมูลที่ควรเห็น:
- Project ID
- Title (Lao & English)
- Advisor
- Students
- Status
- Created Date

---

## 🔧 การพัฒนาต่อ

### 1. เพิ่มฟีเจอร์ใหม่

#### ตัวอย่าง: เพิ่ม Component ใหม่
```typescript
// frontend/components/NewFeature.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export const NewFeature: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4">New Feature</Typography>
      {/* Your code here */}
    </Box>
  );
};
```

#### ตัวอย่าง: เพิ่ม API Endpoint
```python
# backend/projects/views.py
from rest_framework.viewsets import ModelViewSet

class NewViewSet(ModelViewSet):
    queryset = Model.objects.all()
    serializer_class = ModelSerializer
```

### 2. ปรับแต่ง UI/UX

#### ใช้ Material-UI Components
```typescript
import { 
  Button, 
  Card, 
  Typography,
  TextField,
  Dialog
} from '@mui/material';
```

#### Custom Styling
```typescript
import { styled } from '@mui/material/styles';

const CustomCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
}));
```

### 3. ทดสอบระบบเพิ่มเติม

#### Unit Tests
```bash
cd backend
python manage.py test
```

#### Integration Tests
```bash
# Test API endpoints
curl http://localhost:8000/api/projects/
```

#### E2E Tests
```bash
cd frontend/e2e
npm test
```

---

## 📝 Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout functionality
- [ ] Token refresh
- [ ] Role-based access control

### CRUD Operations
- [ ] Create new records
- [ ] Read/View records
- [ ] Update records
- [ ] Delete records

### WebSocket
- [ ] WebSocket connection
- [ ] Real-time notifications
- [ ] Connection reconnection

### UI/UX
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Form validation

---

## 🚀 Quick Start Testing

### 1. Start Servers
```powershell
# Terminal 1: Backend
cd backend
python manage.py run_asgi --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Access Application
```
http://localhost:5173
```

### 3. Login and Test
```
Username: admin
Password: admin123
```

---

## 📞 Support

หากพบปัญหา:
1. ตรวจสอบ Console (F12)
2. ตรวจสอบ Network tab
3. ตรวจสอบ Backend logs
4. รัน debug script: `python debug_and_check.py`

---

**Last Updated:** November 10, 2025  
**Version:** 1.0.0
