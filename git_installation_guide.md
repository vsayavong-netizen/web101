# คู่มือการติดตั้ง Git และอัปโหลดโปรเจ็กต์ BM23

## ปัญหาปัจจุบัน
จากข้อมูลที่เห็น Git ยังไม่ได้ติดตั้งในระบบของคุณ ทำให้ไม่สามารถรันคำสั่ง Git ได้

## ขั้นตอนการแก้ไข

### 1. ติดตั้ง Git for Windows

#### วิธีที่ 1: ดาวน์โหลดจากเว็บไซต์
1. เปิดเว็บเบราว์เซอร์
2. ไปที่: https://git-scm.com/download/win
3. คลิก "Download for Windows"
4. รันไฟล์ที่ดาวน์โหลด
5. ติดตั้งโดยใช้การตั้งค่าเริ่มต้น (Default settings)
6. เปิด Command Prompt หรือ PowerShell ใหม่

#### วิธีที่ 2: ใช้ Chocolatey (หากมี)
```powershell
choco install git
```

#### วิธีที่ 3: ใช้ Winget (Windows 10/11)
```powershell
winget install Git.Git
```

### 2. ตรวจสอบการติดตั้ง
```bash
git --version
```

### 3. รันสคริปต์อัปโหลด
หลังจากติดตั้ง Git แล้ว:
```bash
install_git_and_upload.bat
```

## ขั้นตอนการอัปโหลดแบบ Manual

### 1. ตั้งค่า Git
```bash
git config --global user.name "projectsouk"
git config --global user.email "projectsouk@gmail.com"
```

### 2. เริ่มต้น Git Repository
```bash
# ไปที่โฟลเดอร์โปรเจ็กต์
cd C:\bm23

# เริ่มต้น Git repository
git init

# เพิ่มไฟล์ทั้งหมด
git add .

# สร้าง commit แรก
git commit -m "Initial commit: BM23 Project - Complete Django + React Application"
```

### 3. เชื่อมต่อกับ GitHub
```bash
# เพิ่ม remote origin
git remote add origin https://github.com/projectsouk-rgb/bm23.git

# เปลี่ยนชื่อ branch เป็น main
git branch -M main

# Push ไปยัง GitHub
git push -u origin main
```

## การแก้ไขปัญหา

### หาก Git ยังไม่ทำงานหลังจากติดตั้ง
1. เปิด Command Prompt หรือ PowerShell ใหม่
2. ตรวจสอบ PATH environment variable
3. รีสตาร์ทคอมพิวเตอร์

### หาก push ไม่สำเร็จ
1. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
2. ตรวจสอบ GitHub credentials
3. ใช้ Personal Access Token แทน password

### หากมี Authentication Error
```bash
# ใช้ Personal Access Token
git remote set-url origin https://projectsouk:YOUR_TOKEN@github.com/projectsouk-rgb/bm23.git
```

## ข้อมูล Repository
- **URL**: https://github.com/projectsouk-rgb/bm23.git
- **สถานะ**: Repository ว่างเปล่า (พร้อมรับโค้ด)
- **Owner**: projectsouk-rgb
- **Type**: Public repository

## ไฟล์ที่จะถูกอัปโหลด
- Backend Django application
- Frontend React application  
- Documentation files
- Configuration files
- Database files (ถ้ามี)

## หลังจากอัปโหลดเสร็จ
1. ตรวจสอบบน GitHub: https://github.com/projectsouk-rgb/bm23.git
2. ตรวจสอบว่าไฟล์ทั้งหมดถูกอัปโหลดแล้ว
3. ตรวจสอบ README.md แสดงผลถูกต้อง
4. สามารถ clone ไปยังเครื่องอื่นได้
