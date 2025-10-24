#!/usr/bin/env python
"""
Monitoring script for BM23 application
"""

import os
import sys
import django
import psutil
import time
import json
from datetime import datetime
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

def get_system_metrics():
    """Get system performance metrics"""
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
        
        return {
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': cpu_percent,
            'memory_percent': memory_percent,
            'memory_used_gb': round(memory_used, 2),
            'memory_total_gb': round(memory_total, 2),
            'disk_percent': disk_percent,
            'disk_used_gb': round(disk_used, 2),
            'disk_total_gb': round(disk_total, 2),
            'network_bytes_sent': network_bytes_sent,
            'network_bytes_recv': network_bytes_recv,
        }
    except Exception as e:
        return {'error': f"Failed to get system metrics: {str(e)}"}

def get_database_metrics():
    """Get database performance metrics"""
    try:
        with connection.cursor() as cursor:
            # Get database size
            cursor.execute("SELECT pg_database_size(current_database())")
            db_size = cursor.fetchone()[0]
            
            # Get connection count
            cursor.execute("SELECT count(*) FROM pg_stat_activity")
            connection_count = cursor.fetchone()[0]
            
            # Get table counts
            cursor.execute("""
                SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
                FROM pg_stat_user_tables 
                ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC 
                LIMIT 10
            """)
            table_stats = cursor.fetchall()
            
            return {
                'timestamp': datetime.now().isoformat(),
                'database_size_bytes': db_size,
                'database_size_mb': round(db_size / (1024**2), 2),
                'connection_count': connection_count,
                'table_stats': table_stats,
            }
    except Exception as e:
        return {'error': f"Failed to get database metrics: {str(e)}"}

def get_application_metrics():
    """Get application-specific metrics"""
    try:
        User = get_user_model()
        
        # User counts
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        # Project counts (if available)
        try:
            from projects.models import ProjectGroup
            total_projects = ProjectGroup.objects.count()
            active_projects = ProjectGroup.objects.filter(status='Active').count()
        except:
            total_projects = 0
            active_projects = 0
        
        # Cache metrics
        cache_info = cache._cache.get_client().info()
        
        return {
            'timestamp': datetime.now().isoformat(),
            'total_users': total_users,
            'active_users': active_users,
            'total_projects': total_projects,
            'active_projects': active_projects,
            'cache_info': cache_info,
        }
    except Exception as e:
        return {'error': f"Failed to get application metrics: {str(e)}"}

def save_metrics_to_file(metrics, filename):
    """Save metrics to a JSON file"""
    try:
        os.makedirs('logs', exist_ok=True)
        filepath = f'logs/{filename}'
        
        # Load existing data
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                data = json.load(f)
        else:
            data = []
        
        # Add new metrics
        data.append(metrics)
        
        # Keep only last 1000 entries
        if len(data) > 1000:
            data = data[-1000:]
        
        # Save to file
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        return True
    except Exception as e:
        print(f"Failed to save metrics: {str(e)}")
        return False

def main():
    """Run monitoring and save metrics"""
    print("Collecting BM23 System Metrics...")
    
    # Collect metrics
    system_metrics = get_system_metrics()
    database_metrics = get_database_metrics()
    application_metrics = get_application_metrics()
    
    # Combine all metrics
    all_metrics = {
        'system': system_metrics,
        'database': database_metrics,
        'application': application_metrics,
    }
    
    # Save to files
    save_metrics_to_file(system_metrics, 'system_metrics.json')
    save_metrics_to_file(database_metrics, 'database_metrics.json')
    save_metrics_to_file(application_metrics, 'application_metrics.json')
    
    # Print summary
    print("System Metrics Summary:")
    print(f"   CPU Usage: {system_metrics.get('cpu_percent', 'N/A')}%")
    print(f"   Memory Usage: {system_metrics.get('memory_percent', 'N/A')}%")
    print(f"   Disk Usage: {system_metrics.get('disk_percent', 'N/A')}%")
    
    print("Database Metrics Summary:")
    print(f"   Database Size: {database_metrics.get('database_size_mb', 'N/A')} MB")
    print(f"   Active Connections: {database_metrics.get('connection_count', 'N/A')}")
    
    print("Application Metrics Summary:")
    print(f"   Total Users: {application_metrics.get('total_users', 'N/A')}")
    print(f"   Active Users: {application_metrics.get('active_users', 'N/A')}")
    print(f"   Total Projects: {application_metrics.get('total_projects', 'N/A')}")
    print(f"   Active Projects: {application_metrics.get('active_projects', 'N/A')}")
    
    print("Metrics collection completed!")

if __name__ == "__main__":
    main()
