# 📊 Monitoring Setup Guide - BM23 System

**วันที่สร้าง**: 2025-01-27  
**Purpose**: Guide for setting up production monitoring

---

## 🎯 Overview

This guide covers setting up comprehensive monitoring for the BM23 system in production, including error tracking, performance monitoring, and system health checks.

---

## 🔧 Monitoring Tools

### 1. Sentry (Error Tracking)

#### Installation
```bash
# Backend
cd backend
pip install sentry-sdk

# Add to requirements.txt
echo "sentry-sdk==2.0.0" >> requirements.txt
```

#### Configuration
```python
# backend/final_project_management/settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

if not DEBUG:
    sentry_sdk.init(
        dsn=config('SENTRY_DSN', default=''),
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
        ],
        traces_sample_rate=1.0,
        send_default_pii=True,
        environment=config('ENVIRONMENT', default='production'),
    )
```

#### Environment Variables
```bash
SENTRY_DSN=your-sentry-dsn-here
ENVIRONMENT=production
```

### 2. Application Performance Monitoring (APM)

#### Option A: Sentry APM
```python
# Already included in Sentry setup above
# traces_sample_rate controls APM sampling
```

#### Option B: New Relic
```bash
pip install newrelic
```

```python
# settings.py
import newrelic.agent
newrelic.agent.initialize('newrelic.ini')
```

### 3. System Metrics

#### Using psutil (Already Installed)
```python
# backend/system_monitoring/views.py
import psutil

def get_system_metrics():
    return {
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_percent': psutil.disk_usage('/').percent,
    }
```

### 4. Log Aggregation

#### Option A: ELK Stack (Elasticsearch, Logstash, Kibana)
```bash
# Install Filebeat
wget https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.0.0-linux-x86_64.tar.gz
tar -xzf filebeat-8.0.0-linux-x86_64.tar.gz
```

#### Option B: CloudWatch (AWS)
```python
# Use boto3 for CloudWatch logs
pip install boto3
```

---

## 📊 Monitoring Dashboard

### 1. Health Check Endpoint

Already implemented at `/api/monitoring/health/`

```python
# backend/system_monitoring/views.py
def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'database': check_database(),
        'cache': check_cache(),
        'timestamp': timezone.now().isoformat(),
    })
```

### 2. Custom Dashboard

Create a React component for monitoring:

```typescript
// frontend/components/MonitoringDashboard.tsx
export const MonitoringDashboard: React.FC = () => {
  // Display system metrics
  // Show error rates
  // Display performance charts
  // Show recent errors
}
```

---

## 🚨 Alerting

### 1. Email Alerts

```python
# backend/system_monitoring/utils.py
from django.core.mail import send_mail

def send_alert(subject, message, severity='warning'):
    send_mail(
        subject=f'[{severity.upper()}] {subject}',
        message=message,
        from_email='alerts@bm23.com',
        recipient_list=['admin@bm23.com'],
        fail_silently=False,
    )
```

### 2. Slack Integration

```python
# backend/system_monitoring/utils.py
import requests

def send_slack_alert(message, channel='#alerts'):
    webhook_url = config('SLACK_WEBHOOK_URL')
    requests.post(webhook_url, json={
        'text': message,
        'channel': channel,
    })
```

### 3. PagerDuty Integration

```python
# For critical alerts
pip install pypd
```

---

## 📈 Metrics to Monitor

### Application Metrics
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (errors/second)
- Active users
- API endpoint performance

### System Metrics
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Database connections

### Business Metrics
- User registrations
- Project creations
- Milestone completions
- Login success rate
- Feature usage

---

## 🔍 Logging Configuration

### Enhanced Logging
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'error.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'sentry': {
            'level': 'ERROR',
            'class': 'sentry_sdk.integrations.logging.SentryHandler',
        },
    },
    'root': {
        'handlers': ['file', 'sentry'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['error_file', 'sentry'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
```

---

## 🎯 Monitoring Checklist

### Setup Checklist
- [ ] Install Sentry SDK
- [ ] Configure Sentry DSN
- [ ] Set up APM
- [ ] Configure log aggregation
- [ ] Set up alerting (email/Slack)
- [ ] Create monitoring dashboard
- [ ] Set up health check monitoring
- [ ] Configure log rotation
- [ ] Set up backup monitoring
- [ ] Test alerting system

### Daily Monitoring
- [ ] Check error rates
- [ ] Review performance metrics
- [ ] Check system resources
- [ ] Review security alerts
- [ ] Check backup status

### Weekly Monitoring
- [ ] Review error trends
- [ ] Analyze performance trends
- [ ] Review user activity
- [ ] Check for security issues
- [ ] Review capacity planning

---

## 📝 Example Monitoring Queries

### Error Rate
```python
from system_monitoring.models import ErrorLog
from django.utils import timezone
from datetime import timedelta

# Errors in last hour
one_hour_ago = timezone.now() - timedelta(hours=1)
error_count = ErrorLog.objects.filter(created_at__gte=one_hour_ago).count()
```

### Response Time
```python
from system_monitoring.models import RequestLog

# Average response time
avg_response_time = RequestLog.objects.aggregate(
    avg_time=Avg('response_time')
)['avg_time']
```

### System Health
```python
from system_monitoring.models import SystemMetrics

# Latest system metrics
latest_metrics = SystemMetrics.objects.order_by('-created_at').first()
```

---

## 🚀 Quick Start

### 1. Basic Setup (Sentry)
```bash
# Install
pip install sentry-sdk

# Configure
# Add SENTRY_DSN to .env
# Update settings.py (see above)

# Test
python manage.py shell
# Trigger a test error to verify Sentry is working
```

### 2. Advanced Setup
```bash
# Follow the configuration steps above
# Set up log aggregation
# Configure alerting
# Create monitoring dashboard
```

---

**Last Updated**: 2025-01-27  
**Version**: 1.0.0

---

*เอกสารนี้เป็นคู่มือการตั้งค่า monitoring สำหรับระบบ BM23*
