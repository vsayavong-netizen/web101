"""
Monitoring and Logging Setup
Comprehensive monitoring system for production deployment
"""

import os
import django
import logging
from pathlib import Path
from datetime import datetime

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.conf import settings
from django.db import connection
from django.core.cache import cache
import redis

def setup_monitoring():
    """Setup comprehensive monitoring system"""
    print("=" * 60)
    print("MONITORING AND LOGGING SETUP")
    print("=" * 60)
    
    # 1. Create monitoring directories
    print("\n1. Creating Monitoring Directories...")
    
    monitoring_dirs = [
        'logs',
        'logs/application',
        'logs/access',
        'logs/error',
        'logs/performance',
        'logs/security',
        'monitoring',
        'monitoring/metrics',
        'monitoring/alerts',
        'backups',
        'backups/database',
        'backups/files',
        'backups/logs',
    ]
    
    for directory in monitoring_dirs:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"OK Created directory: {directory}")
    
    # 2. Setup logging configuration
    print("\n2. Setting up Logging Configuration...")
    
    logging_config = """
# Logging configuration for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            'format': '{"level": "%(levelname)s", "time": "%(asctime)s", "module": "%(module)s", "message": "%(message)s"}',
        },
    },
    'handlers': {
        'file_application': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/application/django.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'file_error': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/error/error.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'file_security': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/security/security.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'json',
        },
        'file_performance': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/performance/performance.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file_application', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['file_error'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['file_security'],
            'level': 'WARNING',
            'propagate': False,
        },
        'performance': {
            'handlers': ['file_performance'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['file_application', 'console'],
        'level': 'INFO',
    },
}
"""
    
    with open('monitoring/logging_config.py', 'w') as f:
        f.write(logging_config)
    print("OK Logging configuration created")
    
    # 3. Create health check script
    print("\n3. Creating Health Check Script...")
    
    health_check_script = '''"""
Health Check Script
Monitors system health and performance
"""

import os
import django
import json
import time
from datetime import datetime

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.db import connection
from django.core.cache import cache
from django.contrib.auth import get_user_model
from projects.models import ProjectGroup
from students.models import Student
from advisors.models import Advisor

User = get_user_model()

def health_check():
    """Comprehensive health check"""
    start_time = time.time()
    
    health_status = {
        'timestamp': datetime.now().isoformat(),
        'status': 'healthy',
        'checks': {}
    }
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = {
            'status': 'ok',
            'response_time': time.time() - start_time
        }
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['checks']['database'] = {
            'status': 'error',
            'error': str(e)
        }
    
    # Cache check
    try:
        cache.set('health_check', 'ok', 30)
        cache_result = cache.get('health_check')
        if cache_result == 'ok':
            health_status['checks']['cache'] = {'status': 'ok'}
        else:
            health_status['checks']['cache'] = {'status': 'error', 'error': 'Cache test failed'}
    except Exception as e:
        health_status['checks']['cache'] = {'status': 'error', 'error': str(e)}
    
    # Model checks
    try:
        user_count = User.objects.count()
        project_count = ProjectGroup.objects.count()
        student_count = Student.objects.count()
        advisor_count = Advisor.objects.count()
        
        health_status['checks']['models'] = {
            'status': 'ok',
            'data': {
                'users': user_count,
                'projects': project_count,
                'students': student_count,
                'advisors': advisor_count
            }
        }
    except Exception as e:
        health_status['checks']['models'] = {'status': 'error', 'error': str(e)}
    
    # Performance metrics
    total_time = time.time() - start_time
    health_status['performance'] = {
        'total_time': total_time,
        'timestamp': datetime.now().isoformat()
    }
    
    return health_status

if __name__ == '__main__':
    result = health_check()
    print(json.dumps(result, indent=2))
'''
    
    with open('monitoring/health_check.py', 'w') as f:
        f.write(health_check_script)
    print("OK Health check script created")
    
    # 4. Create performance monitoring
    print("\n4. Creating Performance Monitoring...")
    
    performance_script = '''"""
Performance Monitoring
Tracks system performance metrics
"""

import os
import django
import psutil
import time
from datetime import datetime, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.db import connection
from django.core.cache import cache

def get_system_metrics():
    """Get system performance metrics"""
    metrics = {
        'timestamp': datetime.now().isoformat(),
        'cpu': {
            'percent': psutil.cpu_percent(interval=1),
            'count': psutil.cpu_count()
        },
        'memory': {
            'total': psutil.virtual_memory().total,
            'available': psutil.virtual_memory().available,
            'percent': psutil.virtual_memory().percent
        },
        'disk': {
            'total': psutil.disk_usage('/').total,
            'used': psutil.disk_usage('/').used,
            'free': psutil.disk_usage('/').free,
            'percent': psutil.disk_usage('/').percent
        }
    }
    
    return metrics

def get_database_metrics():
    """Get database performance metrics"""
    start_time = time.time()
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            migration_count = cursor.fetchone()[0]
        
        response_time = time.time() - start_time
        
        return {
            'status': 'ok',
            'response_time': response_time,
            'migration_count': migration_count
        }
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def get_application_metrics():
    """Get application-specific metrics"""
    from django.contrib.auth import get_user_model
    from projects.models import ProjectGroup
    from students.models import Student
    from advisors.models import Advisor
    
    User = get_user_model()
    
    try:
        metrics = {
            'users': User.objects.count(),
            'projects': ProjectGroup.objects.count(),
            'students': Student.objects.count(),
            'advisors': Advisor.objects.count(),
            'timestamp': datetime.now().isoformat()
        }
        return metrics
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    print("System Metrics:")
    print(get_system_metrics())
    print("\\nDatabase Metrics:")
    print(get_database_metrics())
    print("\\nApplication Metrics:")
    print(get_application_metrics())
'''
    
    with open('monitoring/performance_monitor.py', 'w') as f:
        f.write(performance_script)
    print("OK Performance monitoring created")
    
    # 5. Create alert system
    print("\n5. Creating Alert System...")
    
    alert_script = '''"""
Alert System
Monitors system and sends alerts for critical issues
"""

import os
import django
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

import psutil
from django.db import connection
from django.core.cache import cache

class AlertSystem:
    def __init__(self):
        self.thresholds = {
            'cpu_percent': 80,
            'memory_percent': 85,
            'disk_percent': 90,
            'response_time': 5.0
        }
    
    def check_cpu_usage(self):
        """Check CPU usage"""
        cpu_percent = psutil.cpu_percent(interval=1)
        if cpu_percent > self.thresholds['cpu_percent']:
            return {
                'type': 'cpu_high',
                'message': f'CPU usage is {cpu_percent}% (threshold: {self.thresholds["cpu_percent"]}%)',
                'severity': 'warning'
            }
        return None
    
    def check_memory_usage(self):
        """Check memory usage"""
        memory_percent = psutil.virtual_memory().percent
        if memory_percent > self.thresholds['memory_percent']:
            return {
                'type': 'memory_high',
                'message': f'Memory usage is {memory_percent}% (threshold: {self.thresholds["memory_percent"]}%)',
                'severity': 'warning'
            }
        return None
    
    def check_disk_usage(self):
        """Check disk usage"""
        disk_percent = psutil.disk_usage('/').percent
        if disk_percent > self.thresholds['disk_percent']:
            return {
                'type': 'disk_high',
                'message': f'Disk usage is {disk_percent}% (threshold: {self.thresholds["disk_percent"]}%)',
                'severity': 'critical'
            }
        return None
    
    def check_database_connection(self):
        """Check database connection"""
        try:
            start_time = time.time()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            response_time = time.time() - start_time
            
            if response_time > self.thresholds['response_time']:
                return {
                    'type': 'db_slow',
                    'message': f'Database response time is {response_time:.2f}s (threshold: {self.thresholds["response_time"]}s)',
                    'severity': 'warning'
                }
        except Exception as e:
            return {
                'type': 'db_error',
                'message': f'Database connection failed: {str(e)}',
                'severity': 'critical'
            }
        return None
    
    def check_cache_connection(self):
        """Check cache connection"""
        try:
            cache.set('health_check', 'ok', 30)
            result = cache.get('health_check')
            if result != 'ok':
                return {
                    'type': 'cache_error',
                    'message': 'Cache test failed',
                    'severity': 'warning'
                }
        except Exception as e:
            return {
                'type': 'cache_error',
                'message': f'Cache connection failed: {str(e)}',
                'severity': 'critical'
            }
        return None
    
    def run_all_checks(self):
        """Run all health checks"""
        alerts = []
        
        # System checks
        cpu_alert = self.check_cpu_usage()
        if cpu_alert:
            alerts.append(cpu_alert)
        
        memory_alert = self.check_memory_usage()
        if memory_alert:
            alerts.append(memory_alert)
        
        disk_alert = self.check_disk_usage()
        if disk_alert:
            alerts.append(disk_alert)
        
        # Application checks
        db_alert = self.check_database_connection()
        if db_alert:
            alerts.append(db_alert)
        
        cache_alert = self.check_cache_connection()
        if cache_alert:
            alerts.append(cache_alert)
        
        return alerts
    
    def send_alert(self, alert):
        """Send alert notification"""
        # Log alert
        with open('monitoring/alerts/alerts.log', 'a') as f:
            f.write(f"{datetime.now().isoformat()} - {alert['type']} - {alert['message']}\\n")
        
        # Send email (if configured)
        # This would be implemented based on your email configuration
        print(f"ALERT: {alert['type']} - {alert['message']}")

if __name__ == '__main__':
    alert_system = AlertSystem()
    alerts = alert_system.run_all_checks()
    
    if alerts:
        for alert in alerts:
            alert_system.send_alert(alert)
        print(f"Generated {len(alerts)} alerts")
    else:
        print("No alerts generated - system healthy")
'''
    
    with open('monitoring/alert_system.py', 'w') as f:
        f.write(alert_script)
    print("OK Alert system created")
    
    # 6. Create backup script
    print("\n6. Creating Backup Script...")
    
    backup_script = '''"""
Backup System
Automated backup for database and files
"""

import os
import django
import subprocess
import shutil
from datetime import datetime
from pathlib import Path

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

def backup_database():
    """Backup database"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backups/database/db_backup_{timestamp}.sql'
    
    try:
        # PostgreSQL backup
        cmd = [
            'pg_dump',
            '-h', 'localhost',
            '-U', 'project_user',
            '-d', 'final_project_management',
            '-f', backup_file
        ]
        
        subprocess.run(cmd, check=True)
        print(f"Database backup created: {backup_file}")
        return backup_file
    except Exception as e:
        print(f"Database backup failed: {e}")
        return None

def backup_files():
    """Backup media files"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backups/files/media_backup_{timestamp}.tar.gz'
    
    try:
        # Create tar.gz backup
        cmd = ['tar', '-czf', backup_file, 'media/']
        subprocess.run(cmd, check=True)
        print(f"Files backup created: {backup_file}")
        return backup_file
    except Exception as e:
        print(f"Files backup failed: {e}")
        return None

def backup_logs():
    """Backup log files"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backups/logs/logs_backup_{timestamp}.tar.gz'
    
    try:
        # Create tar.gz backup
        cmd = ['tar', '-czf', backup_file, 'logs/']
        subprocess.run(cmd, check=True)
        print(f"Logs backup created: {backup_file}")
        return backup_file
    except Exception as e:
        print(f"Logs backup failed: {e}")
        return None

def cleanup_old_backups():
    """Clean up old backup files"""
    backup_dirs = ['backups/database', 'backups/files', 'backups/logs']
    
    for backup_dir in backup_dirs:
        if os.path.exists(backup_dir):
            for file in os.listdir(backup_dir):
                file_path = os.path.join(backup_dir, file)
                if os.path.isfile(file_path):
                    # Delete files older than 30 days
                    file_age = datetime.now().timestamp() - os.path.getmtime(file_path)
                    if file_age > 30 * 24 * 60 * 60:  # 30 days
                        os.remove(file_path)
                        print(f"Deleted old backup: {file_path}")

def run_backup():
    """Run complete backup"""
    print(f"Starting backup at {datetime.now()}")
    
    # Create backup directories
    os.makedirs('backups/database', exist_ok=True)
    os.makedirs('backups/files', exist_ok=True)
    os.makedirs('backups/logs', exist_ok=True)
    
    # Run backups
    db_backup = backup_database()
    files_backup = backup_files()
    logs_backup = backup_logs()
    
    # Cleanup old backups
    cleanup_old_backups()
    
    print(f"Backup completed at {datetime.now()}")
    
    return {
        'database': db_backup,
        'files': files_backup,
        'logs': logs_backup
    }

if __name__ == '__main__':
    run_backup()
'''
    
    with open('monitoring/backup_system.py', 'w') as f:
        f.write(backup_script)
    print("OK Backup system created")
    
    # 7. Test monitoring system
    print("\n7. Testing Monitoring System...")
    
    try:
        # Test health check
        import subprocess
        result = subprocess.run(['python', 'monitoring/health_check.py'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("OK Health check test passed")
        else:
            print(f"WARN Health check test failed: {result.stderr}")
        
        # Test performance monitoring
        result = subprocess.run(['python', 'monitoring/performance_monitor.py'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("OK Performance monitoring test passed")
        else:
            print(f"WARN Performance monitoring test failed: {result.stderr}")
        
    except Exception as e:
        print(f"WARN Monitoring test failed: {e}")
    
    # 8. Create monitoring dashboard
    print("\n8. Creating Monitoring Dashboard...")
    
    dashboard_html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .healthy { background-color: #d4edda; color: #155724; }
        .warning { background-color: #fff3cd; color: #856404; }
        .critical { background-color: #f8d7da; color: #721c24; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
        .refresh { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>System Monitoring Dashboard</h1>
    
    <div class="refresh">
        <button onclick="location.reload()">Refresh</button>
        <span>Last updated: <span id="timestamp"></span></span>
    </div>
    
    <div id="status">
        <h2>System Status</h2>
        <div id="health-status">Loading...</div>
    </div>
    
    <div id="metrics">
        <h2>Performance Metrics</h2>
        <div id="performance-metrics">Loading...</div>
    </div>
    
    <div id="alerts">
        <h2>Recent Alerts</h2>
        <div id="alert-list">Loading...</div>
    </div>
    
    <script>
        // Update timestamp
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            location.reload();
        }, 30000);
        
        // Load system status
        fetch('/api/health/')
            .then(response => response.json())
            .then(data => {
                const statusDiv = document.getElementById('health-status');
                const statusClass = data.status === 'healthy' ? 'healthy' : 'critical';
                statusDiv.innerHTML = `<div class="status ${statusClass}">Status: ${data.status.toUpperCase()}</div>`;
            })
            .catch(error => {
                document.getElementById('health-status').innerHTML = 
                    '<div class="status critical">Error loading status</div>';
            });
    </script>
</body>
</html>'''
    
    with open('monitoring/dashboard.html', 'w') as f:
        f.write(dashboard_html)
    print("OK Monitoring dashboard created")
    
    # Final status
    print("\n" + "=" * 60)
    print("MONITORING SETUP COMPLETE!")
    print("=" * 60)
    print("OK Monitoring directories created")
    print("OK Logging configuration ready")
    print("OK Health check system ready")
    print("OK Performance monitoring ready")
    print("OK Alert system ready")
    print("OK Backup system ready")
    print("OK Monitoring dashboard ready")
    print("\nNext steps:")
    print("1. Configure email alerts")
    print("2. Set up log rotation")
    print("3. Configure backup schedules")
    print("4. Set up monitoring dashboard")
    print("5. Test all monitoring systems")
    print("=" * 60)

if __name__ == '__main__':
    setup_monitoring()
