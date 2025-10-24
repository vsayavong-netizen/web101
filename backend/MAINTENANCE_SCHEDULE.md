# BM23 - Maintenance Schedule

## 📅 ตารางการบำรุงรักษาระบบ

### 1. การบำรุงรักษาประจำวัน (Daily)

#### ตรวจสอบสุขภาพระบบ
```bash
# รัน health check
python health_check.py

# ตรวจสอบ logs
tail -f logs/django.log
tail -f logs/error.log

# ตรวจสอบ disk space
df -h

# ตรวจสอบ memory usage
free -h
```

#### ตรวจสอบ Services
```bash
# ตรวจสอบ Django service
systemctl status bm23-django

# ตรวจสอบ PostgreSQL
systemctl status postgresql

# ตรวจสอบ Redis
systemctl status redis

# ตรวจสอบ Nginx
systemctl status nginx
```

#### ตรวจสอบ Performance
```bash
# รัน monitoring
python monitor.py

# ตรวจสอบ response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/

# ตรวจสอบ database performance
python manage.py shell
>>> from django.db import connection
>>> print(len(connection.queries))
```

### 2. การบำรุงรักษาประจำสัปดาห์ (Weekly)

#### สร้าง Backup
```bash
# สร้าง full backup
python backup.py

# ตรวจสอบ backup size
du -sh backups/

# ตรวจสอบ backup integrity
python manage.py shell
>>> import json
>>> with open('backups/backup_*/backup_info.json') as f:
...     info = json.load(f)
...     print(info)
```

#### ตรวจสอบ Security
```bash
# ตรวจสอบ security settings
python manage.py check --deploy

# ตรวจสอบ user permissions
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.filter(is_superuser=True).count()

# ตรวจสอบ failed login attempts
grep "Failed login" logs/django.log | tail -20
```

#### ตรวจสอบ Dependencies
```bash
# ตรวจสอบ outdated packages
pip list --outdated

# ตรวจสอบ security vulnerabilities
pip-audit

# ตรวจสอบ Python version
python --version
```

### 3. การบำรุงรักษาประจำเดือน (Monthly)

#### อัปเดต Dependencies
```bash
# อัปเดต packages
pip install --upgrade -r requirements.txt

# ตรวจสอบ compatibility
python manage.py check

# ทดสอบหลังอัปเดต
python manage.py test
```

#### ตรวจสอบ Database
```bash
# ตรวจสอบ database size
python manage.py shell
>>> from django.db import connection
>>> cursor = connection.cursor()
>>> cursor.execute("SELECT pg_size_pretty(pg_database_size('final_project_management'));")

# ตรวจสอบ table sizes
python manage.py shell
>>> cursor.execute("""
... SELECT schemaname,tablename,pg_size_pretty(size) as size
... FROM (
...   SELECT schemaname,tablename,pg_total_relation_size(schemaname||'.'||tablename) as size
...   FROM pg_tables WHERE schemaname = 'public'
... ) t ORDER BY size DESC;
... """)
```

#### ตรวจสอบ Logs
```bash
# ตรวจสอบ log rotation
ls -la logs/

# ตรวจสอบ error patterns
grep "ERROR" logs/django.log | tail -50

# ตรวจสอบ performance issues
grep "slow" logs/django.log | tail -20
```

### 4. การบำรุงรักษาประจำไตรมาส (Quarterly)

#### Security Audit
```bash
# รัน security audit
python manage.py check --deploy

# ตรวจสอบ SSL certificates
openssl x509 -in /etc/ssl/certs/cert.pem -text -noout

# ตรวจสอบ firewall
ufw status

# ตรวจสอบ user accounts
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.filter(last_login__lt=timezone.now()-timedelta(days=90)).count()
```

#### Performance Optimization
```bash
# ตรวจสอบ database indexes
python manage.py shell
>>> cursor.execute("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users_user';")

# ตรวจสอบ slow queries
python manage.py shell
>>> cursor.execute("SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;")

# ตรวจสอบ cache hit ratio
python manage.py shell
>>> from django.core.cache import cache
>>> cache.get('cache_stats')
```

#### Backup Strategy Review
```bash
# ตรวจสอบ backup retention
ls -la backups/

# ทดสอบ backup restoration
python manage.py shell
>>> # Test backup integrity
>>> import json
>>> with open('backups/backup_*/backup_info.json') as f:
...     info = json.load(f)
...     print(f"Backup date: {info['timestamp']}")
...     print(f"Components: {info['components']}")
```

### 5. การบำรุงรักษาประจำปี (Yearly)

#### System Upgrade
```bash
# อัปเดต Python version
python --version
# ตรวจสอบ compatibility

# อัปเดต Django version
pip install Django==5.0.7
python manage.py check

# อัปเดต PostgreSQL version
psql --version
# ตรวจสอบ compatibility
```

#### Infrastructure Review
```bash
# ตรวจสอบ server resources
htop
df -h
free -h

# ตรวจสอบ network configuration
ip addr show
netstat -tulpn

# ตรวจสอบ SSL certificates
openssl x509 -in /etc/ssl/certs/cert.pem -dates
```

### 6. การบำรุงรักษาเฉพาะกิจ (Ad-hoc)

#### เมื่อเกิดปัญหา
```bash
# ตรวจสอบ system status
python health_check.py

# ตรวจสอบ logs
tail -f logs/django.log
tail -f logs/error.log

# ตรวจสอบ database
python manage.py dbshell

# ตรวจสอบ cache
python manage.py shell
>>> from django.core.cache import cache
>>> cache.get('test')
```

