# 🔧 การแก้ไข Dropdown Issues

## ปัญหาที่พบ
- Student และ Advisor dropdowns ยัง disabled อยู่
- API return ข้อมูลแล้ว แต่ format ไม่ตรงกับที่ frontend คาดหวัง

## สาเหตุ

### Backend API Format
- Students: `student_id`, `user.first_name`, `user.last_name`
- Advisors: `user.full_name`, `specializedMajorIds`, `is_department_admin`

### Frontend Type Format
- Students: `studentId`, `name`, `surname`
- Advisors: `name`, `specializedMajorIds`, `isDepartmentAdmin`

## การแก้ไข

### แก้ไข `web101/frontend/hooks/useMockData.ts`

#### Transform Students Data
```typescript
// Transform backend format to frontend format
const transformedStudents = rawStudents.map((s: any) => ({
    studentId: s.student_id || s.studentId || s.id?.toString() || '',
    name: s.user?.first_name || s.name || s.first_name || '',
    surname: s.user?.last_name || s.surname || s.last_name || '',
    major: s.major || '',
    classroom: s.classroom || '',
    gender: s.gender || 'Male',
    tel: s.tel || s.phone || s.user?.phone || '',
    email: s.user?.email || s.email || '',
    status: s.status || 'Pending',
    isAiAssistantEnabled: s.isAiAssistantEnabled !== undefined ? s.isAiAssistantEnabled : true,
})).filter((s: any) => s.studentId); // Filter out invalid students
```

#### Transform Advisors Data
```typescript
// Transform backend format to frontend format
const transformedAdvisors = rawAdvisors.map((a: any) => ({
    id: a.id?.toString() || a.advisor_id || '',
    name: a.user?.full_name || a.user?.first_name + ' ' + a.user?.last_name || a.name || '',
    quota: a.quota || 10,
    mainCommitteeQuota: a.main_committee_quota || a.mainCommitteeQuota || 5,
    secondCommitteeQuota: a.second_committee_quota || a.secondCommitteeQuota || 5,
    thirdCommitteeQuota: a.third_committee_quota || a.thirdCommitteeQuota || 5,
    specializedMajorIds: a.specializedMajorIds || (a.specializations?.map((s: any) => s.major?.id || s.id) || []),
    isDepartmentAdmin: a.is_department_admin || a.isDepartmentAdmin || false,
    password: a.password || 'password123',
    isAiAssistantEnabled: a.isAiAssistantEnabled !== undefined ? a.isAiAssistantEnabled : true,
})).filter((a: any) => a.id && a.name); // Filter out invalid advisors
```

## ผลลัพธ์ที่คาดหวัง
- Students data ถูก transform เป็น frontend format
- Advisors data ถูก transform เป็น frontend format
- Student dropdown enable (ถ้าไม่ใช่ student mode) หรือ auto-select (ถ้าเป็น student mode)
- Advisor dropdown enable เมื่อ student1 ถูกเลือก

## ขั้นตอนทดสอบ
1. Refresh browser
2. Login เป็น Student
3. เปิด Register Project Modal
4. ตรวจสอบว่า:
   - Student dropdown มี options (ถ้าไม่ใช่ student mode) หรือ auto-selected (ถ้าเป็น student mode)
   - Advisor dropdown enable เมื่อ student1 ถูกเลือก

---

**หมายเหตุ:** การ transform นี้จะทำให้ frontend สามารถใช้ข้อมูลจาก backend ได้โดยไม่ต้องแก้ไข types หรือ components อื่นๆ

