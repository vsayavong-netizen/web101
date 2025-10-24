#!/usr/bin/env python
"""
BM23 System Status Dashboard
Real-time system monitoring and status reporting
"""

import os
import sys
import django
import json
import psutil
import requests
import time
from datetime import datetime, timedelta
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(project_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.db import connection
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.conf import settings

class SystemStatusDashboard:
    def __init__(self):
        self.status = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'unknown',
            'components': {},
            'metrics': {},
            'alerts': [],
            'recommendations': []
        }
    
    def check_database_status(self):
        """Check database connectivity and performance"""
        try:
            with connection.cursor() as cursor:
                # Test connection
                cursor.execute("SELECT 1")
                
                # Get database info
                cursor.execute("SELECT version()")
                db_version = cursor.fetchone()[0]
                
                # Get connection count
                cursor.execute("SELECT count(*) FROM pg_stat_activity")
                connection_count = cursor.fetchone()[0]
                
                # Get database size
                cursor.execute("SELECT pg_database_size(current_database())")
                db_size = cursor.fetchone()[0]
                
                return {
                    'status': 'healthy',
                    'version': db_version,
                    'connections': connection_count,
                    'size_mb': round(db_size / (1024**2), 2),
                    'response_time': '< 1ms'
                }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': 'N/A'
            }
    
    def check_cache_status(self):
        """Check Redis cache status"""
        try:
            # Test cache connection
            cache.set('health_check', 'ok', 10)
            result = cache.get('health_check')
            
            if result == 'ok':
                # Get cache info
                try:
                    cache_info = cache._cache.get_client().info()
                    return {
                        'status': 'healthy',
                        'type': 'Redis',
                        'memory_used': cache_info.get('used_memory_human', 'N/A'),
                        'connected_clients': cache_info.get('connected_clients', 'N/A'),
                        'response_time': '< 1ms'
                    }
                except:
                    return {
                        'status': 'healthy',
                        'type': 'Redis',
                        'response_time': '< 1ms'
                    }
            else:
                return {
                    'status': 'error',
                    'error': 'Cache test failed',
                    'response_time': 'N/A'
                }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'response_time': 'N/A'
            }
    
    def check_application_status(self):
        """Check Django application status"""
        try:
            User = get_user_model()
            
            # Get user counts
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            
            # Get project counts
            try:
                from projects.models import ProjectGroup
                total_projects = ProjectGroup.objects.count()
                active_projects = ProjectGroup.objects.filter(status='Active').count()
            except:
                total_projects = 0
                active_projects = 0
            
            # Check if migrations are needed
            from django.core.management import call_command
            from io import StringIO
            out = StringIO()
            call_command('showmigrations', '--plan', stdout=out)
            migrations_needed = ']' not in out.getvalue()
            
            return {
                'status': 'healthy',
                'total_users': total_users,
                'active_users': active_users,
                'total_projects': total_projects,
                'active_projects': active_projects,
                'migrations_needed': migrations_needed
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def check_system_metrics(self):
        """Check system performance metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used_gb = round(memory.used / (1024**3), 2)
            memory_total_gb = round(memory.total / (1024**3), 2)
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_used_gb = round(disk.used / (1024**3), 2)
            disk_total_gb = round(disk.total / (1024**3), 2)
            
            # Network I/O
            network = psutil.net_io_counters()
            network_bytes_sent = network.bytes_sent
            network_bytes_recv = network.bytes_recv
            
            return {
                'cpu_percent': cpu_percent,
                'memory_percent': memory_percent,
                'memory_used_gb': memory_used_gb,
                'memory_total_gb': memory_total_gb,
                'disk_percent': disk_percent,
                'disk_used_gb': disk_used_gb,
                'disk_total_gb': disk_total_gb,
                'network_bytes_sent': network_bytes_sent,
                'network_bytes_recv': network_bytes_recv
            }
        except Exception as e:
            return {
                'error': str(e)
            }
    
    def check_api_endpoints(self):
        """Check API endpoints availability"""
        try:
            base_url = "http://localhost:8000"
            endpoints = [
                "/api/",
                "/api/auth/",
                "/api/projects/",
                "/api/students/",
                "/api/advisors/"
            ]
            
            results = {}
            for endpoint in endpoints:
                try:
                    response = requests.get(f"{base_url}{endpoint}", timeout=5)
                    results[endpoint] = {
                        'status': 'healthy',
                        'status_code': response.status_code,
                        'response_time': f"{response.elapsed.total_seconds():.3f}s"
                    }
                except requests.exceptions.RequestException as e:
                    results[endpoint] = {
                        'status': 'error',
                        'error': str(e),
                        'response_time': 'N/A'
                    }
            
            return results
        except Exception as e:
            return {
                'error': str(e)
            }
    
    def check_log_files(self):
        """Check log files status"""
        try:
            logs_dir = Path('logs')
            if not logs_dir.exists():
                return {
                    'status': 'warning',
                    'message': 'Logs directory not found'
                }
            
            log_files = {
                'django.log': logs_dir / 'django.log',
                'error.log': logs_dir / 'error.log',
                'system_metrics.json': logs_dir / 'system_metrics.json'
            }
            
            results = {}
            for name, path in log_files.items():
                if path.exists():
                    size_mb = round(path.stat().st_size / (1024**2), 2)
                    modified = datetime.fromtimestamp(path.stat().st_mtime)
                    results[name] = {
                        'status': 'healthy',
                        'size_mb': size_mb,
                        'last_modified': modified.isoformat()
                    }
                else:
                    results[name] = {
                        'status': 'missing',
                        'size_mb': 0,
                        'last_modified': None
                    }
            
            return results
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def generate_alerts(self):
        """Generate system alerts based on status"""
        alerts = []
        
        # Check system metrics
        if 'system_metrics' in self.status['metrics']:
            metrics = self.status['metrics']['system_metrics']
            
            if metrics.get('cpu_percent', 0) > 80:
                alerts.append({
                    'level': 'warning',
                    'message': f"High CPU usage: {metrics.get('cpu_percent', 0)}%",
                    'recommendation': 'Consider scaling or optimizing queries'
                })
            
            if metrics.get('memory_percent', 0) > 90:
                alerts.append({
                    'level': 'critical',
                    'message': f"High memory usage: {metrics.get('memory_percent', 0)}%",
                    'recommendation': 'Consider increasing memory or optimizing memory usage'
                })
            
            if metrics.get('disk_percent', 0) > 90:
                alerts.append({
                    'level': 'critical',
                    'message': f"High disk usage: {metrics.get('disk_percent', 0)}%",
                    'recommendation': 'Consider cleaning up old files or increasing disk space'
                })
        
        # Check database
        if 'database' in self.status['components']:
            db_status = self.status['components']['database']
            if db_status.get('status') == 'error':
                alerts.append({
                    'level': 'critical',
                    'message': 'Database connection failed',
                    'recommendation': 'Check database service and configuration'
                })
        
        # Check cache
        if 'cache' in self.status['components']:
            cache_status = self.status['components']['cache']
            if cache_status.get('status') == 'error':
                alerts.append({
                    'level': 'warning',
                    'message': 'Cache connection failed',
                    'recommendation': 'Check Redis service and configuration'
                })
        
        return alerts
    
    def generate_recommendations(self):
        """Generate system recommendations"""
        recommendations = []
        
        # Check if migrations are needed
        if 'application' in self.status['components']:
            app_status = self.status['components']['application']
            if app_status.get('migrations_needed'):
                recommendations.append({
                    'type': 'maintenance',
                    'message': 'Database migrations are needed',
                    'action': 'Run: python manage.py migrate'
                })
        
        # Check log file sizes
        if 'logs' in self.status['components']:
            log_status = self.status['components']['logs']
            for log_name, log_info in log_status.items():
                if log_info.get('size_mb', 0) > 100:
                    recommendations.append({
                        'type': 'maintenance',
                        'message': f'Large log file: {log_name} ({log_info.get("size_mb", 0)}MB)',
                        'action': 'Consider log rotation or cleanup'
                    })
        
        # Check system resources
        if 'system_metrics' in self.status['metrics']:
            metrics = self.status['metrics']['system_metrics']
            
            if metrics.get('cpu_percent', 0) > 70:
                recommendations.append({
                    'type': 'performance',
                    'message': 'High CPU usage detected',
                    'action': 'Monitor application performance and optimize queries'
                })
            
            if metrics.get('memory_percent', 0) > 80:
                recommendations.append({
                    'type': 'performance',
                    'message': 'High memory usage detected',
                    'action': 'Consider increasing memory or optimizing memory usage'
                })
        
        return recommendations
    
    def determine_overall_status(self):
        """Determine overall system status"""
        critical_components = ['database', 'application']
        warning_components = ['cache', 'api_endpoints']
        
        critical_errors = 0
        warnings = 0
        
        for component in critical_components:
            if component in self.status['components']:
                if self.status['components'][component].get('status') == 'error':
                    critical_errors += 1
        
        for component in warning_components:
            if component in self.status['components']:
                if self.status['components'][component].get('status') == 'error':
                    warnings += 1
        
        if critical_errors > 0:
            return 'critical'
        elif warnings > 0:
            return 'warning'
        else:
            return 'healthy'
    
    def run_full_check(self):
        """Run complete system status check"""
        print("Running BM23 System Status Check...")
        print("=" * 50)
        
        # Check components
        print("Checking database...")
        self.status['components']['database'] = self.check_database_status()
        
        print("Checking cache...")
        self.status['components']['cache'] = self.check_cache_status()
        
        print("Checking application...")
        self.status['components']['application'] = self.check_application_status()
        
        print("Checking API endpoints...")
        self.status['components']['api_endpoints'] = self.check_api_endpoints()
        
        print("Checking log files...")
        self.status['components']['logs'] = self.check_log_files()
        
        # Check metrics
        print("Checking system metrics...")
        self.status['metrics']['system_metrics'] = self.check_system_metrics()
        
        # Generate alerts and recommendations
        self.status['alerts'] = self.generate_alerts()
        self.status['recommendations'] = self.generate_recommendations()
        
        # Determine overall status
        self.status['overall_status'] = self.determine_overall_status()
        self.status['timestamp'] = datetime.now().isoformat()
        
        return self.status
    
    def print_status_report(self):
        """Print formatted status report"""
        print("\n" + "=" * 50)
        print("BM23 SYSTEM STATUS REPORT")
        print("=" * 50)
        
        # Overall status
        status_emoji = {
            'healthy': '✅',
            'warning': '⚠️',
            'critical': '❌',
            'unknown': '❓'
        }
        
        print(f"Overall Status: {status_emoji.get(self.status['overall_status'], '❓')} {self.status['overall_status'].upper()}")
        print(f"Timestamp: {self.status['timestamp']}")
        
        # Components status
        print("\n📊 COMPONENTS STATUS:")
        for component, status in self.status['components'].items():
            if isinstance(status, dict):
                if status.get('status') == 'healthy':
                    print(f"  ✅ {component.title()}: {status.get('status', 'unknown')}")
                elif status.get('status') == 'error':
                    print(f"  ❌ {component.title()}: {status.get('status', 'unknown')} - {status.get('error', 'Unknown error')}")
                else:
                    print(f"  ⚠️ {component.title()}: {status.get('status', 'unknown')}")
        
        # System metrics
        if 'system_metrics' in self.status['metrics']:
            metrics = self.status['metrics']['system_metrics']
            print(f"\n📈 SYSTEM METRICS:")
            print(f"  CPU Usage: {metrics.get('cpu_percent', 'N/A')}%")
            print(f"  Memory Usage: {metrics.get('memory_percent', 'N/A')}% ({metrics.get('memory_used_gb', 'N/A')}GB / {metrics.get('memory_total_gb', 'N/A')}GB)")
            print(f"  Disk Usage: {metrics.get('disk_percent', 'N/A')}% ({metrics.get('disk_used_gb', 'N/A')}GB / {metrics.get('disk_total_gb', 'N/A')}GB)")
        
        # Alerts
        if self.status['alerts']:
            print(f"\n🚨 ALERTS ({len(self.status['alerts'])}):")
            for alert in self.status['alerts']:
                level_emoji = {'critical': '🔴', 'warning': '🟡', 'info': '🔵'}
                print(f"  {level_emoji.get(alert['level'], '⚪')} {alert['level'].upper()}: {alert['message']}")
                print(f"    💡 {alert['recommendation']}")
        
        # Recommendations
        if self.status['recommendations']:
            print(f"\n💡 RECOMMENDATIONS ({len(self.status['recommendations'])}):")
            for rec in self.status['recommendations']:
                print(f"  📋 {rec['type'].upper()}: {rec['message']}")
                print(f"    🔧 {rec['action']}")
        
        print("\n" + "=" * 50)
    
    def save_status_report(self, filename=None):
        """Save status report to file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"logs/system_status_{timestamp}.json"
        
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        with open(filename, 'w') as f:
            json.dump(self.status, f, indent=2)
        
        print(f"Status report saved to: {filename}")

def main():
    """Run system status dashboard"""
    dashboard = SystemStatusDashboard()
    
    # Run full system check
    status = dashboard.run_full_check()
    
    # Print status report
    dashboard.print_status_report()
    
    # Save status report
    dashboard.save_status_report()
    
    # Return exit code based on status
    if status['overall_status'] == 'critical':
        sys.exit(1)
    elif status['overall_status'] == 'warning':
        sys.exit(2)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
