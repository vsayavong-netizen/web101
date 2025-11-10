# 🚀 Setup Guide - Final Project Management System

## 📋 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (optional, SQLite for development)
- Redis (optional, for caching)

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create `.env` file in `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `.env` with your configuration:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0

# Database Configuration
DB_ENGINE=django.db.backends.sqlite3
# For PostgreSQL: django.db.backends.postgresql
DB_NAME=db.sqlite3
# DB_USER=postgres
# DB_PASSWORD=your-password
# DB_HOST=localhost
# DB_PORT=5432

# API Configuration
API_BASE_URL=http://localhost:8000

# Redis Configuration (optional)
REDIS_URL=redis://127.0.0.1:6379/0

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173
```

### 3. Database Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 4. Run Backend Server

```bash
# Development
python manage.py runserver

# Or with custom port
python manage.py runserver 8000
```

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create `.env` file in `frontend/` directory:

```bash
cp frontend/.env.example frontend/.env
```

Edit `.env` with your configuration:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Debug Mode
VITE_DEBUG=true
VITE_DEV=true
```

### 3. Run Frontend Server

```bash
# Development
npm run dev

# Production build
npm run build
```

## 🔌 Connection Testing

### Test API Connection

```bash
cd backend
python scripts/test_api_connection.py
```

Expected output:
```
============================================================
API Connection Test
============================================================
Base URL: http://localhost:8000

Test 1: Health Check
✅ Health check passed

Test 2: API Schema
✅ API schema accessible

Test 3: Authentication
✅ Authentication successful

Test 4: Authenticated Request
✅ Authenticated request successful

Test 5: Token Refresh
✅ Token refresh successful

Test 6: CORS Configuration
✅ CORS configured

Test 7: Database Connection
✅ Database connection successful

============================================================
Test Complete
============================================================
```

## 🔐 Authentication Flow

### 1. Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "your_username",
    "email": "user@example.com",
    "role": "Admin"
  }
}
```

### 2. Use Access Token

```bash
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Refresh Token

```bash
curl -X POST http://localhost:8000/api/auth/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

## 🗄️ Database Configuration

### SQLite (Development - Default)

No additional setup required. Database file will be created at `backend/db.sqlite3`.

### PostgreSQL (Production)

1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE final_project_management;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE final_project_management TO your_user;
   ```

3. Update `.env`:
   ```env
   DB_ENGINE=django.db.backends.postgresql
   DB_NAME=final_project_management
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

4. Run migrations:
   ```bash
   python manage.py migrate
   ```

## 🔄 Redis Configuration (Optional)

### Install Redis

**Windows:**
```bash
# Download from https://redis.io/download
# Or use WSL
```

**Linux/Mac:**
```bash
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis  # Mac
```

### Start Redis

```bash
redis-server
```

### Update Configuration

```env
REDIS_URL=redis://127.0.0.1:6379/0
```

## 🌐 CORS Configuration

### Development

CORS is automatically configured for:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

### Production

Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in settings:

```python
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']
CORS_ALLOWED_ORIGINS = [
    'https://your-domain.com',
    'https://www.your-domain.com',
]
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### API Tests

```bash
cd backend
python scripts/test_api_connection.py
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🚀 Production Deployment

### Backend

1. Set environment variables:
   ```env
   DEBUG=False
   SECRET_KEY=<secure-random-key>
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ALLOWED_HOSTS=your-domain.com,www.your-domain.com
   ```

2. Collect static files:
   ```bash
   python manage.py collectstatic --noinput
   ```

3. Run with Gunicorn:
   ```bash
   gunicorn final_project_management.wsgi:application --bind 0.0.0.0:8000
   ```

### Frontend

1. Build for production:
   ```bash
   npm run build
   ```

2. Serve static files with Nginx or CDN

3. Update API base URL:
   ```env
   VITE_API_BASE_URL=https://api.your-domain.com
   ```

## 🔍 Troubleshooting

### Backend Issues

1. **Database Connection Error**
   - Check database credentials in `.env`
   - Ensure database server is running
   - Verify database exists

2. **CORS Errors**
   - Check `CORS_ALLOWED_ORIGINS` in settings
   - Verify frontend URL is in allowed origins
   - Check CORS middleware is enabled

3. **Authentication Errors**
   - Verify JWT tokens are valid
   - Check token expiration
   - Ensure user is active

### Frontend Issues

1. **API Connection Failed**
   - Check `VITE_API_BASE_URL` in `.env`
   - Verify backend server is running
   - Check browser console for errors

2. **CORS Errors**
   - Verify backend CORS configuration
   - Check proxy settings in `vite.config.ts`
   - Ensure correct API base URL

3. **Token Refresh Issues**
   - Check refresh token is stored
   - Verify token refresh endpoint
   - Check token expiration settings

## 📚 Additional Resources

- [Backend Architecture](./backend/BACKEND_ARCHITECTURE.md)
- [API Documentation](./backend/docs/API_DOCUMENTATION.md)
- [Backend Redesign Summary](./BACKEND_REDESIGN_SUMMARY.md)

## 🆘 Support

For issues or questions:
1. Check troubleshooting section
2. Review documentation
3. Check logs in `backend/logs/`
4. Run connection test script

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0

