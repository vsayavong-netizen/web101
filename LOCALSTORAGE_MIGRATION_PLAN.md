# 🔄 localStorage Migration Plan

## Overview
แผนการ migrate localStorage ไปใช้ Backend API เต็มรูปแบบ

---

## Phase 1: Critical Features (Priority: High)

### 1.1 Notifications API Migration
**Current:** `App.tsx` ใช้ localStorage
**Target:** Backend Notifications API

**Files to modify:**
- `frontend/App.tsx` (lines 43, 52)

**Steps:**
1. สร้าง `useNotifications` hook
2. เชื่อมต่อกับ Backend Notifications API
3. ใช้ localStorage เป็น fallback
4. ลบ localStorage code หลังจากยืนยันว่า API ทำงาน

---

### 1.2 File Management API Migration
**Current:** หลาย components ใช้ localStorage สำหรับไฟล์
**Target:** Backend File Management API

**Files to modify:**
- `frontend/components/CommunicationLog.tsx`
- `frontend/components/HomePage.tsx`
- `frontend/components/ProjectDetailView.tsx`
- `frontend/components/SubmissionsManagement.tsx`
- `frontend/components/FinalProjectManagement.tsx`
- `frontend/hooks/useMockData.ts` (file storage parts)

**Steps:**
1. ใช้ Backend File API สำหรับ upload/download
2. เก็บ file metadata ใน database
3. ใช้ localStorage เป็น cache (optional)
4. ลบ localStorage file storage

---

## Phase 2: Data Storage Migration (Priority: Medium)

### 2.1 useMockData.ts Refactoring
**Current:** ใช้ localStorage เป็น primary storage
**Target:** Backend API เป็น primary, localStorage เป็น fallback

**Strategy:**
- Keep fallback mechanism
- Prioritize Backend API calls
- Only use localStorage when API fails

**Keys to migrate:**
- `projectGroups_{year}` → Backend Projects API
- `students_{year}` → Backend Students API
- `advisors_{year}` → Backend Advisors API
- `majors_{year}` → Backend Majors API
- `classrooms_{year}` → Backend Classrooms API
- `milestoneTemplates_{year}` → Backend Milestones API
- `announcements_{year}` → Backend Announcements API

---

## Phase 3: System Features (Priority: Low)

### 3.1 Security Audit Timestamp
**Current:** `App.tsx` ใช้ localStorage
**Target:** Backend API

**Steps:**
1. สร้าง Backend endpoint สำหรับ audit logs
2. Migrate timestamp storage
3. ลบ localStorage code

---

## Keep as localStorage (User Preferences)

### ✅ Keep These
1. **Authentication Tokens** (`auth_token`, `refresh_token`)
   - Reason: Standard practice for JWT storage
   - File: `apiClient.ts`

2. **Theme Preference** (`theme`)
   - Reason: Client-side preference
   - File: `ThemeContext.tsx`

3. **Language Preference** (`language`)
   - Reason: Client-side preference
   - Files: `LanguageContext.tsx`, `index.html`

4. **Tour Completion** (`tourCompleted_{tourKey}`)
   - Reason: Client-side preference
   - File: `useTour.ts`

---

## Implementation Checklist

### Phase 1: Critical Features
- [ ] Create Notifications API hook
- [ ] Migrate notifications from localStorage
- [ ] Test notifications API
- [ ] Migrate file storage to Backend API
- [ ] Test file upload/download
- [ ] Remove localStorage file storage

### Phase 2: Data Storage
- [ ] Refactor useMockData to prioritize Backend API
- [ ] Migrate projectGroups to Backend API
- [ ] Migrate students to Backend API
- [ ] Migrate advisors to Backend API
- [ ] Migrate majors to Backend API
- [ ] Migrate classrooms to Backend API
- [ ] Migrate milestoneTemplates to Backend API
- [ ] Migrate announcements to Backend API
- [ ] Keep localStorage as fallback only

### Phase 3: System Features
- [ ] Create security audit API endpoint
- [ ] Migrate audit timestamp storage
- [ ] Remove localStorage audit code

### Phase 4: Cleanup
- [ ] Remove unused localStorage keys
- [ ] Update documentation
- [ ] Test all features
- [ ] Deploy

---

## Testing Strategy

1. **Unit Tests:** Test hooks and utilities
2. **Integration Tests:** Test API integration
3. **E2E Tests:** Test full user flows
4. **Fallback Tests:** Test localStorage fallback mechanism

---

## Rollback Plan

- Keep localStorage fallback during migration
- Monitor error rates
- Rollback if API failures exceed threshold
- Gradual migration (feature by feature)

---

## Timeline Estimate

- **Phase 1:** 2-3 weeks
- **Phase 2:** 4-6 weeks
- **Phase 3:** 1 week
- **Phase 4:** 1 week

**Total:** ~8-11 weeks

