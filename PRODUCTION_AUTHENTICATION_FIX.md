# 🔧 การแก้ไขปัญหา Authentication ใน Production

## 📋 สรุปปัญหา
- Frontend พยายามเข้าถึง `https://eduinfo.online/` แต่ได้รับข้อผิดพลาด 401 (Unauthorized)
- ข้อผิดพลาด "No valid token provided" บ่งบอกว่ามีปัญหากับการ authentication
- CORS settings ไม่ได้ตั้งค่าให้รองรับ production domain

## ✅ การแก้ไขที่ดำเนินการ

### 1. แก้ไข API URL ใน Frontend
**ไฟล์:** `frontend/.env`
```env
# เปลี่ยนจาก
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_DEBUG=true

# เป็น
VITE_API_BASE_URL=https://eduinfo.online
VITE_WS_URL=wss://eduinfo.online
VITE_DEBUG=false
```

### 2. อัปเดต CORS Settings ใน Backend
**ไฟล์:** `backend/final_project_management/settings_production.py`
```python
# CORS settings for production
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='https://eduinfo.online,https://www.eduinfo.online',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
# เพิ่ม CORS headers และ methods ที่จำเป็น
```

### 3. แก้ไข Token Storage ใน Frontend
**ไฟล์:** `frontend/hooks/useMockData.ts`
```typescript
// เปลี่ยนจาก
const token = localStorage.getItem('authToken');

// เป็น
const token = localStorage.getItem('auth_token');
```

**ไฟล์:** `frontend/utils/apiClient.ts`
```typescript
// แก้ไข environment variable name
constructor(baseURL: string = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || ...)
```

### 4. อัปเดต Render Configuration
**ไฟล์:** `render.yaml`
```yaml
envVars:
  - key: ALLOWED_HOSTS
    value: eduinfo.online,www.eduinfo.online
  - key: CORS_ALLOWED_ORIGINS
    value: https://eduinfo.online,https://www.eduinfo.online
```

### 5. สร้างไฟล์ Environment สำหรับ Production
**ไฟล์:** `frontend/.env.production`
```env
VITE_API_BASE_URL=https://eduinfo.online
VITE_WS_URL=wss://eduinfo.online
VITE_DEBUG=false
```

## 🧪 การทดสอบ

### ไฟล์ทดสอบที่สร้างขึ้น:
1. **`test_production_connection.js`** - สคริปต์ทดสอบการเชื่อมต่อ
2. **`test_production_connection.html`** - หน้าเว็บสำหรับทดสอบแบบ interactive

### วิธีการทดสอบ:
1. เปิดไฟล์ `test_production_connection.html` ในเบราว์เซอร์
2. คลิก "🚀 เริ่มทดสอบทั้งหมด"
3. ตรวจสอบผลลัพธ์ในแต่ละส่วน

## 🔍 การตรวจสอบเพิ่มเติม

### 1. ตรวจสอบ CORS Headers
```bash
curl -H "Origin: https://eduinfo.online" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS https://eduinfo.online/api/
```

### 2. ตรวจสอบ Authentication Endpoint
```bash
curl -X POST https://eduinfo.online/api/auth/login/ \
     -H "Content-Type: application/json" \
     -H "Origin: https://eduinfo.online" \
     -d '{"username":"test","password":"test"}'
```

### 3. ตรวจสอบ Token Storage
```javascript
// ใน Browser Console
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('refresh_token:', localStorage.getItem('refresh_token'));
```

## 🚀 การ Deploy

### 1. Frontend
```bash
cd frontend
npm run build
# อัปโหลดไฟล์ใน dist/ ไปยัง production server
```

### 2. Backend
```bash
cd backend
# ตรวจสอบว่า settings_production.py ถูกต้อง
python manage.py collectstatic
python manage.py migrate
```

### 3. Environment Variables ใน Production
```bash
# ตั้งค่า environment variables
export ALLOWED_HOSTS="eduinfo.online,www.eduinfo.online"
export CORS_ALLOWED_ORIGINS="https://eduinfo.online,https://www.eduinfo.online"
export DEBUG=False
```

## 📝 หมายเหตุสำคัญ

1. **Token Consistency**: ตรวจสอบให้แน่ใจว่า frontend ใช้ `auth_token` และ `refresh_token` อย่างสอดคล้องกัน
2. **CORS Configuration**: ต้องตั้งค่า CORS ให้รองรับ production domain
3. **HTTPS**: ตรวจสอบให้แน่ใจว่า production ใช้ HTTPS
4. **Environment Variables**: ตรวจสอบให้แน่ใจว่า environment variables ถูกตั้งค่าอย่างถูกต้อง

## 🔧 การแก้ไขปัญหาเพิ่มเติม

หากยังพบปัญหา:

1. **ตรวจสอบ Browser Console** สำหรับข้อผิดพลาด JavaScript
2. **ตรวจสอบ Network Tab** ใน Developer Tools
3. **ตรวจสอบ Server Logs** สำหรับข้อผิดพลาด backend
4. **ทดสอบด้วย Postman** หรือ curl เพื่อแยกแยะปัญหา frontend/backend

## 📞 การติดต่อ

หากต้องการความช่วยเหลือเพิ่มเติม กรุณาติดต่อทีมพัฒนา
