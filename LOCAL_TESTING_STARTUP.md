# 🚀 Local Testing Startup Guide
## Final Project Management System - Ready to Test!

**Date**: October 24, 2025  
**Status**: ✅ **RUNNING LOCALLY**

---

## ✅ Setup Complete!

Your application is now configured for **local development and testing** with:

- ✅ **SQLite Database** (no external dependencies)
- ✅ **Admin Superuser Created**
- ✅ **Django Server Running**
- ✅ **All Migrations Applied**

---

## 🔑 Login Credentials

### Admin Account
```
Username: admin
Email: admin@localhost
Password: admin123
```

### URLs
- **Frontend**: http://localhost:3000 (when running `npm run dev` in frontend folder)
- **Backend API**: http://127.0.0.1:8000
- **Django Admin**: http://127.0.0.1:8000/admin
- **API Documentation**: http://127.0.0.1:8000/api/schema/swagger/

---

## 🎯 Quick Start

### Backend is Already Running! ✅

Server started on: **http://127.0.0.1:8000**

To verify it's working:
```bash
curl http://127.0.0.1:8000/
```

### Start Frontend (New Terminal)

```bash
cd frontend
npm install  # if needed
npm run dev
```

Frontend will run on: **http://localhost:5173** or **http://localhost:3000**

---

## 📝 Database Info

**Database Type**: SQLite  
**Database File**: `backend/db.sqlite3`  
**Location**: C:\web101\backend\db.sqlite3

### To Reset Database (Start Fresh)
```bash
cd backend
rm db.sqlite3                    # Delete existing database
py manage.py migrate            # Create new database
py manage.py shell              # Create superuser interactively
```

---

## 🧪 Test Everything

### Option A: Use Browser (Easy) ✅
1. Open http://127.0.0.1:8000/admin
2. Login with `admin` / `admin123`
3. Create test users and projects

### Option B: Use API (Advanced)

#### Get JWT Token
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"admin123"}'
```

#### Get Projects (with token)
```bash
curl -X GET http://127.0.0.1:8000/api/projects/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Option C: Use Testing Guide
Follow: `COMPREHENSIVE_TESTING_GUIDE.md`

---

## 🛑 To Stop the Server

Press: **CTRL + C** in the terminal where Django is running

---

## 📊 File Structure
```
C:\web101\
├── backend/
│   ├── db.sqlite3          ← SQLite database
│   ├── manage.py
│   ├── .env                ← LOCAL development config
│   └── final_project_management/
│
├── frontend/
│   ├── package.json
│   ├── src/
│   └── .env                ← Frontend config
│
└── Documentation/
    ├── PRODUCTION_DEPLOYMENT_GUIDE.md
    ├── COMPREHENSIVE_TESTING_GUIDE.md
    └── SECURITY_AUDIT_REPORT.md
```

---

## 🔄 Workflow

### Day-to-Day Development
```bash
# Terminal 1: Backend
cd backend
py manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Making Changes
- Edit Python files → Server auto-reloads
- Edit React files → Frontend auto-reloads
- Edit database → Use Django admin or shell

### Creating Test Data
```bash
cd backend
py manage.py shell

# In Python shell:
from accounts.models import User
user = User.objects.create_user(
    email='student@test.com',
    username='student01',
    password='pass123'
)
```

---

## 📚 Available Endpoints

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/profile/` - Get profile

### Users
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `GET /api/users/{id}/` - Get user
- `PATCH /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

### Projects
- `GET /api/projects/` - List projects
- `POST /api/projects/` - Create project
- `GET /api/projects/{id}/` - Get project
- `PATCH /api/projects/{id}/` - Update project

---

## 🆘 Troubleshooting

### Port 8000 Already in Use
```bash
# Find and kill process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Then restart Django
py manage.py runserver
```

### Database Issues
```bash
# Check database integrity
py manage.py check

# Reset database if needed
rm db.sqlite3
py manage.py migrate
```

### Frontend Not Loading
```bash
cd frontend
npm install     # Reinstall dependencies
npm run dev     # Start dev server
```

---

## 📋 Testing Checklist

Use this checklist while testing locally:

### Authentication
- [ ] Login with admin account
- [ ] Logout works
- [ ] Cannot access API without token
- [ ] Token refresh works

### User Management
- [ ] Create new user
- [ ] Edit user details
- [ ] Change user role
- [ ] Delete user

### Projects
- [ ] Create project
- [ ] View project list
- [ ] Edit project
- [ ] Add project comments
- [ ] Upload files

### Performance
- [ ] Pages load quickly
- [ ] API responses are fast
- [ ] No console errors
- [ ] No memory leaks

---

## 🎯 Next Steps

### After Testing Locally:

1. **Verify Everything Works**
   - [ ] All features tested
   - [ ] No errors in console
   - [ ] Database operations smooth

2. **Deploy to Production**
   - Follow: `PRODUCTION_DEPLOYMENT_GUIDE.md`
   - Choose: Render.com (easy) or VPS (control)
   - Set environment variables

3. **Run Full Test Suite**
   - Follow: `COMPREHENSIVE_TESTING_GUIDE.md`
   - Complete all 7 test phases
   - Document results

---

## 🔐 Security Notes

### This Configuration is for Development Only!

**NEVER use these settings in production:**
- ❌ `DEBUG=True`
- ❌ `SECRET_KEY=local-dev-key`
- ❌ `PASSWORD=admin123`
- ❌ `SECURE_SSL_REDIRECT=False`

For production, use: `backend/.env.production` template

---

## 📞 Useful Commands

```bash
# Backend Management
cd backend

# Run server
py manage.py runserver

# Open Django shell
py manage.py shell

# Collect static files
py manage.py collectstatic

# Check configuration
py manage.py check

# Create migrations
py manage.py makemigrations

# Apply migrations
py manage.py migrate

# Create superuser
py manage.py createsuperuser
```

```bash
# Frontend Management
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

---

## ✨ Happy Testing! 🎉

Your application is ready to test locally!

- Backend: **http://127.0.0.1:8000** ✅
- Admin: **admin** / **admin123** ✅
- Database: **SQLite** ✅

**Start Frontend**: `cd frontend && npm run dev`

---

**Last Updated**: October 24, 2025  
**Environment**: Local Development (SQLite)  
**Status**: ✅ Ready to Test

Good luck! 🚀

