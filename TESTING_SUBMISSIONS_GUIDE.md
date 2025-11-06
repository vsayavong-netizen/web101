# 🧪 คู่มือทดสอบฟีเจอร์: Register Project, Milestone Submission และ Final File Submission

## ✅ สิ่งที่ทำเสร็จแล้ว

1. **Frontend Build สำเร็จ** ✅
   - Build frontend แล้วที่ `web101/frontend/dist/`
   - ไฟล์ทั้งหมดพร้อมใช้งาน

2. **สร้างไฟล์ทดสอบ** ✅
   - สร้างไฟล์ `test_feature_submissions.html` สำหรับทดสอบฟีเจอร์ทั้ง 3 อย่าง
   - มี checklist และขั้นตอนการทดสอบครบถ้วน

## 📋 ฟีเจอร์ที่ต้องทดสอบ

### 1. Register Project (ลงทะเบียนโปรเจกต์)
**Location:** `web101/frontend/components/RegisterProjectModal.tsx`

**ฟีเจอร์:**
- ✅ ฟอร์มลงทะเบียนโปรเจกต์
- ✅ Auto-select student ใน Student mode
- ✅ Advisor dropdown
- ✅ Topic (Lao) และ (English) input
- ✅ Similarity check ด้วย AI
- ✅ Validation
- ✅ Submit และสร้าง Project ID อัตโนมัติ

**API Endpoint:**
- `POST /api/projects/projects/` - สร้างโปรเจกต์ใหม่
- `GET /api/projects/projects/` - ดึงรายการโปรเจกต์

### 2. Milestone Submission (ส่งไฟล์ Milestone)
**Location:** `web101/frontend/components/ProjectDetailView.tsx` (MilestoneList component)

**ฟีเจอร์:**
- ✅ Upload ไฟล์สำหรับ milestone
- ✅ แสดงสถานะ milestone (Pending, Submitted, Approved, Requires Revision)
- ✅ Download ไฟล์
- ✅ Replace ไฟล์
- ✅ Grammar check ด้วย AI
- ✅ Plagiarism check ด้วย AI
- ✅ Advisor สามารถ Approve หรือ Request Revision

**API Endpoint:**
- `PATCH /api/projects/projects/{id}/` - อัปเดต milestone
- `PUT /api/projects/projects/{id}/milestones/{milestone_id}/` - อัปเดต milestone file

### 3. Final File Submission (ส่งไฟล์ Final)
**Location:** `web101/frontend/components/ProjectDetailView.tsx` (FinalSubmissions component)

**ฟีเจอร์:**
- ✅ Upload Pre-Defense File
- ✅ Upload Post-Defense File
- ✅ แสดงสถานะไฟล์ (Submitted, Approved, Requires Revision)
- ✅ Download ไฟล์
- ✅ Replace ไฟล์
- ✅ Grammar check ด้วย AI
- ✅ Advisor สามารถ Review และ Approve/Request Revision

**API Endpoint:**
- `PATCH /api/projects/projects/{id}/` - อัปเดต finalSubmissions
- `POST /api/projects/projects/{id}/final-submissions/` - ส่งไฟล์ final

## 🚀 วิธีเริ่มทดสอบ

### ขั้นตอนที่ 1: เปิดไฟล์ทดสอบ
```bash
# เปิดไฟล์ HTML ใน browser
start web101/test_feature_submissions.html
# หรือ
# เปิดด้วย browser โดยตรง
```

### ขั้นตอนที่ 2: เริ่ม Frontend Dev Server (ถ้ายังไม่ได้เริ่ม)
```bash
cd web101/frontend
npm run dev
```

Frontend จะทำงานที่: **http://localhost:5173**

### ขั้นตอนที่ 3: เริ่ม Backend Server (ถ้ายังไม่ได้เริ่ม)
```bash
cd web101/backend
python manage.py runserver
```

Backend จะทำงานที่: **http://localhost:8000**

### ขั้นตอนที่ 4: ทดสอบฟีเจอร์

#### ทดสอบ Register Project:
1. เปิด http://localhost:5173
2. Login เป็น Student (เช่น `155n1006_21` / `password123`)
3. คลิก "Register Your Project"
4. กรอกข้อมูล:
   - Topic (Lao): `ການພັດທະນາລະບົບຈັດການຂໍ້ມູນ`
   - Topic (English): `Information Management System`
   - เลือก Advisor
5. คลิก Submit
6. ตรวจสอบว่าเห็น success message และโปรเจกต์ใหม่ในรายการ

#### ทดสอบ Milestone Submission:
1. เปิดโปรเจกต์ที่ต้องการ (ต้องมี Advisor approve ก่อน)
2. ไปที่ tab "Milestones"
3. เลือก Milestone ที่ status เป็น "Pending" หรือ "Requires Revision"
4. คลิก "Upload Submission File"
5. เลือกไฟล์ (PDF, DOC, DOCX - ไม่เกิน 2MB)
6. ตรวจสอบว่า status เปลี่ยนเป็น "Submitted"
7. ตรวจสอบว่าเห็นไฟล์และสามารถ download ได้

#### ทดสอบ Final File Submission:
1. เปิดโปรเจกต์ที่ต้องการ
2. ไปที่ tab "Submissions" หรือ "Final Submissions"
3. **Pre-Defense File:**
   - คลิก "Upload File" ใน section "Pre-Defense Files"
   - เลือกไฟล์
   - ตรวจสอบว่าเห็นไฟล์และ status เป็น "Submitted"
