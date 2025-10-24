# API ↔ Frontend Traceability Matrix

ตารางนี้สรุปความเชื่อมโยงระหว่าง API endpoints (จาก backend/**/urls.py) กับส่วนที่เรียกใช้ในฝั่ง Frontend (components/hooks/utils)

หมายเหตุ: เส้นทางบางส่วนเป็นกลุ่ม/ตัวอย่าง ช่วยให้เห็นภาพรวมการจับคู่ได้รวดเร็ว และอาจมีฟังก์ชันเรียกใช้มากกว่า 1 จุดใน UI

## Authentication
- /api/auth/login/, /api/auth/logout/, /api/auth/token/refresh/
  - Frontend: frontend/utils/apiClient.ts (login/logout/refresh), frontend/hooks/useApiIntegration.ts (useAuth) , frontend/App.tsx (session expired handler)

สิทธิ์/แนวปฏิบัติ
- ใช้ JWT + Refresh; บทบาทกำหนดใน `backend/permissions.py`
- ใช้ `RolePermission`, `RoleRequiredMixin`, `require_roles` ตามบริบท view

## Settings
- /api/settings/, /api/settings/update/
  - Frontend: frontend/utils/apiClient.ts (getSettings/updateSettings), frontend/hooks/useApiIntegration.ts (useSettings)

## Projects
- /api/projects/ กลุ่ม/รายละเอียด/สถานะ/ไฟล์/สุขภาพ/สถิติ/ค้นหา
  - Frontend: frontend/utils/apiClient.ts (getProjects/create/update/delete)
  - Components: frontend/components/HomePage.tsx (มุมมองสรุป), อื่นๆ ที่เกี่ยวข้องกับ timeline, group list

สิทธิ์/แนวปฏิบัติ
- Read: Student/Advisor/DepartmentAdmin/Admin (ตาม filter ใน view)
- Write (status/bulk/export): DepartmentAdmin/Admin

## Students
- /api/students/ รายการ/รายละเอียด/ค้นหา
  - Frontend: frontend/utils/apiClient.ts (getStudents/create/update)
  - Hooks/Data: frontend/hooks/useMockData.ts (sync ข้อมูลปี)

## Advisors
- /api/advisors/ รายการ/รายละเอียด
  - Frontend: frontend/utils/apiClient.ts (getAdvisors/create)
  - Hooks/Data: frontend/hooks/useMockData.ts

## Communication
- /api/communication/channels/, /channels/<id>/messages/, reactions/reads/direct
  - Frontend: frontend/utils/apiClient.ts (getChannels/getMessages/sendMessage)
  - Components: ส่วนแสดงข้อความภายใน HomePage/widgets ที่เกี่ยวข้อง

สิทธิ์/แนวปฏิบัติ
- Read/Write อยู่ในกรอบ `RolePermission`; ควรจำกัด management ให้ Advisor/DepartmentAdmin/Admin เมื่อจำเป็น

## File Management
- /api/files/, อัปโหลด/ดาวน์โหลด
  - Frontend: frontend/utils/apiClient.ts (uploadFile/getFiles/downloadFile)

สิทธิ์/แนวปฏิบัติ
- Upload: Advisor/DepartmentAdmin/Admin; Read: ผู้เกี่ยวข้อง

## Analytics / Reports
- /api/analytics/, /api/reports/
  - Frontend: frontend/utils/apiClient.ts (getAnalytics/getProjectStatistics)
  - Components: หน้าแดชบอร์ด/รายงานใน HomePage

สิทธิ์/แนวปฏิบัติ
- Reports: Admin-only (บังคับด้วย `require_roles('Admin')`)

## AI Services / AI Enhancement
- /api/ai/**, /api/ai-enhancement/**
  - Frontend: frontend/utils/apiClient.ts (checkPlagiarism/checkGrammar/getTopicSuggestions)
  - Components: UI ที่เรียกใช้ฟีเจอร์ AI ใน HomePage และโมดูลย่อย

สิทธิ์/แนวปฏิบัติ
- Read/Run: Advisor/DepartmentAdmin/Admin, ปรับตามกรณีใช้งาน

## Defense Management
- /api/defense/schedules/, /api/defense/sessions/
  - Frontend: frontend/utils/apiClient.ts (getDefenseSchedules/createDefenseSchedule/getDefenseSessions)

สิทธิ์/แนวปฏิบัติ
- Schedule/Start/Complete/Evaluate/Result: Advisor/DepartmentAdmin/Admin
- Settings/Rooms: DepartmentAdmin/Admin

---

แนะนำให้ใช้เอกสารนี้ในการตรวจสอบผลกระทบเมื่อแก้ไข API หรือ UI รวมถึงเป็น checklist สำหรับการทดสอบ end-to-end
