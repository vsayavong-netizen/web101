# Performance Testing Guide

## Setup

```bash
pip install locust
```

## Running Tests

### Basic Load Test
```bash
cd backend/performance_tests
locust -f locustfile.py --host=http://localhost:8000
```

### Custom User Count and Spawn Rate
```bash
locust -f locustfile.py --host=http://localhost:8000 --users=100 --spawn-rate=10
```

### Headless Mode (for CI)
```bash
locust -f locustfile.py --host=http://localhost:8000 --users=50 --spawn-rate=5 --run-time=5m --headless
```

### Web UI
Access http://localhost:8089 after starting Locust

## Test Scenarios

1. **Normal Load**: 10-50 concurrent users
2. **High Load**: 100-500 concurrent users
3. **Stress Test**: 1000+ concurrent users
4. **Spike Test**: Sudden increase in users

## Metrics to Monitor

- Response time (p50, p95, p99)
- Requests per second (RPS)
- Error rate
- Database query time
- Memory usage
- CPU usage

