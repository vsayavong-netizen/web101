# 🔧 การแก้ไข Token Reload Logic

## ปัญหาที่พบ
- API requests ถูกส่งไปก่อนที่ token จะถูก set หลัง login
- ทำให้ได้ 401 Unauthorized errors
- Data ไม่ได้ reload หลัง login สำเร็จ

## สาเหตุ
`useEffect` ใน `useMockData` มี dependencies เป็น `[currentAcademicYear, addToast]` เท่านั้น
- ไม่มี token ใน dependencies
- ไม่ได้ reload เมื่อ token เปลี่ยน

## การแก้ไข

### แก้ไข `web101/frontend/hooks/useMockData.ts`

#### เพิ่ม Token State และ Watch Logic
```typescript
// Watch for token changes to reload data after login
const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('auth_token'));

useEffect(() => {
    // Listen for storage changes (when token is set after login)
    const handleStorageChange = () => {
        const newToken = localStorage.getItem('auth_token');
        if (newToken !== authToken) {
            setAuthToken(newToken);
        }
    };
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically (for same-tab updates)
    const interval = setInterval(() => {
        const currentToken = localStorage.getItem('auth_token');
        if (currentToken !== authToken) {
            setAuthToken(currentToken);
        }
    }, 1000);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
    };
}, [authToken]);
```

#### เพิ่ม authToken เป็น Dependency
```typescript
useEffect(() => {
    const loadData = async () => {
        // ... load data logic
    };
    loadData();
}, [currentAcademicYear, addToast, authToken]); // เพิ่ม authToken
```

## ผลลัพธ์ที่คาดหวัง
- เมื่อ token ถูก set หลัง login, `authToken` state จะเปลี่ยน
- `useEffect` ที่ watch `authToken` จะ trigger
- `loadData` useEffect จะถูกเรียกอีกครั้ง
- API requests จะถูกส่งไปพร้อมกับ token
- ไม่มี 401 errors อีกต่อไป

## ขั้นตอนทดสอบ
1. Refresh browser
2. Login ใหม่
3. ตรวจสอบ Network tab ว่า API requests ถูกส่ง 2 ครั้ง:
   - ครั้งแรก: ก่อน login (ไม่มี token) - อาจได้ 401
   - ครั้งที่สอง: หลัง login (มี token) - ควรสำเร็จ
4. ตรวจสอบว่า Students และ Advisors data โหลดมาแล้ว
5. ทดสอบ Register Project Modal

---

**หมายเหตุ:** การใช้ `setInterval` เพื่อ check token changes อาจไม่ใช่วิธีที่ดีที่สุด แต่จะทำงานได้สำหรับตอนนี้