#### เมื่ออัปเดต Code
```bash
# Pull latest code
git pull origin main

# ติดตั้ง dependencies
pip install -r requirements.txt

# รัน migrations
python manage.py migrate

# รวบรวม static files
python manage.py collectstatic

# รีสตาร์ท services
systemctl restart bm23-django
systemctl restart nginx
```

### 7. การตรวจสอบ Performance

#### Database Performance
```bash
# ตรวจสอบ slow queries
python manage.py shell
>>> from django.db import connection
>>> print(connection.queries)

# ตรวจสอบ database connections
python manage.py shell
>>> cursor.execute("SELECT count(*) FROM pg_stat_activity;")

# ตรวจสอบ table statistics
python manage.py shell
>>> cursor.execute("SELECT schemaname,tablename,n_tup_ins,n_tup_upd,n_tup_del FROM pg_stat_user_tables;")
```

#### Application Performance
```bash
# ตรวจสอบ response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/

# ตรวจสอบ memory usage
ps aux | grep python

# ตรวจสอบ CPU usage
top -p $(pgrep -f "python manage.py runserver")
```

### 8. การตรวจสอบ Security

#### User Management
```bash
# ตรวจสอบ user accounts
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.filter(is_active=False).count()

# ตรวจสอบ password policies
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.filter(last_login__lt=timezone.now()-timedelta(days=90)).count()

# ตรวจสอบ failed login attempts
grep "Failed login" logs/django.log | tail -20
```

#### System Security
```bash
# ตรวจสอบ file permissions
find . -type f -perm 777

# ตรวจสอบ SSL configuration
openssl s_client -connect localhost:443 -servername localhost

# ตรวจสอบ firewall
ufw status verbose
```

### 9. การตรวจสอบ Backup

#### Backup Integrity
```bash
# ตรวจสอบ backup files
ls -la backups/

# ตรวจสอบ backup size
du -sh backups/*

# ตรวจสอบ backup metadata
python manage.py shell
>>> import json
>>> with open('backups/backup_*/backup_info.json') as f:
...     info = json.load(f)
...     print(f"Backup date: {info['timestamp']}")
...     print(f"Database engine: {info['database_engine']}")
...     print(f"Components: {info['components']}")
```

#### Backup Restoration Test
```bash
# ทดสอบ restore database
python manage.py shell
>>> from django.core.management import call_command
>>> call_command('loaddata', 'backups/backup_*/fixtures/accounts_User.json')

# ทดสอบ restore media files
cp -r backups/backup_*/media/* media/

# ทดสอบ restore static files
cp -r backups/backup_*/static/* staticfiles/
```

### 10. การตรวจสอบ Monitoring

#### System Metrics
```bash
# ตรวจสอบ system metrics
python monitor.py

# ตรวจสอบ metrics files
ls -la logs/*.json

# ตรวจสอบ metrics data
python manage.py shell
>>> import json
>>> with open('logs/system_metrics.json') as f:
...     data = json.load(f)
...     print(f"Latest metrics: {data[-1]}")
```

#### Alert Configuration
```bash
# ตั้งค่า alerts สำหรับ:
# - High CPU usage (>80%)
# - High memory usage (>90%)
# - Disk space low (<10%)
# - Database connection errors
# - Application errors
```

### 11. การตรวจสอบ Logs

#### Log Analysis
```bash
# ตรวจสอบ error patterns
grep "ERROR" logs/django.log | tail -50

# ตรวจสอบ performance issues
grep "slow" logs/django.log | tail -20

# ตรวจสอบ security issues
grep "Failed login" logs/django.log | tail -20

# ตรวจสอบ API usage
grep "API" logs/django.log | tail -20
```

#### Log Rotation
```bash
# ตั้งค่า log rotation
# /etc/logrotate.d/bm23
/var/log/bm23/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

### 12. การตรวจสอบ Dependencies

#### Package Updates
```bash
# ตรวจสอบ outdated packages
pip list --outdated

# ตรวจสอบ security vulnerabilities
pip-audit

# ตรวจสอบ package compatibility
pip check
```

#### Version Management
```bash
# ตรวจสอบ Python version
python --version

# ตรวจสอบ Django version
python manage.py version

# ตรวจสอบ PostgreSQL version
psql --version

# ตรวจสอบ Redis version
redis-server --version
```

---

**📋 Checklist สำหรับการบำรุงรักษา:**

### Daily Checklist
- [ ] Health check
- [ ] Log review
- [ ] Service status
- [ ] Performance monitoring

### Weekly Checklist
- [ ] Backup creation
- [ ] Security review
- [ ] Dependency check
- [ ] Performance analysis

### Monthly Checklist
- [ ] Dependency updates
- [ ] Database optimization
- [ ] Log analysis
- [ ] Security audit

### Quarterly Checklist
- [ ] Security audit
- [ ] Performance optimization
- [ ] Backup strategy review
- [ ] Infrastructure review

### Yearly Checklist
- [ ] System upgrade
- [ ] Infrastructure review
- [ ] Security policy review
- [ ] Disaster recovery test

---

**💡 Tips:**
- ใช้ automation scripts สำหรับการบำรุงรักษา
- ตั้งค่า alerts สำหรับปัญหาเร่งด่วน
- เก็บ logs และ metrics เป็นประจำ
- ทดสอบ backup restoration เป็นระยะ
