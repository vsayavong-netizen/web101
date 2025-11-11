# 📊 Frontend localStorage Usage Report

## สรุปการใช้งาน localStorage ใน Frontend

พบการใช้งาน localStorage ทั้งหมด **146 ครั้ง** ใน **15 ไฟล์**

---

## 📁 ไฟล์ที่ใช้ localStorage

### 1. **frontend/utils/apiClient.ts** (6 ครั้ง)
**วัตถุประสงค์:** จัดการ Authentication Tokens

```typescript
// Get tokens
localStorage.getItem('auth_token')
localStorage.getItem('refresh_token')

// Set tokens
localStorage.setItem('auth_token', token)
localStorage.setItem('refresh_token', refreshToken)

// Clear tokens
localStorage.removeItem('auth_token')
localStorage.removeItem('refresh_token')
```

**สถานะ:** ✅ จำเป็น - ใช้เก็บ JWT tokens

---

### 2. **frontend/hooks/useMockData.ts** (92 ครั้ง)
**วัตถุประสงค์:** Fallback mechanism เมื่อ Backend API ล้มเหลว

**Keys ที่ใช้:**
- `auth_token` - Authentication token
- `{key}_{year}` - ข้อมูลตาม academic year เช่น:
  - `projectGroups_2024`
  - `students_2024`
  - `advisors_2024`
  - `majors_2024`
  - `classrooms_2024`
  - `milestoneTemplates_2024`
  - `announcements_2024`
  - `file_{fileId}` - ไฟล์ที่อัปโหลด

**สถานะ:** ⚠️ Fallback mechanism - ควร migrate ไปใช้ Backend API เต็มรูปแบบ

---

### 3. **frontend/App.tsx** (4 ครั้ง)
**วัตถุประสงค์:** 
- Notifications storage
- Security audit timestamp

```typescript
// Notifications
localStorage.getItem(`notifications_${currentAcademicYear}`)
localStorage.setItem(`notifications_${currentAcademicYear}`, JSON.stringify(notifications))

// Security audit
localStorage.getItem(`lastAutomatedSecurityAudit_${currentAcademicYear}`)
localStorage.setItem(`lastAutomatedSecurityAudit_${currentAcademicYear}`, Date.now().toString())
```

**สถานะ:** ⚠️ ควร migrate ไปใช้ Backend API

---

### 4. **frontend/hooks/useAcademicYear.ts** (5 ครั้ง)
**วัตถุประสงค์:** Fallback สำหรับ Academic Year

```typescript
// Fallback if API fails
localStorage.getItem('academicYears')
localStorage.getItem('currentAcademicYear')
localStorage.setItem('academicYears', JSON.stringify(updatedYears))
localStorage.setItem('currentAcademicYear', newYearStr)
```

**สถานะ:** ✅ OK - ใช้เป็น fallback mechanism

---

### 5. **frontend/context/ThemeContext.tsx** (2 ครั้ง)
**วัตถุประสงค์:** เก็บ theme preference

```typescript
localStorage.getItem('theme')
localStorage.setItem('theme', theme)
```

**สถานะ:** ✅ จำเป็น - User preference

---

### 6. **frontend/context/LanguageContext.tsx** (2 ครั้ง)
**วัตถุประสงค์:** เก็บ language preference

```typescript
localStorage.getItem('language')
localStorage.setItem('language', language)
```

**สถานะ:** ✅ จำเป็น - User preference

---

### 7. **frontend/hooks/useTour.ts** (2 ครั้ง)
**วัตถุประสงค์:** เก็บสถานะการ complete tour

```typescript
localStorage.getItem(`tourCompleted_${tourKey}`)
localStorage.setItem(`tourCompleted_${tourKey}`, 'true')
```

**สถานะ:** ✅ จำเป็น - User preference

---

### 8. **frontend/index.html** (1 ครั้ง)
**วัตถุประสงค์:** ตั้งค่า language เริ่มต้น

```javascript
const lang = localStorage.getItem('language') || 'en';
```

**สถานะ:** ✅ จำเป็น - Initial setup

---

### 9. **frontend/components/CommunicationLog.tsx** (1 ครั้ง)
**วัตถุประสงค์:** ดึงไฟล์จาก localStorage

```typescript
localStorage.getItem(`file_${fileId}`)
```

**สถานะ:** ⚠️ ควร migrate ไปใช้ Backend File API

---

### 10. **frontend/components/HomePage.tsx** (1 ครั้ง)
**วัตถุประสงค์:** ดึงไฟล์จาก localStorage

```typescript
localStorage.getItem(`file_${file.fileId}`)
```

**สถานะ:** ⚠️ ควร migrate ไปใช้ Backend File API

---

### 11. **frontend/components/ProjectDetailView.tsx** (1 ครั้ง)
**วัตถุประสงค์:** ดึงไฟล์จาก localStorage

