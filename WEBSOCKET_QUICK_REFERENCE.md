# 📚 WebSocket Quick Reference Guide

**วันที่อัพเดท**: 10 พฤศจิกายน 2025

---

## 🚀 Quick Start

### Enable Production Mode
```bash
export USE_PRODUCTION_WEBSOCKET_MIDDLEWARE=true
```

### Deploy
```bash
cd backend
python scripts/deploy_websocket_production.py
```

### Test
```bash
python scripts/test_websocket_production.py
```

---

## 📡 WebSocket Endpoints

### Notifications
```
ws://your-domain.com/ws/notifications/?token={jwt_token}
```

### Projects
```
ws://your-domain.com/ws/projects/{project_id}/?token={jwt_token}
```

### Collaboration
```
ws://your-domain.com/ws/collaboration/{room_name}/?token={jwt_token}
```

### System Health
```
ws://your-domain.com/ws/system-health/?token={jwt_token}
```

---

## 🔍 Monitoring Endpoints

### Get All Metrics
```bash
GET /api/monitoring/websocket/metrics/
Authorization: Bearer <admin_token>
```

### Get Active Connections
```bash
GET /api/monitoring/websocket/active-connections/
Authorization: Bearer <admin_token>
```

---

## 🔧 Configuration

### Rate Limiting
**File**: `backend/core/middleware/websocket_rate_limit.py`

```python
MAX_CONNECTIONS_PER_IP = 5
MAX_MESSAGES_PER_MINUTE = 60
MAX_RECONNECT_ATTEMPTS = 10
```

### Environment Variables
```bash
USE_PRODUCTION_WEBSOCKET_MIDDLEWARE=true  # Enable production middleware
DEBUG=false  # Production mode
```

---

## 🧪 Testing

### Run All Tests
```bash
python manage.py test tests.test_websocket --settings=test_settings
```

### Run Specific Test Class
```bash
python manage.py test tests.test_websocket.WebSocketAuthenticationMiddlewareTestCase
```

---

## 📊 Metrics

### Available Metrics
- `active_connections` - Current active connections
- `connections_today` - Total connections today
- `messages_sent` - Total messages sent
- `messages_received` - Total messages received
- `avg_connection_duration` - Average connection time
- `messages_per_minute` - Current messages/min

---

## 🔒 Security

### Authentication
- JWT token required
- Token in query string: `?token={jwt_token}`
- Token in header: `Authorization: Bearer {token}`

### Rate Limiting
- Max 5 concurrent connections per IP
- Max 10 reconnections per hour per IP
- Max 60 messages per minute

### Origin Validation
- Only allowed hosts can connect
- Configure in `ALLOWED_HOSTS`

---

## 🐛 Troubleshooting

### Connection Fails
1. Check token is valid
2. Verify origin in ALLOWED_HOSTS
3. Check rate limits not exceeded
4. Review server logs

### Metrics Not Updating
1. Check cache configuration
2. Verify Redis/Memcached running
3. Check middleware enabled

### Rate Limit Too Strict
1. Edit `websocket_rate_limit.py`
2. Increase limits
3. Restart server

---

## 📝 Files Reference

### Backend
- `backend/core/middleware/websocket_auth.py` - Authentication
- `backend/core/middleware/websocket_rate_limit.py` - Rate limiting
- `backend/core/middleware/websocket_monitoring.py` - Monitoring
- `backend/final_project_management/asgi.py` - ASGI config
- `backend/system_monitoring/websocket_metrics.py` - Metrics

### Frontend
- `frontend/utils/websocketClient.ts` - WebSocket client
- `frontend/hooks/useNotifications.ts` - Notifications hook

### Scripts
- `backend/scripts/deploy_websocket_production.py` - Deployment check
- `backend/scripts/test_websocket_production.py` - Connection test

---

## 📚 Documentation

1. `WEBSOCKET_AUTH_TEST_RESULTS.md` - Test results
2. `WEBSOCKET_PRODUCTION_SETUP.md` - Production setup
3. `WEBSOCKET_DEPLOYMENT_GUIDE.md` - Deployment guide
4. `WEBSOCKET_DEPLOYMENT_VERIFICATION.md` - Verification results
5. `WEBSOCKET_FINAL_SUMMARY.md` - Complete summary

---

**Last Updated**: November 10, 2025

