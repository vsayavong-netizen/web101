# 🔧 Fix: 401 Unauthorized Error

## ❌ Problem

พบ error 401 Unauthorized เมื่อพยายามเข้าถึง API endpoints:

```
:8000/api/settings/academic-years/available/:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
:8000/api/projects/?academic_year=2024:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
:8000/api/advisors/?academic_year=2024:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
:8000/api/majors/?academic_year=2024:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
:8000/api/classrooms/?academic_year=2024:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

## 🔍 Root Cause

1. **API endpoints ต้องการ authentication** (`permissions.IsAuthenticated`)
2. **Token ไม่ถูกส่ง** หรือ **หมดอายุ**
3. **User ยังไม่ได้ login** หรือ **token ถูก clear**

## ✅ Solution

### 1. แก้ไข API Client Token Handling

**File**: `frontend/utils/apiClient.ts`

#### A. อัพเดท Token จาก localStorage ทุกครั้ง
```typescript
private getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Always try to get fresh token from localStorage
  const currentToken = localStorage.getItem('auth_token');
  if (currentToken) {
    this.token = currentToken;
    headers['Authorization'] = `Bearer ${currentToken}`;
  } else if (this.token) {
    headers['Authorization'] = `Bearer ${this.token}`;
  }

  return headers;
}
```

#### B. ปรับปรุง Token Refresh Mechanism
```typescript
if (response.status === 401) {
  // Try to refresh token if we have a refresh token
  if (this.refreshToken || localStorage.getItem('refresh_token')) {
    const refreshed = await this.tryRefreshToken();
    if (refreshed) {
      // Retry the request with new token
      // ...
    }
  }
  
  // Return error response instead of throwing
  return {
    data: data || { error: 'Unauthorized', message: 'Authentication required' },
    status: 401,
    error: 'Unauthorized',
    message: 'Authentication required. Please login again.',
  };
}
```

#### C. ปรับปรุง tryRefreshToken
```typescript
private async tryRefreshToken(): Promise<boolean> {
  // Get refresh token from localStorage if not in instance
  const refreshToken = this.refreshToken || localStorage.getItem('refresh_token');
  if (!refreshToken) return false;
  // ...
}
```

### 2. แก้ไข useAcademicYear Hook

**File**: `frontend/hooks/useAcademicYear.ts`

เพิ่มการจัดการ 401 error:

```typescript
// Handle 401 Unauthorized - user not logged in
if (response.status === 401) {
  // User is not authenticated, use localStorage fallback
  const storedYears = localStorage.getItem('academicYears');
  if (storedYears) {
    const years = JSON.parse(storedYears);
    setAvailableYears(years);
    if (years.length > 0) {
      setCurrentAcademicYear(years[years.length - 1]);
    }
  } else {
    // Initialize with default year
    const INITIAL_YEAR = '2024';
    setAvailableYears([INITIAL_YEAR]);
    setCurrentAcademicYear(INITIAL_YEAR);
  }
  setLoading(false);
  return;
}
```

## 🎯 Expected Behavior

### เมื่อ User Login แล้ว
- ✅ Token ถูกเก็บใน localStorage
- ✅ Token ถูกส่งไปกับทุก API request
- ✅ API requests ทำงานได้ปกติ

### เมื่อ User ยังไม่ได้ Login
- ✅ API requests จะได้ 401
- ✅ Frontend จะใช้ localStorage fallback
- ✅ ไม่แสดง error messages ที่รบกวน

### เมื่อ Token หมดอายุ
- ✅ System จะพยายาม refresh token อัตโนมัติ
- ✅ ถ้า refresh สำเร็จ จะ retry request
- ✅ ถ้า refresh ล้มเหลว จะ clear token และ redirect ไป login

## 📝 Verification

### 1. ตรวจสอบ Token
```javascript
// ใน browser console
console.log('Token:', localStorage.getItem('auth_token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
```

### 2. ตรวจสอบ API Requests
- เปิด Browser DevTools > Network tab
- ดูว่า requests มี `Authorization: Bearer <token>` header หรือไม่

### 3. Test Login Flow
1. Login เข้าระบบ
2. ตรวจสอบว่า token ถูกเก็บใน localStorage
3. ตรวจสอบว่า API requests ทำงานได้

## 🔧 Additional Fixes

### 1. เพิ่ม Error Handling ใน useMockData
- Handle 401 errors gracefully
- ใช้ localStorage fallback เมื่อ API fails

### 2. เพิ่ม Global Auth Handler
- Redirect ไป login เมื่อ token หมดอายุ
- Clear tokens และ state เมื่อ logout

---

**Last Updated**: November 10, 2025

