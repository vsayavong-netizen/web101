# 📚 คู่มือการใช้งาน Final Project Management API

## 🚀 เริ่มต้นใช้งาน

### Base URL
```
https://eduinfo.online
```

### ข้อมูล API หลัก
```bash
GET https://eduinfo.online/
```

**Response:**
```json
{
  "message": "Welcome to Final Project Management System API",
  "version": "1.0.0",
  "documentation": "/api/docs/",
  "health_check": "/health/",
  "endpoints": {
    "authentication": "/api/auth/",
    "students": "/api/students/",
    "projects": "/api/projects/",
    "advisors": "/api/advisors/",
    "notifications": "/api/notifications/",
    "analytics": "/api/analytics/"
  }
}
```

## 🔐 การ Authentication

### 1. เข้าสู่ระบบ (Login)
```bash
POST https://eduinfo.online/api/auth/login/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "your_username",
    "email": "user@example.com",
    "role": "student"
  }
}
```

### 2. ใช้ Token ใน API Calls
```bash
GET https://eduinfo.online/api/students/
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### 3. รีเฟรช Token
```bash
POST https://eduinfo.online/api/auth/refresh/
Content-Type: application/json

{
  "refresh": "YOUR_REFRESH_TOKEN"
}
```

## 👨‍🎓 Student Management

### ดูรายชื่อนักศึกษา
```bash
GET https://eduinfo.online/api/students/
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### เพิ่มนักศึกษาใหม่
```bash
POST https://eduinfo.online/api/students/
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "student_id": "STU001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@university.edu",
  "major": "Computer Science",
  "academic_year": "2024"
}
```

### ดูข้อมูลนักศึกษาคนเดียว
```bash
GET https://eduinfo.online/api/students/1/
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 📚 Project Management

### ดูรายชื่อโปรเจค
```bash
GET https://eduinfo.online/api/projects/
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### เพิ่มโปรเจคใหม่
```bash
POST https://eduinfo.online/api/projects/
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "AI-Powered Learning System",
  "description": "A system that uses AI to personalize learning",
  "student_id": 1,
  "advisor_id": 1,
  "status": "in_progress",
  "academic_year": "2024"
}
```

## 👨‍🏫 Advisor Management

### ดูรายชื่ออาจารย์ที่ปรึกษา
```bash
GET https://eduinfo.online/api/advisors/
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### เพิ่มอาจารย์ที่ปรึกษาใหม่
```bash
POST https://eduinfo.online/api/advisors/
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "first_name": "Dr. Jane",
  "last_name": "Smith",
  "email": "jane.smith@university.edu",
  "department": "Computer Science",
  "specialization": "Artificial Intelligence"
}
```

## 📊 Analytics

### ดูข้อมูลสถิติ
```bash
GET https://eduinfo.online/api/analytics/
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### ดูแดชบอร์ด
```bash
GET https://eduinfo.online/api/analytics/dashboard/
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 🔔 Notifications

### ดูการแจ้งเตือน
```bash
GET https://eduinfo.online/api/notifications/
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### สร้างการแจ้งเตือนใหม่
```bash
POST https://eduinfo.online/api/notifications/
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "Project Deadline Reminder",
  "message": "Your project submission is due in 3 days",
  "recipient_id": 1,
  "type": "deadline_reminder"
}
```

## 🏥 Health Check

### ตรวจสอบสถานะระบบ
```bash
GET https://eduinfo.online/health/
```

**Response:**
```json
{
  "status": "healthy",
  "service": "Final Project Management System",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 📖 API Documentation

### ดูเอกสาร API แบบ Interactive
```
https://eduinfo.online/api/docs/
```

## 🧪 การทดสอบ

### ใช้ไฟล์ทดสอบ
1. เปิดไฟล์ `test_api_endpoints.html` ในเบราว์เซอร์
2. คลิกปุ่มทดสอบต่างๆ
3. ดูผลลัพธ์การทดสอบ

### ทดสอบด้วย cURL
```bash
# ทดสอบ root endpoint
curl https://eduinfo.online/

# ทดสอบ health check
curl https://eduinfo.online/health/

# ทดสอบ login
curl -X POST https://eduinfo.online/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **401 Unauthorized**
   - ตรวจสอบว่าได้ส่ง Authorization header
   - ตรวจสอบว่า token ยังไม่หมดอายุ

2. **404 Not Found**
   - ตรวจสอบ URL path
   - ตรวจสอบว่า endpoint มีอยู่จริง

3. **CORS Error**
   - ตรวจสอบ Origin header
   - ตรวจสอบการตั้งค่า CORS ใน backend

### การ Debug
1. เปิด Browser Developer Tools
2. ดู Network tab
3. ตรวจสอบ Request/Response headers
4. ดู Console สำหรับ error messages

## 📞 การติดต่อ

หากต้องการความช่วยเหลือเพิ่มเติม:
- ตรวจสอบไฟล์ `test_api_endpoints.html`
- ดู API documentation ที่ `/api/docs/`
- ตรวจสอบ health check ที่ `/health/`
