# 🔒 WebSocket Production Setup Guide

**วันที่อัพเดท**: 10 พฤศจิกายน 2025

---

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. **Frontend Integration Testing**
- ✅ สร้าง integration tests สำหรับ WebSocket client
- ✅ Tests ครอบคลุม: connection, messages, reconnection, events

### 2. **Production Configuration**
- ✅ Rate limiting middleware (`websocket_rate_limit.py`)
- ✅ Monitoring middleware (`websocket_monitoring.py`)
- ✅ Production ASGI config (`asgi_production.py`)

### 3. **Monitoring Setup**
- ✅ WebSocket metrics collector (`websocket_metrics.py`)
- ✅ Monitoring API endpoints
- ✅ Real-time metrics tracking

---

## 🔧 Production Configuration

### 1. **Rate Limiting**

#### Features
- **Connection Rate Limit**: Max 10 reconnection attempts per hour per IP
- **Concurrent Connections**: Max 5 concurrent connections per IP
- **Message Rate Limit**: Configurable (default: 60 messages/minute)

#### Configuration
```python
# backend/core/middleware/websocket_rate_limit.py

MAX_CONNECTIONS_PER_IP = 5
MAX_MESSAGES_PER_MINUTE = 60
MAX_RECONNECT_ATTEMPTS = 10
RATE_LIMIT_WINDOW = 60  # seconds
```

#### Usage
```python
# In asgi_production.py
from core.middleware.websocket_rate_limit import WebSocketRateLimitMiddlewareStack

application = ProtocolTypeRouter({
    "websocket": WebSocketRateLimitMiddlewareStack(
        # ... other middleware
    ),
})
```

### 2. **Monitoring**

#### Metrics Tracked
- Active connections count
- Total connections today
- Messages sent/received
- Average connection duration
- Messages per minute

#### API Endpoints
```
GET /api/monitoring/websocket/metrics/
GET /api/monitoring/websocket/active-connections/
```

#### Usage
```python
from system_monitoring.websocket_metrics import WebSocketMetrics

# Get all metrics
metrics = WebSocketMetrics.get_metrics_summary()

# Get specific metric
active_connections = WebSocketMetrics.get_active_connections()
```

### 3. **Production ASGI Configuration**

#### File: `backend/final_project_management/asgi_production.py`

```python
application = ProtocolTypeRouter({
    "websocket": AllowedHostsOriginValidator(
        WebSocketRateLimitMiddlewareStack(  # Rate limiting
            WebSocketMonitoringMiddlewareStack(  # Monitoring
                JWTAuthMiddlewareStack(  # Authentication
                    URLRouter(websocket_urlpatterns)
                )
            )
        )
    ),
})
```

#### Middleware Stack Order
1. **AllowedHostsOriginValidator** - Origin validation
2. **WebSocketRateLimitMiddlewareStack** - Rate limiting
3. **WebSocketMonitoringMiddlewareStack** - Monitoring
4. **JWTAuthMiddlewareStack** - Authentication
5. **URLRouter** - Routing

---

## 🚀 Deployment Steps

### 1. **Update ASGI Configuration**

#### Option A: Use Production ASGI (Recommended)
```bash
# Update your ASGI application to use asgi_production.py
# Or merge the middleware into asgi.py
```

#### Option B: Update Existing ASGI
```python
# backend/final_project_management/asgi.py
from core.middleware.websocket_rate_limit import WebSocketRateLimitMiddlewareStack
from core.middleware.websocket_monitoring import WebSocketMonitoringMiddlewareStack

application = ProtocolTypeRouter({
    "websocket": AllowedHostsOriginValidator(
        WebSocketRateLimitMiddlewareStack(
            WebSocketMonitoringMiddlewareStack(
                JWTAuthMiddlewareStack(
                    URLRouter(websocket_urlpatterns)
                )
            )
        )
    ),
})
```

### 2. **Configure Rate Limits**

