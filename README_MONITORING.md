# 📊 System Monitoring & Logging

## ✅ Status: Production Ready

ระบบ Monitoring & Logging ถูกสร้างและทดสอบเรียบร้อยแล้ว พร้อมใช้งาน!

---

## 🎯 Features

### 1. Health Check (Public)
- ตรวจสอบสถานะระบบ (Database, Cache, Redis)
- ตรวจสอบ System Resources (CPU, Memory, Disk)
- Endpoint: `GET /api/monitoring/health/`

### 2. Request Logging (Automatic)
- บันทึกทุก API request อัตโนมัติ
- เก็บข้อมูล: method, path, status, response time, user
- Endpoint: `GET /api/monitoring/request-logs/` (admin)

### 3. Error Logging (Automatic)
- บันทึกทุก error อัตโนมัติ
- เก็บข้อมูล: error message, traceback, user, path
- Endpoint: `GET /api/monitoring/error-logs/` (admin)

### 4. Performance Metrics (Automatic)
- เก็บข้อมูล performance ของแต่ละ request
- เก็บข้อมูล: response time, DB queries, cache hits/misses
- Endpoint: `GET /api/monitoring/performance/` (admin)

### 5. System Metrics
- เก็บข้อมูล system-wide metrics
- Endpoint: `GET /api/monitoring/system-metrics/` (admin)

---

## 🚀 Quick Start

### 1. Health Check (ไม่ต้อง login)
```bash
curl http://localhost:8000/api/monitoring/health/
```

### 2. View Logs (ต้อง login เป็น admin)
```bash
# Login first
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get token from response, then:
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/monitoring/request-logs/
```

### 3. Django Admin
- ไปที่: `http://localhost:8000/admin/`
- Login เป็น admin
- ดูข้อมูลใน **System Monitoring** section

---

## 📋 Available Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/monitoring/health/` | GET | Public | Health check |
| `/api/monitoring/system-metrics/` | GET | Admin | System metrics summary |
| `/api/monitoring/request-logs/` | GET | Admin | Request logs |
| `/api/monitoring/error-logs/` | GET | Admin | Error logs |
| `/api/monitoring/performance/` | GET | Admin | Performance metrics |
| `/api/monitoring/health-history/` | GET | Admin | Health check history |

---

## 🛠️ Maintenance

### Cleanup Old Data
```bash
python manage.py cleanup_monitoring_data --days=30
```

ลบข้อมูล monitoring ที่เก่ากว่า 30 วัน

---

## ✅ Test Results

**All Tests Passed: 10/10** ✅

- API Tests: 6/6 ✅
- Model Tests: 4/4 ✅

---

## 📊 What Gets Logged Automatically

### Every Request
- Timestamp
- User (if authenticated)
- Method (GET, POST, etc.)
- Path
- Status code
- Response time
- IP address

### Every Error
- Error message
- Full traceback
- User (if authenticated)
- Path
- Method
- Timestamp
- Resolved status

### Performance Data
- Response time
- Database query count
- Database query time
- Cache hits
- Cache misses

---

## 🔒 Security

- Health check: Public (no authentication)
- All other endpoints: Admin only
- Environment Protection: Allows API endpoints, blocks direct file access

---

## 📝 Files

### Models
- `SystemMetrics` - System-wide metrics
- `RequestLog` - Request logs
- `ErrorLog` - Error logs
- `HealthCheck` - Health check results
- `PerformanceMetric` - Performance data

### Middleware
- `PerformanceMonitoringMiddleware` - Auto log requests
- `ErrorLoggingMiddleware` - Auto log errors

---

## 🎉 Ready to Use!

ระบบพร้อมใช้งานแล้ว! ทุก request และ error จะถูกบันทึกอัตโนมัติ

---

**Last Updated**: November 10, 2025

