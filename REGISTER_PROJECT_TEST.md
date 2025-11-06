# 🧪 ทดสอบ Register Project

## สถานะการทดสอบ

### ✅ สำเร็จแล้ว
1. **Student Dropdown**
   - มีข้อมูล: "Vilayphone Siphanthong (155N1006/21)"
   - Auto-selected ใน student mode
   - Disabled ใน student mode (ถูกต้อง)

2. **Advisor Dropdown**
   - มี options: "Prof. Phayvanh (0/10)", "Ms. Phetsamone (0/10)", "Ms. Souphap (0/10)"
   - Enable เมื่อ student1 ถูกเลือก
   - ไม่ disabled แล้ว

3. **Data Transformation**
   - Students: แปลงจาก `student_id`, `user.first_name`, `user.last_name` เป็น `studentId`, `name`, `surname`
   - Advisors: แปลงจาก `user.full_name`, `specializedMajorIds` เป็น `name`, `specializedMajorIds`

### 🔄 กำลังทดสอบ
- **Submit Project Form**
  - กรอกข้อมูล Topic (LAO): "ລະບົບຈັດການບົດໂຄງການຈົບຊັ້ນ"
  - กรอกข้อมูล Topic (ENG): "Final Project Management System"
  - เลือก Advisor: "Prof. Phayvanh"
  - Student 1: "155N1006/21" (auto-selected)
  - Submit form

## ขั้นตอนการทดสอบ

1. ✅ เปิด Register Project Modal
2. ✅ ตรวจสอบ Student dropdown (auto-selected)
3. ✅ ตรวจสอบ Advisor dropdown (enable)
4. 🔄 กรอกข้อมูล Topic (LAO) และ Topic (ENG)
5. 🔄 เลือก Advisor
6. 🔄 Submit form
7. ⏳ ตรวจสอบผลลัพธ์ (success message, project created, modal closed)

## ผลลัพธ์ที่คาดหวัง

- Form validation ทำงานถูกต้อง
- Project ถูกสร้างใน backend
- Success message แสดง
- Modal ปิดอัตโนมัติ
- Project ปรากฏใน dashboard

---

**หมายเหตุ:** การทดสอบนี้จะตรวจสอบว่า Register Project feature ทำงานได้อย่างสมบูรณ์ตั้งแต่การกรอกข้อมูลจนถึงการ submit

