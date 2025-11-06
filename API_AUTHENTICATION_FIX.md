# 🔧 การแก้ไข API Authentication

## ปัญหาที่พบ
- API requests ได้รับ 401 Unauthorized errors
- Frontend ไม่ได้ส่ง authentication token ไปกับ API requests

## สาเหตุ
1. **API_BASE_URL ไม่ถูกต้อง** - Default เป็น `'https://eduinfo.online'` แทนที่จะเป็น `'http://localhost:8000'` สำหรับ development
2. Token ถูก set แล้วหลังจาก login แต่ API_BASE_URL ไม่ถูกต้องทำให้ requests ไปที่ server ผิด

## การแก้ไข

### 1. แก้ไข `web101/frontend/utils/apiClient.ts`
```typescript
// เปลี่ยน default API_BASE_URL จาก 'https://eduinfo.online' เป็น 'http://localhost:8000'
constructor(baseURL: string = ... || 'http://localhost:8000')
```

### 2. แก้ไข `web101/frontend/hooks/useMockData.ts`
```typescript
// เปลี่ยน default API_BASE_URL จาก 'https://eduinfo.online' เป็น 'http://localhost:8000'
const API_BASE_URL = ... || 'http://localhost:8000';
```

## ผลลัพธ์ที่คาดหวัง
- API requests จะไปที่ `http://localhost:8000` แทน `https://eduinfo.online`
- Token จะถูกส่งไปกับ API requests ถูกต้อง
- ไม่มี 401 Unauthorized errors
- Students, Advisors, Majors, Classrooms จะโหลดจาก Backend ได้

## ขั้นตอนทดสอบ
1. Rebuild frontend (ถ้าจำเป็น)
2. Refresh browser
3. Login ใหม่
4. ตรวจสอบ Network tab ว่า API requests ไปที่ `http://localhost:8000` และมี Authorization header
5. ตรวจสอบว่า Students และ Advisors dropdowns enable แล้ว

---

**หมายเหตุ:** สำหรับ production ควรใช้ environment variable `VITE_API_BASE_URL` แทนการ hardcode

