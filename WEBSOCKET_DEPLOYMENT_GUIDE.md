# 🚀 WebSocket Deployment Guide

**วันที่อัพเดท**: 10 พฤศจิกายน 2025

---

## 📋 Pre-Deployment Checklist

- [x] Rate limiting middleware created
- [x] Monitoring middleware created
- [x] Metrics utilities created
- [x] API endpoints created
- [x] ASGI configuration updated
- [x] Tests created
- [x] Documentation created

---

## 🔧 Deployment Steps

### Step 1: Update Environment Variables

Add to your `.env` or environment configuration:

```bash
# Enable production WebSocket middleware
USE_PRODUCTION_WEBSOCKET_MIDDLEWARE=true

# Or rely on DEBUG setting
DEBUG=false
```

### Step 2: Verify Configuration

Run deployment check script:

```bash
cd backend
python scripts/deploy_websocket_production.py
```

Expected output:
```
✅ Rate limiting middleware: Available
✅ Monitoring middleware: Available
✅ Cache configuration: Working
✅ Production middleware will be used
```

### Step 3: Test WebSocket Connection

Run test script:

```bash
cd backend
python scripts/test_websocket_production.py
```

Expected output:
```
✅ WebSocket connection: SUCCESS
✅ Received message
✅ Metrics collection: WORKING
✅ All tests passed!
```

### Step 4: Restart Application

Restart your ASGI server (Daphne, Uvicorn, etc.):

```bash
# If using systemd
sudo systemctl restart your-app.service

# If using supervisor
supervisorctl restart your-app

# If using Docker
docker-compose restart web
```

---

## 🔍 Verification

### 1. Check Active Connections

```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://your-domain.com/api/monitoring/websocket/active-connections/
```

### 2. Check All Metrics

```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://your-domain.com/api/monitoring/websocket/metrics/
```

### 3. Test WebSocket Connection

Use browser console or WebSocket client:

```javascript
const token = localStorage.getItem('auth_token');
const ws = new WebSocket(`wss://your-domain.com/ws/notifications/?token=${token}`);

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
ws.onerror = (error) => console.error('Error:', error);
```

---

## 📊 Monitoring

### Metrics Endpoints

1. **Active Connections**
   ```
   GET /api/monitoring/websocket/active-connections/
   ```

2. **All Metrics**
   ```
   GET /api/monitoring/websocket/metrics/
   ```

### Metrics Response

```json
{
  "active_connections": 5,
  "connections_today": 150,
  "messages_sent": 1250,
  "messages_received": 980,
  "avg_connection_duration": 45.32,
  "messages_per_minute": 12,
  "timestamp": "2025-11-10T12:00:00Z"
}
```

---

## 🔒 Security Configuration

### Rate Limiting Settings

Edit `backend/core/middleware/websocket_rate_limit.py`:

```python
MAX_CONNECTIONS_PER_IP = 5  # Adjust based on needs
MAX_MESSAGES_PER_MINUTE = 60  # Adjust based on needs
MAX_RECONNECT_ATTEMPTS = 10  # Adjust based on needs
```

### Origin Validation

Ensure `ALLOWED_HOSTS` is configured in settings:

```python
ALLOWED_HOSTS = [
    'your-domain.com',
    'www.your-domain.com',
]
```

---

## 🐛 Troubleshooting

### Issue: Rate Limiting Too Strict

**Solution**: Increase limits in `websocket_rate_limit.py`

### Issue: Metrics Not Updating

**Solution**: 
1. Check cache configuration
2. Verify Redis/Memcached is running
3. Check middleware is enabled

### Issue: Connection Fails

**Solution**:
1. Check token is valid
2. Verify origin is in ALLOWED_HOSTS
3. Check rate limits not exceeded
4. Review server logs

### Issue: Middleware Not Loading

**Solution**:
1. Verify `USE_PRODUCTION_WEBSOCKET_MIDDLEWARE=true`
2. Check imports in `asgi.py`
3. Restart ASGI server

---

## 📈 Performance Tuning

### Connection Limits

```python
# For high-traffic servers
MAX_CONNECTIONS_PER_IP = 10
MAX_MESSAGES_PER_MINUTE = 120
```

### Cache Configuration

Ensure Redis is properly configured for metrics storage.

### Monitoring Overhead

Monitoring adds minimal overhead. If needed, disable in development:

```python
USE_PRODUCTION_WEBSOCKET_MIDDLEWARE=false
```

---

## 🔄 Rollback Procedure

If issues occur, rollback by:

1. Set environment variable:
   ```bash
   USE_PRODUCTION_WEBSOCKET_MIDDLEWARE=false
   ```

2. Restart application

3. Or revert to previous ASGI configuration

---

## 📝 Post-Deployment

### Monitor Metrics

- Check active connections regularly
- Monitor message rates
- Watch for rate limit violations
- Track connection durations

### Set Up Alerts

- Alert on high connection count
- Alert on rate limit violations
- Alert on errors

### Regular Maintenance

- Review metrics weekly
- Adjust rate limits as needed
- Clean up old metrics data
- Update documentation

---

## ✅ Success Criteria

Deployment is successful when:

- [x] WebSocket connections work
- [x] Rate limiting is active
- [x] Monitoring is collecting data
- [x] Metrics endpoints return data
- [x] No errors in logs
- [x] Performance is acceptable

---

**Last Updated**: November 10, 2025

