"""
Performance Monitoring Dashboard
Real-time performance monitoring and analytics
"""

import os
import django
import psutil
import time
from datetime import datetime, timedelta
from pathlib import Path

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.db import connection
from django.core.cache import cache
from django.contrib.auth import get_user_model

User = get_user_model()

def get_system_metrics():
    """Get system performance metrics"""
    print("=" * 60)
    print("PERFORMANCE MONITORING")
    print("=" * 60)
    
    # 1. System metrics
    print("\n1. System Metrics...")
    
    try:
        # CPU metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        print(f"OK CPU Usage: {cpu_percent}% ({cpu_count} cores)")
        
        # Memory metrics
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_total = memory.total / (1024**3)  # GB
        memory_available = memory.available / (1024**3)  # GB
        print(f"OK Memory Usage: {memory_percent}% ({memory_available:.1f}GB / {memory_total:.1f}GB)")
        
        # Disk metrics
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_total = disk.total / (1024**3)  # GB
        disk_free = disk.free / (1024**3)  # GB
        print(f"OK Disk Usage: {disk_percent}% ({disk_free:.1f}GB / {disk_total:.1f}GB)")
        
        # Network metrics
        network = psutil.net_io_counters()
        print(f"OK Network: {network.bytes_sent} bytes sent, {network.bytes_recv} bytes received")
        
    except Exception as e:
        print(f"FAIL System metrics failed: {e}")
        return False
    
    # 2. Database metrics
    print("\n2. Database Metrics...")
    
    try:
        start_time = time.time()
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            result = cursor.fetchone()
        
        db_time = time.time() - start_time
        print(f"OK Database Response Time: {db_time:.3f}s")
        
        # Connection count
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM pg_stat_activity")
            connections = cursor.fetchone()[0]
            print(f"OK Database Connections: {connections}")
        
    except Exception as e:
        print(f"FAIL Database metrics failed: {e}")
        return False
    
    # 3. Cache metrics
    print("\n3. Cache Metrics...")
    
    try:
        start_time = time.time()
        
        cache.set('perf_test', 'ok', 30)
        result = cache.get('perf_test')
        
        cache_time = time.time() - start_time
        print(f"OK Cache Response Time: {cache_time:.3f}s")
        
        if result == 'ok':
            print("OK Cache Status: Working")
        else:
            print("WARN Cache Status: Not working")
        
    except Exception as e:
        print(f"FAIL Cache metrics failed: {e}")
        return False
    
    # 4. Application metrics
    print("\n4. Application Metrics...")
    
    try:
        # User count
        user_count = User.objects.count()
        print(f"OK Total Users: {user_count}")
        
        # Active users (last 24 hours)
        from django.utils import timezone
        yesterday = timezone.now() - timedelta(days=1)
        active_users = User.objects.filter(last_login__gte=yesterday).count()
        print(f"OK Active Users (24h): {active_users}")
        
        # Database queries
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            migration_count = cursor.fetchone()[0]
            print(f"OK Database Migrations: {migration_count}")
        
    except Exception as e:
        print(f"FAIL Application metrics failed: {e}")
        return False
    
    return True

def get_performance_alerts():
    """Get performance alerts"""
    print("\n" + "=" * 60)
    print("PERFORMANCE ALERTS")
    print("=" * 60)
    
    alerts = []
    
    # 1. CPU alerts
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        if cpu_percent > 80:
            alerts.append(f"WARN High CPU usage: {cpu_percent}%")
        elif cpu_percent > 90:
            alerts.append(f"CRITICAL Very high CPU usage: {cpu_percent}%")
    except Exception as e:
        alerts.append(f"FAIL CPU monitoring failed: {e}")
    
    # 2. Memory alerts
    try:
        memory = psutil.virtual_memory()
        if memory.percent > 85:
            alerts.append(f"WARN High memory usage: {memory.percent}%")
        elif memory.percent > 95:
            alerts.append(f"CRITICAL Very high memory usage: {memory.percent}%")
    except Exception as e:
        alerts.append(f"FAIL Memory monitoring failed: {e}")
    
    # 3. Disk alerts
    try:
        disk = psutil.disk_usage('/')
        if disk.percent > 90:
            alerts.append(f"WARN High disk usage: {disk.percent}%")
        elif disk.percent > 95:
            alerts.append(f"CRITICAL Very high disk usage: {disk.percent}%")
    except Exception as e:
        alerts.append(f"FAIL Disk monitoring failed: {e}")
    
    # 4. Database alerts
    try:
        start_time = time.time()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_time = time.time() - start_time
        
        if db_time > 2.0:
            alerts.append(f"WARN Slow database response: {db_time:.3f}s")
        elif db_time > 5.0:
            alerts.append(f"CRITICAL Very slow database response: {db_time:.3f}s")
    except Exception as e:
        alerts.append(f"FAIL Database monitoring failed: {e}")
    
    # 5. Cache alerts
    try:
        start_time = time.time()
        cache.set('perf_test', 'ok', 30)
        result = cache.get('perf_test')
        cache_time = time.time() - start_time
        
        if cache_time > 0.5:
            alerts.append(f"WARN Slow cache response: {cache_time:.3f}s")
        elif result != 'ok':
            alerts.append("CRITICAL Cache not working")
    except Exception as e:
        alerts.append(f"FAIL Cache monitoring failed: {e}")
    
    # Display alerts
    if alerts:
        for alert in alerts:
            print(alert)
    else:
        print("OK No performance alerts")
    
    return alerts

