#!/usr/bin/env python
"""
Performance monitoring script for the Final Project Management system.
"""
import os
import sys
import time
import psutil
import requests
import json
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
from django.core.cache import cache
from django.contrib.auth import get_user_model
from accounts.models import User
from projects.models import ProjectGroup
from students.models import Student
from advisors.models import Advisor

class PerformanceMonitor:
    """Performance monitoring class"""
    
    def __init__(self):
        self.start_time = time.time()
        self.metrics = {
            'system': {},
            'database': {},
            'cache': {},
            'api': {},
            'websocket': {},
            'errors': []
        }
    
    def collect_system_metrics(self):
        """Collect system performance metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used = memory.used / (1024**3)  # GB
            memory_total = memory.total / (1024**3)  # GB
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_used = disk.used / (1024**3)  # GB
            disk_total = disk.total / (1024**3)  # GB
            
            # Network I/O
            network = psutil.net_io_counters()
            network_bytes_sent = network.bytes_sent
            network_bytes_recv = network.bytes_recv
            
            self.metrics['system'] = {
                'cpu_percent': cpu_percent,
                'memory_percent': memory_percent,
                'memory_used_gb': round(memory_used, 2),
                'memory_total_gb': round(memory_total, 2),
                'disk_percent': disk_percent,
                'disk_used_gb': round(disk_used, 2),
                'disk_total_gb': round(disk_total, 2),
                'network_bytes_sent': network_bytes_sent,
                'network_bytes_recv': network_bytes_recv,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.metrics['errors'].append(f"System metrics error: {str(e)}")
    
    def collect_database_metrics(self):
        """Collect database performance metrics"""
        try:
            # Database connection count
            with connection.cursor() as cursor:
                cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
                active_connections = cursor.fetchone()[0]
            
            # Database size
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_size_pretty(pg_database_size(current_database()))")
                db_size = cursor.fetchone()[0]
            
            # Table sizes
            table_sizes = {}
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                    LIMIT 10
                """)
                for row in cursor.fetchall():
                    table_sizes[f"{row[0]}.{row[1]}"] = row[2]
            
            # Query performance
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT query, mean_time, calls, total_time
                    FROM pg_stat_statements 
                    ORDER BY mean_time DESC 
                    LIMIT 10
                """)
                slow_queries = []
                for row in cursor.fetchall():
                    slow_queries.append({
                        'query': row[0][:100] + '...' if len(row[0]) > 100 else row[0],
                        'mean_time': row[1],
                        'calls': row[2],
                        'total_time': row[3]
                    })
            
            self.metrics['database'] = {
                'active_connections': active_connections,
                'database_size': db_size,
                'table_sizes': table_sizes,
                'slow_queries': slow_queries,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.metrics['errors'].append(f"Database metrics error: {str(e)}")
    
    def collect_cache_metrics(self):
        """Collect cache performance metrics"""
        try:
            # Test cache performance
            cache_key = 'performance_test'
            test_data = {'test': 'data', 'timestamp': time.time()}
            
            # Set cache
            start_time = time.time()
            cache.set(cache_key, test_data, 60)
            set_time = time.time() - start_time
            
            # Get cache
            start_time = time.time()
            cached_data = cache.get(cache_key)
            get_time = time.time() - start_time
            
            # Delete cache
            start_time = time.time()
            cache.delete(cache_key)
            delete_time = time.time() - start_time
            
            self.metrics['cache'] = {
                'set_time_ms': round(set_time * 1000, 2),
                'get_time_ms': round(get_time * 1000, 2),
                'delete_time_ms': round(delete_time * 1000, 2),
                'cache_backend': settings.CACHES['default']['BACKEND'],
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.metrics['errors'].append(f"Cache metrics error: {str(e)}")
    
    def collect_api_metrics(self):
        """Collect API performance metrics"""
        try:
            # Test API endpoints
            base_url = 'http://localhost:8000'
            endpoints = [
                '/api/students/',
                '/api/advisors/',
                '/api/projects/',
                '/api/notifications/',
                '/api/analytics/'
            ]
            
            api_metrics = {}
            for endpoint in endpoints:
                try:
                    start_time = time.time()
                    response = requests.get(f"{base_url}{endpoint}", timeout=5)
                    response_time = time.time() - start_time
                    
                    api_metrics[endpoint] = {
                        'status_code': response.status_code,
                        'response_time_ms': round(response_time * 1000, 2),
                        'content_length': len(response.content) if response.content else 0
                    }
                except Exception as e:
                    api_metrics[endpoint] = {
                        'error': str(e),
                        'response_time_ms': None
                    }
            
            self.metrics['api'] = {
                'endpoints': api_metrics,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.metrics['errors'].append(f"API metrics error: {str(e)}")
    
    def collect_websocket_metrics(self):
        """Collect WebSocket performance metrics"""
        try:
            # Test WebSocket connection
            import websocket
            
            def on_message(ws, message):
                self.websocket_response_time = time.time() - self.websocket_start_time
            
            def on_error(ws, error):
                self.websocket_error = str(error)
            
            def on_close(ws, close_status_code, close_msg):
                pass
            
            def on_open(ws):
                self.websocket_start_time = time.time()
                ws.send(json.dumps({"type": "ping"}))
            
            # Test WebSocket connection
            self.websocket_start_time = None
            self.websocket_response_time = None
            self.websocket_error = None
            
            ws = websocket.WebSocketApp(
                "ws://localhost:8000/ws/notifications/",
                on_message=on_message,
                on_error=on_error,
                on_close=on_close,
                on_open=on_open
            )
            
            # Run for 5 seconds
            ws.run_forever(timeout=5)
            
            self.metrics['websocket'] = {
                'connection_time_ms': round(self.websocket_response_time * 1000, 2) if self.websocket_response_time else None,
                'error': self.websocket_error,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.metrics['errors'].append(f"WebSocket metrics error: {str(e)}")
    
    def collect_all_metrics(self):
        """Collect all performance metrics"""
        print("🔍 Collecting performance metrics...")
        
        self.collect_system_metrics()
        self.collect_database_metrics()
        self.collect_cache_metrics()
        self.collect_api_metrics()
        self.collect_websocket_metrics()
        
        # Calculate total collection time
        total_time = time.time() - self.start_time
        self.metrics['collection_time_seconds'] = round(total_time, 2)
    
    def generate_report(self):
        """Generate performance report"""
        print("\n📊 PERFORMANCE MONITORING REPORT")
        print("=" * 50)
        
        # System metrics
        if self.metrics['system']:
            print(f"\n🖥️  SYSTEM METRICS:")
            print(f"  CPU Usage: {self.metrics['system']['cpu_percent']}%")
            print(f"  Memory Usage: {self.metrics['system']['memory_percent']}% ({self.metrics['system']['memory_used_gb']}GB / {self.metrics['system']['memory_total_gb']}GB)")
            print(f"  Disk Usage: {self.metrics['system']['disk_percent']}% ({self.metrics['system']['disk_used_gb']}GB / {self.metrics['system']['disk_total_gb']}GB)")
        
        # Database metrics
        if self.metrics['database']:
            print(f"\n🗄️  DATABASE METRICS:")
            print(f"  Active Connections: {self.metrics['database']['active_connections']}")
            print(f"  Database Size: {self.metrics['database']['database_size']}")
            print(f"  Slow Queries: {len(self.metrics['database']['slow_queries'])}")
        
        # Cache metrics
        if self.metrics['cache']:
            print(f"\n💾 CACHE METRICS:")
            print(f"  Set Time: {self.metrics['cache']['set_time_ms']}ms")
            print(f"  Get Time: {self.metrics['cache']['get_time_ms']}ms")
            print(f"  Delete Time: {self.metrics['cache']['delete_time_ms']}ms")
        
        # API metrics
        if self.metrics['api']:
            print(f"\n🌐 API METRICS:")
            for endpoint, metrics in self.metrics['api']['endpoints'].items():
                if 'error' in metrics:
                    print(f"  {endpoint}: ERROR - {metrics['error']}")
                else:
                    print(f"  {endpoint}: {metrics['status_code']} ({metrics['response_time_ms']}ms)")
        
        # WebSocket metrics
        if self.metrics['websocket']:
            print(f"\n🔌 WEBSOCKET METRICS:")
            if self.metrics['websocket']['connection_time_ms']:
                print(f"  Connection Time: {self.metrics['websocket']['connection_time_ms']}ms")
            if self.metrics['websocket']['error']:
                print(f"  Error: {self.metrics['websocket']['error']}")
        
        # Errors
        if self.metrics['errors']:
            print(f"\n❌ ERRORS:")
            for error in self.metrics['errors']:
                print(f"  {error}")
        
        print(f"\n⏱️  Total Collection Time: {self.metrics['collection_time_seconds']}s")
    
    def save_metrics(self, filename=None):
        """Save metrics to file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"performance_metrics_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.metrics, f, indent=2)
        
        print(f"\n💾 Metrics saved to: {filename}")
    
    def check_thresholds(self):
        """Check performance thresholds"""
        warnings = []
        
        # System thresholds
        if self.metrics['system']:
            if self.metrics['system']['cpu_percent'] > 80:
                warnings.append(f"High CPU usage: {self.metrics['system']['cpu_percent']}%")
            
            if self.metrics['system']['memory_percent'] > 80:
                warnings.append(f"High memory usage: {self.metrics['system']['memory_percent']}%")
            
            if self.metrics['system']['disk_percent'] > 90:
                warnings.append(f"High disk usage: {self.metrics['system']['disk_percent']}%")
        
        # Database thresholds
        if self.metrics['database']:
            if self.metrics['database']['active_connections'] > 50:
                warnings.append(f"High database connections: {self.metrics['database']['active_connections']}")
        
        # API thresholds
        if self.metrics['api']:
            for endpoint, metrics in self.metrics['api']['endpoints'].items():
                if 'response_time_ms' in metrics and metrics['response_time_ms'] > 1000:
                    warnings.append(f"Slow API response: {endpoint} ({metrics['response_time_ms']}ms)")
        
        if warnings:
            print(f"\n⚠️  PERFORMANCE WARNINGS:")
            for warning in warnings:
                print(f"  {warning}")
        else:
            print(f"\n✅ All performance metrics are within acceptable thresholds")
        
        return warnings

def main():
    """Main function"""
    print("🚀 Final Project Management - Performance Monitor")
    print("=" * 50)
    
    # Initialize monitor
    monitor = PerformanceMonitor()
    
    # Collect metrics
    monitor.collect_all_metrics()
    
    # Generate report
    monitor.generate_report()
    
    # Check thresholds
    warnings = monitor.check_thresholds()
    
    # Save metrics
    monitor.save_metrics()
    
    # Return exit code based on warnings
    if warnings:
        print(f"\n❌ Performance monitoring completed with {len(warnings)} warnings")
        sys.exit(1)
    else:
        print(f"\n✅ Performance monitoring completed successfully")
        sys.exit(0)

if __name__ == '__main__':
    main()
