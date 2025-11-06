# 🧪 ทดสอบ Milestone Submission

## สถานะการทดสอบ

### ⏳ กำลังทดสอบ
- **Milestone Submission Feature**
  - เปิด Project Detail View
  - ตรวจสอบว่า project มี milestones หรือไม่
  - Upload file สำหรับ milestone
  - Submit milestone

## ขั้นตอนการทดสอบ

1. ⏳ Login เป็น Student
2. ⏳ เปิด Project Detail View (ถ้ามี project)
3. ⏳ ตรวจสอบว่า project มี milestones หรือไม่
   - ถ้าไม่มี milestones: ต้อง approve project ก่อน (advisor/admin)
   - ถ้ามี milestones: ทดสอบ upload file
4. ⏳ Upload file สำหรับ milestone
5. ⏳ Submit milestone
6. ⏳ ตรวจสอบผลลัพธ์ (status เปลี่ยนเป็น Submitted)

## ข้อมูลที่ต้องตรวจสอบ

### Project Status
- Project ต้องมี status = "Approved" เพื่อให้มี milestones
- Milestones จะถูกสร้างเมื่อ project ถูก approve

### Milestone Status
- Pending: ยังไม่ได้ submit
- Submitted: submit แล้ว รอ advisor review
- Approved: advisor approve แล้ว
- Requires Revision: advisor ต้องการให้แก้ไข

### File Upload
- ใช้ FileUpload component ใน ProjectDetailView
- ไฟล์จะถูกอ่านเป็น base64 และเก็บใน localStorage
- ไฟล์ขนาดสูงสุด 2MB

## ผลลัพธ์ที่คาดหวัง

- File upload ทำงานได้
- Milestone status เปลี่ยนเป็น "Submitted"
- Advisor สามารถเห็น milestone ที่ submit แล้ว
- Advisor สามารถ approve หรือ request revision ได้

---

**หมายเหตุ:** การทดสอบนี้จะตรวจสอบว่า Milestone Submission feature ทำงานได้อย่างสมบูรณ์


