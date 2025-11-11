# 📊 System Monitoring & Logging Guide

## 📋 Overview

ระบบ Monitoring และ Logging ที่ครอบคลุมสำหรับ Final Project Management System

---

## 🎯 Features

### 1. Health Check
- ✅ Database connectivity check
- ✅ Cache status check
- ✅ Redis status check
- ✅ System metrics (CPU, Memory, Disk)
- ✅ Automatic health status determination

### 2. Request Logging
- ✅ All API requests logged
- ✅ Response time tracking
- ✅ Status code tracking
- ✅ User activity tracking
- ✅ IP address logging

### 3. Performance Monitoring
- ✅ Response time metrics
- ✅ Database query tracking
- ✅ Cache hit/miss tracking
- ✅ Slow request detection
- ✅ High query count warnings

### 4. Error Logging
- ✅ Exception tracking
- ✅ Error level classification
- ✅ Traceback storage
- ✅ Error resolution tracking

### 5. System Metrics
- ✅ Request count
- ✅ Response time averages
- ✅ Error counts
- ✅ Active users
- ✅ Database query metrics

---

## 🏗️ Architecture

### Models

1. **SystemMetrics** - Store system performance metrics
2. **RequestLog** - Log all API requests
3. **ErrorLog** - Log errors and exceptions
4. **HealthCheck** - Store health check results
5. **PerformanceMetric** - Store detailed performance data

### Middleware

1. **PerformanceMonitoringMiddleware** - Monitor request performance
2. **ErrorLoggingMiddleware** - Log exceptions

---

## 🔌 API Endpoints

### Health Check (Public)

```http
GET /api/monitoring/health/
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T12:00:00Z",
  "checks": {
    "database": true,
    "cache": true,
    "redis": true
  },
  "system": {
    "disk_usage": 45.2,
    "memory_usage": 62.5,
    "cpu_usage": 35.8
  },
  "response_time_ms": 12.5
}
```

### System Metrics Summary (Admin Only)

```http
GET /api/monitoring/system-metrics/?hours=24
```

**Response:**
```json
{
  "period_hours": 24,
  "since": "2025-11-09T12:00:00Z",
  "metrics": {
    "request_count": {
      "count": 1250,
      "avg": 1.0,
      "min": 1.0,
      "max": 1.0
    },
    "response_time": {
      "count": 1250,
      "avg": 125.5,
      "min": 10.2,
      "max": 2500.0
    }
  },
  "requests": {
    "total_requests": 1250,
    "by_method": {
      "GET": 800,
      "POST": 300,
      "PUT": 100,
      "DELETE": 50
    },
    "by_status": {
      "200": 1000,
      "201": 200,
      "400": 30,
      "404": 20
    },
    "avg_response_time": 125.5
  },
  "errors": {
    "total_errors": 5,
    "by_level": {
      "ERROR": 3,
      "WARNING": 2
    }
  }
}
```

### ViewSets (Admin Only)

- `GET /api/monitoring/metrics/` - List system metrics
- `GET /api/monitoring/request-logs/` - List request logs
- `GET /api/monitoring/error-logs/` - List error logs
- `GET /api/monitoring/performance/` - List performance metrics
- `GET /api/monitoring/health-history/` - List health check history

**Filtering:**
- `?metric_type=response_time`
- `?method=GET`
- `?status_code=200`
- `?level=ERROR`
- `?resolved=false`

**Search:**
- `?search=api/projects`

**Ordering:**
- `?ordering=-timestamp`
- `?ordering=response_time`

---

## 🛠️ Setup

### 1. Install Dependencies

```bash
pip install psutil
```

(Already included in `requirements.txt`)

### 2. Run Migrations

```bash
python manage.py migrate system_monitoring
```

### 3. Configure Middleware

Middleware is already configured in `settings.py`:
- `PerformanceMonitoringMiddleware`
- `ErrorLoggingMiddleware`

### 4. Access Monitoring

- **Health Check**: `GET /api/monitoring/health/` (Public)
- **Admin Dashboard**: Django Admin → System Monitoring
- **API**: `/api/monitoring/` (Admin only)