4. **Post-Defense File:**
   - คลิก "Upload File" ใน section "Post-Defense Files"
   - เลือกไฟล์
   - ตรวจสอบว่าเห็นไฟล์และ status เป็น "Submitted"

## 📝 Checklist การทดสอบ

### Register Project ✅
- [ ] สามารถเปิด Register Project Modal ได้
- [ ] Student ถูกเลือกอัตโนมัติ (ใน Student mode)
- [ ] Advisor dropdown มีรายการ advisors
- [ ] สามารถกรอก Topic (Lao) และ (English) ได้
- [ ] Validation ทำงานถูกต้อง
- [ ] สามารถ Submit ได้สำเร็จ
- [ ] เห็น success toast message
- [ ] โปรเจกต์ใหม่ปรากฏในรายการโปรเจกต์
- [ ] Project ID ถูกสร้างอัตโนมัติ

### Milestone Submission ✅
- [ ] เห็น Milestones tab ใน Project Detail View
- [ ] เห็นรายการ Milestones ทั้งหมด
- [ ] สามารถคลิกปุ่ม upload ได้
- [ ] สามารถเลือกไฟล์ได้
- [ ] ไฟล์ที่ upload มีขนาดไม่เกิน 2MB
- [ ] Status เปลี่ยนเป็น "Submitted" หลัง upload
- [ ] เห็นชื่อไฟล์และขนาดไฟล์
- [ ] สามารถ download ไฟล์ได้
- [ ] สามารถ replace ไฟล์ได้
- [ ] Advisor สามารถเห็นไฟล์ที่ submit แล้ว
- [ ] Advisor สามารถ Approve หรือ Request Revision ได้

### Final File Submission ✅
- [ ] เห็น Submissions tab ใน Project Detail View
- [ ] เห็น section "Pre-Defense Files" และ "Post-Defense Files"
- [ ] สามารถ upload Pre-Defense File ได้
- [ ] สามารถ upload Post-Defense File ได้
- [ ] เห็นชื่อไฟล์และขนาดไฟล์หลัง upload
- [ ] เห็น status ของไฟล์
- [ ] สามารถ download ไฟล์ได้
- [ ] สามารถ replace ไฟล์ได้
- [ ] Advisor สามารถ Review ไฟล์ได้
- [ ] Advisor สามารถ Approve หรือ Request Revision ได้
- [ ] เห็น feedback จาก Advisor (ถ้ามี)

## 🔍 ตรวจสอบ API

### ตรวจสอบ Register Project API:
```bash
# GET projects
curl http://localhost:8000/api/projects/projects/

# POST new project
curl -X POST http://localhost:8000/api/projects/projects/ \
  -H "Content-Type: application/json" \
  -d '{
    "topic_lao": "ການພັດທະນາລະບົບ",
    "topic_eng": "System Development",
    "advisor_name": "Ms. Souphap",
    "student_ids": ["155n1006_21"]
  }'
```

### ตรวจสอบ Milestone API:
```bash
# GET project with milestones
curl http://localhost:8000/api/projects/projects/{project_id}/

# PATCH milestone
curl -X PATCH http://localhost:8000/api/projects/projects/{project_id}/ \
  -H "Content-Type: application/json" \
  -d '{
    "milestones": [...]
  }'
```

### ตรวจสอบ Final Submission API:
```bash
# PATCH final submissions
curl -X PATCH http://localhost:8000/api/projects/projects/{project_id}/ \
  -H "Content-Type: application/json" \
  -d '{
    "final_submissions": {
      "pre_defense_file": {...},
      "post_defense_file": {...}
    }
  }'
```

## 🐛 Troubleshooting

### ปัญหา: Frontend ไม่สามารถเชื่อมต่อกับ Backend
**แก้ไข:**
- ตรวจสอบว่า backend server ทำงานอยู่ที่ http://localhost:8000
- ตรวจสอบ CORS settings ใน backend
- ตรวจสอบ `VITE_API_BASE_URL` ใน frontend `.env`

### ปัญหา: ไม่สามารถ upload ไฟล์ได้
**แก้ไข:**
- ตรวจสอบขนาดไฟล์ (ต้องไม่เกิน 2MB)
- ตรวจสอบประเภทไฟล์ (PDF, DOC, DOCX)
- ตรวจสอบ localStorage quota

### ปัญหา: ไม่เห็น Milestones
**แก้ไข:**
- ตรวจสอบว่าโปรเจกต์ถูก approve แล้ว
- ตรวจสอบว่า Advisor ได้ assign milestone template แล้ว
- ตรวจสอบว่า project status เป็น "Approved" หรือ "In Progress"

## 📊 สรุป

- ✅ Frontend build สำเร็จ
- ✅ ไฟล์ทดสอบพร้อมใช้งาน
- ✅ Components ทั้งหมดพร้อมใช้งาน
- ⏳ รอการทดสอบจากผู้ใช้

## 📞 ติดต่อ

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ console ใน browser (F12)
2. ตรวจสอบ network requests ใน DevTools
3. ตรวจสอบ backend logs

---

**วันที่สร้าง:** $(date)
**สถานะ:** พร้อมทดสอบ ✅

