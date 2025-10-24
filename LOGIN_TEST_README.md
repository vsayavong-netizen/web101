# Automated Test for Real Login from Frontend

ระบบทดสอบการล็อกอินจริงจาก frontend กับ backend API

## 📋 ภาพรวม

ระบบนี้จะทดสอบการทำงานของระบบ authentication ทั้งหมด ตั้งแต่:
- Backend API endpoints
- Frontend integration
- Token validation
- Session management
- Protected requests
- Logout functionality

## 🚀 การใช้งาน

### วิธีที่ 1: รันแบบอัตโนมัติ (แนะนำ)

#### บน Windows:
```bash
run_login_tests.bat
```

#### บน Unix/Linux/macOS:
```bash
chmod +x run_login_tests.sh
./run_login_tests.sh
```

### วิธีที่ 2: รันด้วย Python

```bash
python run_login_tests.py
```

### วิธีที่ 3: รันแยกส่วน

#### ทดสอบ Backend:
```bash
cd backend
python test_real_login.py
```

#### ทดสอบ Frontend:
```bash
cd frontend
node test_login_integration.js
```

## 📁 ไฟล์ที่เกี่ยวข้อง

### Backend Tests
- `backend/test_real_login.py` - การทดสอบ backend API
- `backend/accounts/views.py` - Login API endpoints
- `backend/accounts/models.py` - User models
- `backend/accounts/serializers.py` - Login serializers

### Frontend Tests
- `frontend/test_login_integration.js` - การทดสอบ frontend integration
- `frontend/utils/apiClient.ts` - API client
- `frontend/hooks/useApiIntegration.ts` - Authentication hooks
- `frontend/components/LoginPage.tsx` - Login component

### Test Scripts
- `run_login_tests.py` - Main test runner
- `run_login_tests.bat` - Windows batch file
- `run_login_tests.sh` - Unix shell script

## 🧪 การทดสอบที่ครอบคลุม

### 1. Backend API Tests
- ✅ User creation และ setup
- ✅ Login API endpoint
- ✅ Token generation (JWT)
- ✅ User session creation
- ✅ Protected endpoint access
- ✅ Logout functionality
- ✅ Token validation

### 2. Frontend Integration Tests
- ✅ Backend connection
- ✅ Login API integration
- ✅ Token storage และ management
- ✅ Authenticated requests
- ✅ API client functionality
- ✅ Frontend component integration

### 3. End-to-End Tests
- ✅ Complete login flow
- ✅ Session management
- ✅ Token refresh
- ✅ Logout flow
- ✅ Error handling

## 🔧 Requirements

### Backend Requirements
- Python 3.8+
- Django 4.0+
- Django REST Framework
- djangorestframework-simplejwt
- requests library

### Frontend Requirements
- Node.js 16+
- npm หรือ yarn
- Modern browser (สำหรับ integration tests)

## 📊 ผลลัพธ์การทดสอบ

ระบบจะแสดงผลลัพธ์ในรูปแบบ:

```
🚀 เริ่มการทดสอบ Real Login Integration
============================================================

🔧 กำลังสร้าง test user...
✅ สร้าง test user สำเร็จ: testuser

🧪 ทดสอบ Backend Login API...
📊 Response Status: 200
✅ Backend Login API ทำงานถูกต้อง

🧪 ทดสอบ Frontend Login Integration...
📊 Frontend Integration Status: 200
✅ Frontend Login Integration ทำงานถูกต้อง

📊 สรุปผลการทดสอบ
============================================================
✅ setup: ผ่าน
✅ backend_api: ผ่าน
✅ frontend_integration: ผ่าน
✅ session_creation: ผ่าน
✅ authenticated_request: ผ่าน
✅ logout: ผ่าน

📈 ผลรวม: 6/6 การทดสอบผ่าน
🎉 การทดสอบทั้งหมดผ่าน!
```

## 🛠️ การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **Django server ไม่เริ่มทำงาน**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Frontend server ไม่เริ่มทำงาน**
   ```bash
   cd frontend
   npm start
   ```

3. **Database ไม่มีข้อมูล**
   ```bash
   cd backend
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **Dependencies ไม่ครบ**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   
   # Frontend
   cd frontend
   npm install
   ```

### การ Debug

1. **ตรวจสอบ logs**
   - Backend: ดูใน terminal ที่รัน `python manage.py runserver`
   - Frontend: ดูใน terminal ที่รัน `npm start`

2. **ตรวจสอบ network**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000

3. **ตรวจสอบ database**
   ```bash
   cd backend
   python manage.py shell
   >>> from accounts.models import User
   >>> User.objects.all()
   ```

## 📝 การปรับแต่ง

### เปลี่ยน Test User
แก้ไขใน `backend/test_real_login.py`:
```python
self.test_data = {
    'username': 'your_username',
    'password': 'your_password',
    'email': 'your_email@example.com',
    'first_name': 'Your',
    'last_name': 'Name',
    'role': 'Student'
}
```

### เปลี่ยน API Endpoints
แก้ไขใน `frontend/test_login_integration.js`:
```javascript
const API_BASE_URL = 'http://your-backend-url:8000';
const FRONTEND_BASE_URL = 'http://your-frontend-url:3000';
```

## 🎯 การใช้งานใน CI/CD

### GitHub Actions
```yaml
- name: Run Login Tests
  run: |
    python run_login_tests.py
```

### Jenkins
```groovy
stage('Login Tests') {
    steps {
        sh 'python run_login_tests.py'
    }
}
```

## 📞 การสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ logs ใน terminal
2. ตรวจสอบ network connectivity
3. ตรวจสอบ database connection
4. ตรวจสอบ dependencies

---

**หมายเหตุ**: ระบบทดสอบนี้จะสร้าง test user ชั่วคราวและลบออกหลังจากทดสอบเสร็จสิ้น