```typescript
localStorage.getItem(`file_${file.fileId}`)
```

**สถานะ:** ⚠️ ควร migrate ไปใช้ Backend File API

---

### 12. **frontend/components/SubmissionsManagement.tsx** (1 ครั้ง)
**วัตถุประสงค์:** ดึงไฟล์จาก localStorage

```typescript
localStorage.getItem(`file_${fileId}`)
```

**สถานะ:** ⚠️ ควร migrate ไปใช้ Backend File API

---

### 13. **frontend/components/FinalProjectManagement.tsx** (1 ครั้ง)
**วัตถุประสงค์:** ดึงไฟล์จาก localStorage

```typescript
localStorage.getItem(`file_${fileId}`)
```

**สถานะ:** ⚠️ ควร migrate ไปใช้ Backend File API

---

## 📊 สรุปตามประเภท

### ✅ จำเป็น (Keep)
1. **Authentication Tokens** (`auth_token`, `refresh_token`)
   - ไฟล์: `apiClient.ts`
   - จำนวน: 6 ครั้ง

2. **User Preferences**
   - Theme: `ThemeContext.tsx` (2 ครั้ง)
   - Language: `LanguageContext.tsx`, `index.html` (3 ครั้ง)
   - Tour completion: `useTour.ts` (2 ครั้ง)
   - **รวม: 7 ครั้ง**

### ⚠️ ควร Migrate ไป Backend API
1. **Academic Year** (Fallback only - OK)
   - ไฟล์: `useAcademicYear.ts` (5 ครั้ง)
   - **สถานะ:** ✅ OK - ใช้เป็น fallback

2. **Notifications**
   - ไฟล์: `App.tsx` (2 ครั้ง)
   - **ควร:** Migrate ไปใช้ Backend Notifications API

3. **Data Storage** (Fallback mechanism)
   - ไฟล์: `useMockData.ts` (92 ครั้ง)
   - Keys: `projectGroups_{year}`, `students_{year}`, `advisors_{year}`, etc.
   - **ควร:** Migrate ไปใช้ Backend API เต็มรูปแบบ

4. **File Storage**
   - ไฟล์: หลาย components (5 ครั้ง)
   - Keys: `file_{fileId}`
   - **ควร:** Migrate ไปใช้ Backend File Management API

5. **Security Audit Timestamp**
   - ไฟล์: `App.tsx` (2 ครั้ง)
   - **ควร:** Migrate ไปใช้ Backend API

---

## 🎯 คำแนะนำ

### Priority 1: High Priority Migrations
1. **Notifications** → Backend Notifications API
2. **File Storage** → Backend File Management API
3. **Data Storage** → Backend API (gradual migration)

### Priority 2: Medium Priority
1. **Security Audit** → Backend API
2. **Academic Year** → Keep fallback (already done ✅)

### Priority 3: Keep as is
1. **Authentication Tokens** ✅
2. **User Preferences** (Theme, Language, Tour) ✅

---

## 📝 Action Items

### ✅ Completed
- [x] Academic Year API integration (with localStorage fallback)

### 🔄 In Progress
- [ ] Notifications API migration
- [ ] File Management API migration

### 📋 To Do
- [ ] Migrate data storage from localStorage to Backend API
- [ ] Security audit timestamp migration
- [ ] Remove unused localStorage keys after migration

---

## 🔍 localStorage Keys Inventory

### Authentication
- `auth_token` - JWT access token
- `refresh_token` - JWT refresh token

### User Preferences
- `theme` - Theme preference (light/dark)
- `language` - Language preference (en/lo)
- `tourCompleted_{tourKey}` - Tour completion status

### Academic Year (Fallback)
- `academicYears` - List of available years
- `currentAcademicYear` - Current selected year

### Data Storage (By Academic Year)
- `projectGroups_{year}` - Project groups
- `students_{year}` - Students data
- `advisors_{year}` - Advisors data
- `majors_{year}` - Majors data
- `classrooms_{year}` - Classrooms data
- `milestoneTemplates_{year}` - Milestone templates
- `announcements_{year}` - Announcements
- `notifications_{year}` - Notifications

### File Storage
- `file_{fileId}` - File data (base64 encoded)

### System
- `lastAutomatedSecurityAudit_{year}` - Security audit timestamp

---

## 📈 Statistics

- **Total localStorage usage:** 146 instances
- **Files using localStorage:** 15 files
- **Unique keys:** ~20+ keys
- **Necessary usage:** ~13 instances (9%)
- **Should migrate:** ~133 instances (91%)

---

## 🚀 Migration Strategy

1. **Phase 1:** Keep localStorage as fallback (current state)
2. **Phase 2:** Migrate critical features (Notifications, Files)
3. **Phase 3:** Migrate data storage gradually
4. **Phase 4:** Remove localStorage fallback after full migration

