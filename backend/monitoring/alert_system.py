"""
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
            f.write(f"{datetime.now().isoformat()} - {alert['type']} - {alert['message']}\n")
        
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