Edit `backend/core/middleware/websocket_rate_limit.py`:
```python
MAX_CONNECTIONS_PER_IP = 5  # Adjust based on your needs
MAX_MESSAGES_PER_MINUTE = 60  # Adjust based on your needs
MAX_RECONNECT_ATTEMPTS = 10  # Adjust based on your needs
```

### 3. **Enable Monitoring**

Monitoring is automatically enabled when using `WebSocketMonitoringMiddlewareStack`.

### 4. **Test Configuration**

```bash
# Test rate limiting
# Try connecting more than MAX_CONNECTIONS_PER_IP times from same IP

# Test monitoring
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/monitoring/websocket/metrics/
```

---

## 📊 Monitoring Dashboard

### Access Metrics

#### Get All Metrics
```bash
GET /api/monitoring/websocket/metrics/
Authorization: Bearer <admin_token>

Response:
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

#### Get Active Connections
```bash
GET /api/monitoring/websocket/active-connections/
Authorization: Bearer <admin_token>

Response:
{
  "active_connections": 5
}
```

---

## 🔒 Security Considerations

### 1. **Rate Limiting**
- Prevents DoS attacks
- Limits resource consumption
- Protects against connection flooding

### 2. **Origin Validation**
- Only allows connections from allowed hosts
- Prevents unauthorized access
- Configured in `ALLOWED_HOSTS`

### 3. **Authentication**
- All connections require valid JWT token
- Token validated on every connection
- Anonymous connections rejected

### 4. **Monitoring**
- Track suspicious activity
- Monitor resource usage
- Alert on anomalies

---

## 📈 Performance Tuning

### 1. **Connection Limits**
```python
# Adjust based on server capacity
MAX_CONNECTIONS_PER_IP = 5  # Increase for higher capacity
```

### 2. **Message Rate Limits**
```python
# Adjust based on message frequency
MAX_MESSAGES_PER_MINUTE = 60  # Increase for higher throughput
```

### 3. **Cache Configuration**
- Metrics use Django cache
- Ensure Redis/Memcached is configured
- Adjust TTL based on needs

---

## 🧪 Testing

### 1. **Test Rate Limiting**
```python
# Test script
import asyncio
from channels.testing import WebsocketCommunicator
from final_project_management.asgi_production import application

async def test_rate_limit():
    # Try to connect more than MAX_CONNECTIONS_PER_IP times
    for i in range(10):
        communicator = WebsocketCommunicator(
            application,
            f'/ws/notifications/?token=test_token'
        )
        connected, _ = await communicator.connect()
        print(f"Connection {i+1}: {'Connected' if connected else 'Rejected'}")
```

### 2. **Test Monitoring**
```python
from system_monitoring.websocket_metrics import WebSocketMetrics

# Get metrics
metrics = WebSocketMetrics.get_metrics_summary()
print(metrics)
```

---

## 📝 Configuration Files

### Files Created/Modified
1. `backend/core/middleware/websocket_rate_limit.py` - Rate limiting
2. `backend/core/middleware/websocket_monitoring.py` - Monitoring
3. `backend/system_monitoring/websocket_metrics.py` - Metrics utilities
4. `backend/system_monitoring/views_websocket.py` - Monitoring API
5. `backend/final_project_management/asgi_production.py` - Production ASGI
6. `backend/system_monitoring/urls.py` - Updated with WebSocket endpoints
7. `frontend/src/__tests__/websocket.integration.test.ts` - Frontend tests

---

## 🎯 Next Steps

1. **Deploy to Production**
   - Update ASGI configuration
   - Configure rate limits
   - Enable monitoring

2. **Set Up Alerts**
   - Alert on high connection count
   - Alert on rate limit violations
   - Alert on errors

3. **Monitor Performance**
   - Track metrics regularly
   - Adjust limits as needed
   - Optimize based on data

---

**Last Updated**: November 10, 2025

