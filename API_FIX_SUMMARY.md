# ✅ สรุปการแก้ไข API Authentication

## 🔧 การแก้ไขที่ทำ

### 1. แก้ไข `web101/frontend/utils/apiClient.ts`
- เปลี่ยน default `API_BASE_URL` จาก `'https://eduinfo.online'` เป็น `'http://localhost:8000'`
- ตอนนี้ API requests จะไปที่ local backend server

### 2. แก้ไข `web101/frontend/hooks/useMockData.ts`
- เปลี่ยน default `API_BASE_URL` จาก `'https://eduinfo.online'` เป็น `'http://localhost:8000'`
- ตอนนี้ data loading จะไปที่ local backend server

### 3. ตรวจสอบ `.env` file
- ✅ มี `VITE_API_BASE_URL=http://localhost:8000` อยู่แล้ว
- Vite จะอ่านค่าจาก `.env` file อัตโนมัติ

## 📋 ขั้นตอนทดสอบ

### 1. Restart Frontend Dev Server (ถ้าจำเป็น)
```powershell
# หยุด dev server (Ctrl+C) แล้วเริ่มใหม่
cd C:\Users\f15fo\web101\web101\frontend
npm run dev
```

### 2. Refresh Browser
- กด `Ctrl+Shift+R` (hard refresh) หรือ `F5`
- หรือปิด browser แล้วเปิดใหม่

### 3. Login ใหม่
- Login ด้วย Student account (`155n1006_21` / `password123`)
- Token จะถูก set ไปที่ localStorage และ apiClient

### 4. ตรวจสอบ Network Tab
- เปิด Browser DevTools (F12)
- ไปที่ Network tab
- ตรวจสอบว่า API requests ไปที่ `http://localhost:8000`
- ตรวจสอบว่า requests มี `Authorization: Bearer <token>` header

### 5. ตรวจสอบ Console
- ควรไม่มี 401 Unauthorized errors
- Students, Advisors, Majors, Classrooms ควรโหลดจาก Backend ได้

### 6. ทดสอบ Register Project
- เปิด Register Project Modal
- ตรวจสอบว่า Student และ Advisor dropdowns enable แล้ว
- ตรวจสอบว่ามีข้อมูลแสดงใน dropdowns

## 🎯 ผลลัพธ์ที่คาดหวัง

### ✅ ควรเห็น
- API requests ไปที่ `http://localhost:8000`
- Authorization header ใน requests
- ไม่มี 401 errors
- Students และ Advisors dropdowns enable
- ข้อมูลแสดงใน dropdowns

### ❌ ไม่ควรเห็น
- 401 Unauthorized errors
- API requests ไปที่ `https://eduinfo.online`
- "No available advisors" message
- Disabled dropdowns

## 🔍 Troubleshooting

### ถ้ายังมี 401 errors
1. ตรวจสอบว่า Backend server ทำงานอยู่ (`http://localhost:8000`)
2. ตรวจสอบว่า token ถูก set ใน localStorage:
   ```javascript
   // ใน Browser Console
   localStorage.getItem('auth_token')
   ```
3. ตรวจสอบว่า token ถูกส่งไปกับ requests ใน Network tab

### ถ้า dropdowns ยัง disabled
1. ตรวจสอบว่า Students และ Advisors API ทำงานได้
2. ตรวจสอบ Console สำหรับ errors
3. ตรวจสอบว่า data โหลดมาแล้วหรือยัง

---

**หมายเหตุ:** การแก้ไขนี้จะทำให้ frontend ใช้ local backend server แทน production server ซึ่งถูกต้องสำหรับ development

