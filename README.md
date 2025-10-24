# BM23 Project

ระบบจัดการโปรเจ็กต์วิทยานิพนธ์และโครงงานสำหรับมหาวิทยาลัย

## คุณสมบัติหลัก

- ระบบจัดการนักศึกษาและอาจารย์
- ระบบจัดการโปรเจ็กต์และวิทยานิพนธ์
- ระบบให้คะแนนและประเมินผล
- ระบบรายงานและสถิติ
- ระบบแจ้งเตือน
- ระบบไฟล์และเอกสาร

## เทคโนโลยีที่ใช้

### Backend
- Django 4.x
- Python 3.x
- SQLite/PostgreSQL
- Django REST Framework

### Frontend
- React 18.x
- TypeScript
- Vite
- Material-UI

## การติดตั้ง

### ข้อกำหนดระบบ
- Python 3.8+
- Node.js 16+
- Git

### Backend Setup
```bash
# สร้าง virtual environment
python -m venv venv

# เปิดใช้งาน virtual environment
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# ติดตั้ง dependencies
pip install -r requirements.txt

# รัน migrations
python manage.py migrate

# สร้าง superuser
python manage.py createsuperuser

# รันเซิร์ฟเวอร์
python manage.py runserver
```

### Frontend Setup
```bash
# ติดตั้ง dependencies
npm install

# รัน development server
npm run dev
```

## การใช้งาน

1. เข้าสู่ระบบด้วยบัญชีผู้ใช้
2. เลือกเมนูที่ต้องการใช้งาน
3. ตามขั้นตอนการทำงานของแต่ละฟีเจอร์

## การพัฒนา

### Git Workflow
```bash
# Clone repository
git clone https://github.com/projectsouk/bm23-project.git

# สร้าง branch ใหม่
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature
```

## การติดต่อ

- Email: projectsouk@gmail.com
- GitHub: https://github.com/projectsouk

## License

MIT License
