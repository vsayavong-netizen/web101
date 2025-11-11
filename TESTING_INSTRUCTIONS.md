# 🧪 Testing Instructions - คู่มือการทดสอบ

**วันที่อัพเดท**: 10 พฤศจิกายน 2025

---

## 📋 สรุปการทดสอบ

### ✅ **1. Django Check**
ตรวจสอบการตั้งค่า Django ทั้งหมด

### ✅ **2. WebSocket Connection Tests**
ทดสอบการเชื่อมต่อ WebSocket และการส่งข้อความแบบ real-time

### ✅ **3. Export/Import Tests**
ทดสอบการ export และ import ข้อมูล projects

---

## 🔧 การติดตั้ง Dependencies

### **Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

**Dependencies ใหม่ที่เพิ่ม:**
- `openpyxl==3.1.2` - สำหรับ Excel export/import
- `PyJWT==2.8.0` - สำหรับ JWT token decoding
- `locust==2.17.0` - สำหรับ performance testing

**หมายเหตุ:** `channels.testing` รวมอยู่ใน `channels` package แล้ว ไม่ต้องติดตั้งแยก

---

## 🚀 การรันทดสอบ

### **1. Django Check**

**คำสั่ง:**
```bash
cd backend
python manage.py check
```

**ผลลัพธ์ที่คาดหวัง:**
```
System check identified no issues (0 silenced).
```

**หมายเหตุ:** 
- ต้องมี virtual environment เปิดอยู่
- ต้องมี database configured
- ต้องมี settings.py ถูกต้อง

---

### **2. WebSocket Connection Tests**

**คำสั่ง:**
```bash
cd backend
python manage.py test tests.test_websocket
```

**Test Cases:**
- ✅ `test_notification_websocket_connection` - ทดสอบการเชื่อมต่อสำเร็จ
- ✅ `test_websocket_authentication_required` - ทดสอบว่าต้องมี authentication
- ✅ `test_websocket_invalid_token` - ทดสอบการ reject token ที่ไม่ถูกต้อง
- ✅ `test_websocket_send_message` - ทดสอบการส่งข้อความ

**Manual Testing (Browser Console):**
```javascript
// 1. Login เพื่อรับ JWT token
const loginResponse = await fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});
const { access } = await loginResponse.json();

// 2. เชื่อมต่อ WebSocket
const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${access}`);

ws.onopen = () => {
  console.log('✅ WebSocket Connected');
  
  // ส่ง request เพื่อรับ notifications
  ws.send(JSON.stringify({ action: 'get_notifications' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 Message received:', data);
};

ws.onerror = (error) => {
  console.error('❌ WebSocket Error:', error);
};

ws.onclose = (event) => {
  console.log('🔌 WebSocket Closed:', event.code, event.reason);
};
```

---

### **3. Export/Import Tests**

**คำสั่ง:**
```bash
cd backend
python manage.py test tests.test_export_import
```

**Test Cases:**
- ✅ `test_export_to_csv` - ทดสอบ CSV export
- ✅ `test_export_to_excel` - ทดสอบ Excel export
- ✅ `test_export_api_endpoint` - ทดสอบ export API
- ✅ `test_import_from_csv` - ทดสอบ CSV import
- ✅ `test_import_api_endpoint` - ทดสอบ import API

**Manual Testing:**

**Export CSV:**
```bash
# ใช้ curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/projects/export/?format=csv" \
  -o projects.csv

# หรือใช้ browser
# GET http://localhost:8000/api/projects/export/?format=csv
# (ต้องมี Authorization header)
```

**Export Excel:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/projects/export/?format=excel" \
  -o projects.xlsx
```

**Import CSV:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@projects.csv" \
  -F "format=csv" \
  -F "academic_year=2024" \
  "http://localhost:8000/api/projects/import_data/"
```

**Frontend Testing (JavaScript):**
```javascript
// Export
const exportProjects = async (format = 'csv') => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(
    `http://localhost:8000/api/projects/export/?format=${format}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projects.${format === 'excel' ? 'xlsx' : 'csv'}`;
  a.click();
};

// Import
const importProjects = async (file, academicYear = '2024') => {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('file', file);
  formData.append('format', 'csv');
  formData.append('academic_year', academicYear);
  
  const response = await fetch(
    'http://localhost:8000/api/projects/import_data/',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );
  
  const result = await response.json();
  console.log(`✅ Imported ${result.success_count} projects`);
  console.log(`❌ Errors: ${result.error_count}`);
};
```

---

## 📊 Expected Results

### **Django Check**
```
System check identified no issues (0 silenced).
```

### **WebSocket Tests**
```
test_notification_websocket_connection ... ok
test_websocket_authentication_required ... ok
test_websocket_invalid_token ... ok
test_websocket_send_message ... ok

----------------------------------------------------------------------
Ran 4 tests in X.XXXs

OK
```

### **Export/Import Tests**
```
test_export_to_csv ... ok
test_export_to_excel ... ok
test_export_api_endpoint ... ok
test_import_from_csv ... ok
test_import_api_endpoint ... ok

----------------------------------------------------------------------
Ran 5 tests in X.XXXs

OK
```

---

## 🔍 Troubleshooting

### **ปัญหา: Django check fails**
- ✅ ตรวจสอบว่า virtual environment เปิดอยู่
- ✅ ตรวจสอบว่า database configured
- ✅ ตรวจสอบว่า `INSTALLED_APPS` มี apps ที่จำเป็น

### **ปัญหา: WebSocket tests fail**
- ✅ ตรวจสอบว่า `channels-test` ติดตั้งแล้ว
- ✅ ตรวจสอบว่า `PyJWT` ติดตั้งแล้ว
- ✅ ตรวจสอบว่า Redis running (สำหรับ production)

### **ปัญหา: Export/Import tests fail**
- ✅ ตรวจสอบว่า `openpyxl` ติดตั้งแล้ว
- ✅ ตรวจสอบว่า user มี permission
- ✅ ตรวจสอบว่า database มีข้อมูล projects

---

## 📝 Test Files Location

- **WebSocket Tests**: `backend/tests/test_websocket.py`
- **Export/Import Tests**: `backend/tests/test_export_import.py`
- **Security Tests**: `backend/security_tests/test_security.py`
- **Performance Tests**: `backend/performance_tests/locustfile.py`

---

## 🎯 Next Steps

1. **ติดตั้ง Dependencies**: `pip install -r requirements.txt`
2. **รัน Django Check**: `python manage.py check`
3. **รัน Tests**: `python manage.py test tests`
4. **Manual Testing**: ทดสอบผ่าน browser/Postman

---

**Last Updated**: November 10, 2025

