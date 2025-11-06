# 🔧 การแก้ไข API Endpoint สำหรับ Register Project

## ปัญหาที่พบ
- Frontend เรียก endpoint ที่ไม่ถูกต้อง: `POST /api/2024/projectGroups` (404 Not Found)
- ควรเรียก: `POST /api/projects/projects/`

## การแก้ไข

### แก้ไข `web101/frontend/hooks/useMockData.ts`

#### เปลี่ยน `addProject` function
- **เดิม**: เรียก `api.addCollectionItem(currentAcademicYear, 'projectGroups', newGroup)` ซึ่งสร้าง URL เป็น `/api/${year}/projectGroups`
- **ใหม่**: เรียก backend API โดยตรงที่ `/api/projects/projects/` พร้อม transform ข้อมูลเป็น backend format

#### Backend Payload Format
```typescript
const backendPayload = {
    topic_lao: project.topicLao,
    topic_eng: project.topicEng,
    advisor: advisor?.id || null,
    student_ids: studentIds,
    academic_year: currentAcademicYear,
    comment: project.comment || 'Initial submission',
};
```

#### Error Handling
- ถ้า backend API ล้มเหลว จะ fallback ไปใช้ localStorage (เหมือนเดิม)
- เพิ่ม error logging เพื่อ debug

## ผลลัพธ์ที่คาดหวัง
- Project ถูกสร้างใน backend database
- ไม่มี 404 error
- Success message แสดง
- Project ปรากฏใน dashboard

---

**หมายเหตุ:** การแก้ไขนี้จะทำให้ Register Project ทำงานกับ backend API ได้อย่างถูกต้อง

