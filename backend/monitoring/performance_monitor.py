"""
Performance Monitoring
Monitors system performance in real-time
"""

import os
import django
import psutil
import time
from datetime import datetime

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.db import connection
from django.core.cache import cache

class PerformanceMonitor:
    def __init__(self):
        self.metrics = {}
    
    def get_system_metrics(self):
        """Get system performance metrics"""
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_percent': psutil.disk_usage('/').percent,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_database_metrics(self):
        """Get database performance metrics"""
        start_time = time.time()
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM django_migrations")
                result = cursor.fetchone()
            
            response_time = time.time() - start_time
            
            return {
                'response_time': response_time,
                'connection_count': len(connection.queries),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {'error': str(e)}
    
    def get_cache_metrics(self):
        """Get cache performance metrics"""
        start_time = time.time()
        
        try:
            cache.set('perf_test', 'ok', 30)
            result = cache.get('perf_test')
            response_time = time.time() - start_time
            
            return {
                'response_time': response_time,
                'status': 'ok' if result == 'ok' else 'error',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {'error': str(e)}
    
    def run_monitoring(self):
        """Run complete performance monitoring"""
        metrics = {
            'system': self.get_system_metrics(),
            'database': self.get_database_metrics(),
            'cache': self.get_cache_metrics()
        }
        
        return metrics

if __name__ == '__main__':
    monitor = PerformanceMonitor()
    metrics = monitor.run_monitoring()
    print("Performance Metrics:")
    for category, data in metrics.items():
        print(f"{category}: {data}")
