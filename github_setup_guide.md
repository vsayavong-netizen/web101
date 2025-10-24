# คู่มือการอัปโหลดโปรเจ็กต์ไปยัง GitHub

## ขั้นตอนที่ 1: ติดตั้ง Git

1. ไปที่ https://git-scm.com/download/win
2. ดาวน์โหลด Git for Windows
3. ติดตั้งโดยใช้การตั้งค่าเริ่มต้น
4. เปิด Command Prompt หรือ PowerShell ใหม่

## ขั้นตอนที่ 2: ตั้งค่า Git

รันคำสั่งต่อไปนี้ใน Command Prompt:

```bash
git config --global user.name "projectsouk"
git config --global user.email "projectsouk@gmail.com"
```

## ขั้นตอนที่ 3: เริ่มต้น Git Repository

```bash
# ไปที่โฟลเดอร์โปรเจ็กต์
cd C:\bm23

# เริ่มต้น Git repository
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# สร้าง commit แรก
git commit -m "Initial commit: BM23 Project Setup"
```

## ขั้นตอนที่ 4: สร้าง GitHub Repository

1. เข้าสู่ https://github.com
2. เข้าสู่ระบบด้วยบัญชี projectsouk@gmail.com
3. คลิก "New repository"
4. ตั้งชื่อ repository เช่น "bm23-project"
5. เลือก "Public" หรือ "Private"
6. **อย่า** เลือก "Initialize with README" (เพราะเรามีไฟล์อยู่แล้ว)
7. คลิก "Create repository"

## ขั้นตอนที่ 5: เชื่อมต่อกับ GitHub

```bash
# เพิ่ม remote origin (แทนที่ [repository-name] ด้วยชื่อ repository ที่สร้าง)
git remote add origin https://github.com/projectsouk/[repository-name].git

# เปลี่ยนชื่อ branch เป็น main
git branch -M main

# Push ไปยัง GitHub
git push -u origin main
```

## ขั้นตอนที่ 6: ตรวจสอบผลลัพธ์

1. ไปที่ GitHub repository ที่สร้าง
2. ตรวจสอบว่าไฟล์ทั้งหมดถูกอัปโหลดแล้ว
3. ตรวจสอบ README.md แสดงผลถูกต้อง

## การอัปเดตในอนาคต

เมื่อมีการเปลี่ยนแปลงโค้ด:

```bash
# เพิ่มไฟล์ที่เปลี่ยนแปลง
git add .

# สร้าง commit
git commit -m "Description of changes"

# Push ไปยัง GitHub
git push origin main
```

## การทำงานร่วมกัน

หากมีคนอื่นร่วมพัฒนา:

```bash
# ดึงการเปลี่ยนแปลงล่าสุด
git pull origin main

# สร้าง branch ใหม่สำหรับ feature
git checkout -b feature/new-feature

# ทำงานใน branch นี้
# ... ทำการเปลี่ยนแปลง ...

# Commit และ push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# สร้าง Pull Request บน GitHub
```

## การแก้ไขปัญหา

### หาก Git ไม่ทำงาน
- ตรวจสอบว่า Git ติดตั้งแล้ว
- เปิด Command Prompt ใหม่
- ตรวจสอบ path ของ Git

### หาก push ไม่สำเร็จ
- ตรวจสอบ username และ password
- ใช้ Personal Access Token แทน password
- ตรวจสอบ URL ของ repository

### หากมี conflict
```bash
# ดึงการเปลี่ยนแปลงล่าสุด
git pull origin main

# แก้ไข conflict ในไฟล์
# ... แก้ไขไฟล์ที่มี conflict ...

# เพิ่มไฟล์ที่แก้ไขแล้ว
git add .

# Commit
git commit -m "Resolve merge conflict"

# Push
git push origin main
```
