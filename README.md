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

## 📚 Documentation

### Comprehensive Documentation Suite
- **[Deep Study Report](DEEP_STUDY_REPORT.md)** - Complete system analysis
- **[Test Report](TEST_REPORT.md)** - Test coverage and results (338 tests)
- **[Next Steps Roadmap](NEXT_STEPS_ROADMAP.md)** - Implementation roadmap
- **[Security Audit Checklist](SECURITY_AUDIT_CHECKLIST.md)** - Security checklist
- **[Implementation Progress](IMPLEMENTATION_PROGRESS.md)** - Progress tracking
- **[Comprehensive Summary](COMPREHENSIVE_SUMMARY.md)** - Complete summary
- **[Final Implementation Report](FINAL_IMPLEMENTATION_REPORT.md)** - Final report
- **[Quick Reference Guide](QUICK_REFERENCE_GUIDE.md)** - Quick reference

### Key Statistics
- **600+ files** analyzed
- **50,000+ lines** of code
- **338 test functions** covering all features
- **50+ API endpoints** documented
- **19 Django apps** with comprehensive functionality
- **97 React components** with modern UI

## 🔧 Recent Improvements

### Code Quality ✅
- Fixed 4 TODOs in `backend/students/views.py`
- Pinned all frontend dependencies
- Added environment variable validation

### Infrastructure ✅
- CI/CD pipeline configured (`.github/workflows/ci.yml`)
- Pre-commit hooks setup (`.pre-commit-config.yaml`)
- Environment validation system

### Security ✅
- Dependencies pinned to specific versions
- Environment variable validation
- Security audit checklist created

## 🚀 Quick Start

### Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Backend tests
cd backend && pytest tests/ -v

# Frontend build
cd frontend && npm run build
```

### Security Checks
```bash
# Python dependencies
cd backend && pip install safety && safety check

# Node.js dependencies
cd frontend && npm audit
```

## การติดต่อ

- Email: projectsouk@gmail.com
- GitHub: https://github.com/projectsouk

## License

MIT License