---

## 📊 Usage Examples

### Example 1: Health Check

```bash
curl http://localhost:8000/api/monitoring/health/
```

### Example 2: Get System Metrics (Admin)

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/monitoring/system-metrics/?hours=24
```

### Example 3: Get Request Logs (Admin)

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/monitoring/request-logs/?method=POST&ordering=-timestamp"
```

### Example 4: Get Error Logs (Admin)

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/monitoring/error-logs/?resolved=false&level=ERROR"
```

---

## 🔍 Monitoring Dashboard

### Django Admin

1. Login to Django Admin
2. Navigate to "System Monitoring"
3. View:
   - System Metrics
   - Request Logs
   - Error Logs
   - Health Checks
   - Performance Metrics

### Features:
- Filter by date, type, status
- Search functionality
- Export data
- Mark errors as resolved

---

## 📈 Metrics Collected

### Request Metrics
- Total requests
- Requests by method (GET, POST, PUT, DELETE)
- Requests by status code
- Average response time
- Slow requests (>1 second)
- High query count requests (>20 queries)

### System Metrics
- Request count
- Response time
- Error count
- Active users
- Database queries
- Memory usage
- CPU usage

### Performance Metrics
- Response time per endpoint
- Database query time
- Query count per request
- Cache hits/misses

---

## 🚨 Alerts & Warnings

### Automatic Warnings

1. **Slow Requests** (>1 second)
   - Logged as warning
   - Tracked in PerformanceMetric

2. **High Query Count** (>20 queries)
   - Logged as warning
   - Tracked in PerformanceMetric

3. **System Degradation**
   - Disk usage >90%
   - Memory usage >90%
   - CPU usage >90%

### Error Tracking

- All exceptions automatically logged
- Error level classification
- Traceback storage
- Resolution tracking

---

## 🔧 Configuration

### Logging Levels

Configured in `settings.py`:
- **DEBUG**: Development mode
- **INFO**: Production mode
- **ERROR**: Error logs only

### Retention

- **Request Logs**: Keep for 30 days (configurable)
- **Error Logs**: Keep until resolved
- **Metrics**: Keep for 90 days (configurable)
- **Health Checks**: Keep for 7 days (configurable)

### Performance Impact

- Minimal overhead (<5ms per request)
- Async logging (non-blocking)
- Database indexes for fast queries
- Automatic cleanup of old data

---

## 📝 Best Practices

### 1. Regular Monitoring
- Check health endpoint daily
- Review error logs weekly
- Analyze performance metrics monthly

### 2. Error Resolution
- Mark errors as resolved when fixed
- Add notes in error details
- Track resolution time

### 3. Performance Optimization
- Identify slow endpoints
- Optimize high query count requests
- Monitor cache hit rates

### 4. Capacity Planning
- Monitor disk usage
- Track memory trends
- Plan for growth

---

## 🔐 Security

### Access Control
- Health check: Public (for monitoring tools)
- All other endpoints: Admin only
- JWT authentication required

### Data Privacy
- IP addresses logged (for security)
- User activity tracked (for auditing)
- No sensitive data in logs

---

## 🧪 Testing

### Test Health Check

```bash
python manage.py test system_monitoring
```

### Manual Testing

1. Make API requests
2. Check request logs in admin
3. Verify metrics collection
4. Test error logging

---

## 📚 Related Documentation

- [Django Logging](https://docs.djangoproject.com/en/stable/topics/logging/)
- [Django Middleware](https://docs.djangoproject.com/en/stable/topics/http/middleware/)
- [psutil Documentation](https://psutil.readthedocs.io/)

---

## 🚀 Future Enhancements

1. **Real-time Dashboard** - WebSocket updates
2. **Alerting System** - Email/SMS notifications
3. **Custom Metrics** - Application-specific metrics
4. **Export Reports** - PDF/CSV exports
5. **Integration** - Prometheus, Grafana, etc.

---

**Status**: ✅ **Production Ready**

**Last Updated**: November 10, 2025