def create_performance_report():
    """Create performance report"""
    print("\n" + "=" * 60)
    print("PERFORMANCE REPORT")
    print("=" * 60)
    
    # 1. System summary
    print("\n1. System Summary...")
    
    try:
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_status = "OK" if cpu_percent < 80 else "WARN" if cpu_percent < 90 else "CRITICAL"
        print(f"{cpu_status} CPU: {cpu_percent}%")
        
        # Memory
        memory = psutil.virtual_memory()
        memory_status = "OK" if memory.percent < 85 else "WARN" if memory.percent < 95 else "CRITICAL"
        print(f"{memory_status} Memory: {memory.percent}%")
        
        # Disk
        disk = psutil.disk_usage('/')
        disk_status = "OK" if disk.percent < 90 else "WARN" if disk.percent < 95 else "CRITICAL"
        print(f"{disk_status} Disk: {disk.percent}%")
        
    except Exception as e:
        print(f"FAIL System summary failed: {e}")
    
    # 2. Application summary
    print("\n2. Application Summary...")
    
    try:
        # Users
        user_count = User.objects.count()
        print(f"OK Total Users: {user_count}")
        
        # Active users
        from django.utils import timezone
        yesterday = timezone.now() - timedelta(days=1)
        active_users = User.objects.filter(last_login__gte=yesterday).count()
        print(f"OK Active Users: {active_users}")
        
        # Database
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            migration_count = cursor.fetchone()[0]
            print(f"OK Migrations: {migration_count}")
        
    except Exception as e:
        print(f"FAIL Application summary failed: {e}")
    
    # 3. Performance summary
    print("\n3. Performance Summary...")
    
    try:
        # Database performance
        start_time = time.time()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_time = time.time() - start_time
        db_status = "OK" if db_time < 1.0 else "WARN" if db_time < 2.0 else "CRITICAL"
        print(f"{db_status} Database: {db_time:.3f}s")
        
        # Cache performance
        start_time = time.time()
        cache.set('perf_test', 'ok', 30)
        result = cache.get('perf_test')
        cache_time = time.time() - start_time
        cache_status = "OK" if cache_time < 0.1 else "WARN" if cache_time < 0.5 else "CRITICAL"
        print(f"{cache_status} Cache: {cache_time:.3f}s")
        
    except Exception as e:
        print(f"FAIL Performance summary failed: {e}")
    
    # 4. Recommendations
    print("\n4. Recommendations...")
    
    try:
        recommendations = []
        
        # CPU recommendations
        cpu_percent = psutil.cpu_percent(interval=1)
        if cpu_percent > 80:
            recommendations.append("Consider CPU optimization or scaling")
        
        # Memory recommendations
        memory = psutil.virtual_memory()
        if memory.percent > 85:
            recommendations.append("Consider memory optimization or scaling")
        
        # Disk recommendations
        disk = psutil.disk_usage('/')
        if disk.percent > 90:
            recommendations.append("Consider disk cleanup or expansion")
        
        # Database recommendations
        start_time = time.time()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_time = time.time() - start_time
        if db_time > 1.0:
            recommendations.append("Consider database optimization")
        
        if recommendations:
            for rec in recommendations:
                print(f"RECOMMENDATION: {rec}")
        else:
            print("OK No recommendations needed")
        
    except Exception as e:
        print(f"FAIL Recommendations failed: {e}")
    
    return True

def run_performance_monitoring():
    """Run complete performance monitoring"""
    print("=" * 80)
    print("PERFORMANCE MONITORING DASHBOARD")
    print("=" * 80)
    print(f"Monitoring started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run all monitoring
    metrics_ok = get_system_metrics()
    alerts = get_performance_alerts()
    report_ok = create_performance_report()
    
    # Final status
    print("\n" + "=" * 80)
    print("PERFORMANCE MONITORING COMPLETE!")
    print("=" * 80)
    
    if metrics_ok:
        print("OK System metrics collected")
    else:
        print("FAIL System metrics failed")
    
    if alerts:
        print(f"WARN {len(alerts)} performance alerts detected")
    else:
        print("OK No performance alerts")
    
    if report_ok:
        print("OK Performance report generated")
    else:
        print("FAIL Performance report failed")
    
    overall_status = metrics_ok and report_ok
    
    if overall_status:
        print("\nSUCCESS: PERFORMANCE MONITORING SUCCESSFUL!")
        print("OK System performance is good")
        print("OK All metrics collected")
        print("OK Performance report ready")
    else:
        print("\nWARNING: PERFORMANCE MONITORING ISSUES!")
        print("FAIL Some monitoring failed")
        print("FAIL Review performance issues")
        print("FAIL Address system problems")
    
    print("\nNext steps:")
    if overall_status:
        print("1. Continue monitoring")
        print("2. Set up automated alerts")
        print("3. Optimize based on metrics")
        print("4. Plan capacity scaling")
    else:
        print("1. Fix monitoring issues")
        print("2. Address performance problems")
        print("3. Re-run monitoring")
        print("4. Ensure system stability")
    
    print("=" * 80)
    
    return overall_status

if __name__ == '__main__':
    run_performance_monitoring()
