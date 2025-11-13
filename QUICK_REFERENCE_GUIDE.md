# 📖 Quick Reference Guide - BM23 System

**วันที่สร้าง**: 2025-01-27  
**Purpose**: Quick reference for developers and administrators

---

## 🚀 Quick Start

### Installation
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser

# Frontend
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm run build
```

---

## 📁 Key Files

### Documentation
- `DEEP_STUDY_REPORT.md` - Complete system analysis
- `TEST_REPORT.md` - Test coverage and results
- `NEXT_STEPS_ROADMAP.md` - Implementation roadmap
- `SECURITY_AUDIT_CHECKLIST.md` - Security checklist

### Configuration
- `.github/workflows/ci.yml` - CI/CD pipeline
- `.pre-commit-config.yaml` - Pre-commit hooks
- `backend/.env.example` - Environment variables template

### Important Code
- `backend/final_project_management/settings.py` - Django settings
- `backend/final_project_management/env_validation.py` - Environment validation
- `frontend/package.json` - Frontend dependencies
- `frontend/App.tsx` - Main React app

---

## 🔧 Common Commands

### Backend
```bash
# Run server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
pytest tests/ -v

# Check security
safety check
bandit -r .
```

### Frontend
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Check security
npm audit

# Type check
npx tsc --noEmit
```

### Pre-commit
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

---

## 🔒 Security

### Environment Variables
Required:
- `SECRET_KEY` - Django secret key
- `DATABASE_URL` - Database connection string

Recommended:
- `GEMINI_API_KEY` - AI services
- `REDIS_URL` - Cache and task queue
- `ALLOWED_HOSTS` - Allowed hosts

### Security Checks
```bash
# Python dependencies
cd backend && safety check

# Node.js dependencies
cd frontend && npm audit

# Code security
cd backend && bandit -r .
```

---

## 📊 System Statistics

- **Total Files**: 600+ files
- **Lines of Code**: 50,000+ lines
- **Test Functions**: 338 tests
- **API Endpoints**: 50+ endpoints
- **Database Tables**: 30+ tables
- **React Components**: 97 components
- **Django Apps**: 19 apps

---

## 🎯 Key Features

### User Management
- 4 roles: Admin, DepartmentAdmin, Advisor, Student
- JWT authentication
- Role-based access control

### Project Management
- Project creation and tracking
- Milestone management
- Committee assignment
- Defense scheduling

### AI Features
- 9 AI-powered features
- Plagiarism detection
- Grammar check
- Advisor suggestions
- Security audit

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/token/refresh/` - Refresh token

### Projects
- `GET /api/projects/` - List projects
- `POST /api/projects/` - Create project
- `GET /api/projects/{id}/` - Get project
- `PATCH /api/projects/{id}/` - Update project

### Students
- `GET /api/students/` - List students
- `POST /api/students/` - Create student
- `GET /api/students/{id}/` - Get student

### Advisors
- `GET /api/advisors/` - List advisors
- `POST /api/advisors/` - Create advisor

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
# Check database settings
python manage.py dbshell

# Reset database (development only)
python manage.py flush
```

#### Migration Issues
```bash
# Show migration status
python manage.py showmigrations

# Fake migration
python manage.py migrate --fake
```

#### Frontend Build Errors
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

---

## 📝 Code Style

### Python
- Use Black for formatting
- Use isort for import sorting
- Follow PEP 8
- Maximum line length: 100

### TypeScript
- Use ESLint
- Use Prettier
- Follow TypeScript best practices
- Maximum line length: 100

---

## 🔍 Useful Commands

### Find TODOs
```bash
grep -r "TODO" backend/ frontend/ --include="*.py" --include="*.ts" --include="*.tsx"
```

### Find FIXMEs
```bash
grep -r "FIXME" backend/ frontend/ --include="*.py" --include="*.ts" --include="*.tsx"
```

### Count Lines of Code
```bash
find backend -name "*.py" | xargs wc -l
find frontend -name "*.ts" -o -name "*.tsx" | xargs wc -l
```

---

## 📚 Documentation Links

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Material-UI Documentation](https://mui.com/)

---

## 🆘 Support

### Getting Help
1. Check documentation files
2. Review code comments
3. Check test files for examples
4. Review API documentation at `/api/docs/`

### Reporting Issues
1. Check existing issues
2. Create detailed bug report
3. Include error logs
4. Provide reproduction steps

---

**Last Updated**: 2025-01-27  
**Version**: 1.0.0

---

*เอกสารนี้เป็น quick reference guide สำหรับระบบ BM23*
