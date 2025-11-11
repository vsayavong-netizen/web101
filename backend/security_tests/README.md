# Security Testing Guide

## Running Security Tests

```bash
cd backend
python manage.py test security_tests
```

## Test Coverage

1. **SQL Injection Protection**
2. **XSS Protection**
3. **Authentication Requirements**
4. **Authorization Enforcement**
5. **Rate Limiting**
6. **CSRF Protection**
7. **Input Validation**
8. **Path Traversal Protection**
9. **JWT Token Security**
10. **Sensitive Data Exposure**
11. **Security Headers**
12. **CORS Configuration**

## Additional Security Tools

### OWASP ZAP
```bash
# Install OWASP ZAP
# Run automated scan
zap-cli quick-scan http://localhost:8000
```

### Bandit (Python Security Linter)
```bash
pip install bandit
bandit -r backend/
```

### Safety (Dependency Check)
```bash
pip install safety
safety check
```

