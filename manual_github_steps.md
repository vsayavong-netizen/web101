# คู่มือการอัปโหลด BM23 Project ไปยัง GitHub

## Repository ที่มีอยู่แล้ว
- **URL**: https://github.com/projectsouk-rgb/bm23.git
- **สถานะ**: Repository ว่างเปล่า (Empty)

## ขั้นตอนการอัปโหลด

### 1. ติดตั้ง Git (หากยังไม่ได้ติดตั้ง)
1. ไปที่ https://git-scm.com/download/win
2. ดาวน์โหลด Git for Windows
3. ติดตั้งโดยใช้การตั้งค่าเริ่มต้น
4. เปิด Command Prompt หรือ PowerShell ใหม่

### 2. รันสคริปต์อัตโนมัติ
```bash
# รันสคริปต์ที่เตรียมไว้
complete_github_setup.bat
```

### 3. หรือทำแบบ Manual

#### 3.1 ตั้งค่า Git
```bash
git config --global user.name "projectsouk"
git config --global user.email "projectsouk@gmail.com"
```

#### 3.2 เริ่มต้น Git Repository
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

#### 3.3 เชื่อมต่อกับ GitHub
```bash
# เพิ่ม remote origin
git remote add origin https://github.com/projectsouk-rgb/bm23.git

# เปลี่ยนชื่อ branch เป็น main
git branch -M main

# Push ไปยัง GitHub
git push -u origin main
```

## ไฟล์ที่สำคัญที่ถูกอัปโหลด

### Backend (Django)
- `backend/` - โค้ด Django backend ทั้งหมด
- `requirements.txt` - Python dependencies
- `manage.py` - Django management script
- `settings/` - Django settings

### Frontend (React)
- `frontend/` - โค้ด React frontend ทั้งหมด
- `package.json` - Node.js dependencies
- `vite.config.ts` - Vite configuration

### เอกสาร
- `README.md` - เอกสารโปรเจ็กต์
- `DEPLOYMENT_GUIDE.md` - คู่มือการ deploy
- `DEVELOPMENT_GUIDE.md` - คู่มือการพัฒนา
- `USER_MANUAL.md` - คู่มือผู้ใช้

### การตั้งค่า
- `.gitignore` - ไฟล์ที่ไม่ต้องอัปโหลด
- `Dockerfile` - สำหรับ Docker
- `docker-compose.yml` - Docker Compose configuration

## หลังจากอัปโหลดเสร็จ

### 1. ตรวจสอบบน GitHub
- ไปที่ https://github.com/projectsouk-rgb/bm23.git
- ตรวจสอบว่าไฟล์ทั้งหมดถูกอัปโหลดแล้ว
- ตรวจสอบ README.md แสดงผลถูกต้อง

### 2. การทำงานในอนาคต
```bash
# เมื่อมีการเปลี่ยนแปลง
git add .
git commit -m "Description of changes"
git push origin main
```

### 3. การ Clone บนเครื่องอื่น
```bash
git clone https://github.com/projectsouk-rgb/bm23.git
cd bm23
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
git pull origin main
# แก้ไข conflict
git add .
git commit -m "Resolve merge conflict"
git push origin main
```

## ข้อมูลโปรเจ็กต์

- **ชื่อ**: BM23 Project
- **ประเภท**: ระบบจัดการโปรเจ็กต์วิทยานิพนธ์
- **เทคโนโลยี**: Django + React + TypeScript
- **Email**: projectsouk@gmail.com
- **GitHub**: https://github.com/projectsouk-rgb/bm23.git
