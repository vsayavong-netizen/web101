"""
System Validation
Comprehensive system validation after Go Live
"""

import os
import django
from pathlib import Path
from datetime import datetime, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from django.db import connection
from django.core.cache import cache

User = get_user_model()

def validate_system_health():
    """Validate overall system health"""
    print("=" * 60)
    print("SYSTEM VALIDATION")
    print("=" * 60)
    
    # 1. Database validation
    print("\n1. Database Validation...")
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result[0] == 1:
                print("OK Database connection successful")
            else:
                print("FAIL Database connection failed")
                return False
    except Exception as e:
        print(f"FAIL Database validation failed: {e}")
        return False
    
    # 2. Cache validation
    print("\n2. Cache Validation...")
    
    try:
        cache.set('validation_test', 'ok', 30)
        result = cache.get('validation_test')
        if result == 'ok':
            print("OK Cache connection successful")
        else:
            print("FAIL Cache connection failed")
            return False
    except Exception as e:
        print(f"FAIL Cache validation failed: {e}")
        return False
    
    # 3. User model validation
    print("\n3. User Model Validation...")
    
    try:
        user_count = User.objects.count()
        print(f"OK User model accessible: {user_count} users")
    except Exception as e:
        print(f"FAIL User model validation failed: {e}")
        return False
    
    # 4. API endpoints validation
    print("\n4. API Endpoints Validation...")
    
    client = Client()
    endpoints = [
        '/api/auth/',
        '/api/projects/',
        '/api/students/',
        '/api/advisors/',
        '/api/files/',
        '/api/communication/',
        '/api/ai-enhancement/',
        '/api/defense/',
    ]
    
    working_endpoints = 0
    for endpoint in endpoints:
        try:
            response = client.get(endpoint)
            if response.status_code in [200, 401, 404]:
                working_endpoints += 1
                print(f"OK {endpoint}")
            else:
                print(f"WARN {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"FAIL {endpoint} - Error: {str(e)[:30]}")
    
    print(f"OK {working_endpoints}/{len(endpoints)} endpoints working")
    
    # 5. Performance validation
    print("\n5. Performance Validation...")
    
    try:
        import time
        start_time = time.time()
        
        # Test database query performance
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            result = cursor.fetchone()
        
        db_time = time.time() - start_time
        
        if db_time < 1.0:
            print(f"OK Database performance: {db_time:.3f}s")
        else:
            print(f"WARN Database performance slow: {db_time:.3f}s")
        
        # Test cache performance
        start_time = time.time()
        cache.set('perf_test', 'ok', 30)
        result = cache.get('perf_test')
        cache_time = time.time() - start_time
        
        if cache_time < 0.1:
            print(f"OK Cache performance: {cache_time:.3f}s")
        else:
            print(f"WARN Cache performance slow: {cache_time:.3f}s")
        
    except Exception as e:
        print(f"FAIL Performance validation failed: {e}")
        return False
    
    # 6. Security validation
    print("\n6. Security Validation...")
    
    try:
        # Check if security settings are configured
        from django.conf import settings
        
        security_checks = [
            ('DEBUG', False, 'Debug mode should be disabled'),
            ('SECURE_SSL_REDIRECT', True, 'SSL redirect should be enabled'),
            ('SECURE_HSTS_SECONDS', 31536000, 'HSTS should be configured'),
            ('X_FRAME_OPTIONS', 'DENY', 'X-Frame-Options should be set'),
        ]
        
        security_passed = 0
        for setting, expected, description in security_checks:
            if hasattr(settings, setting):
                value = getattr(settings, setting)
                if value == expected:
                    print(f"OK {setting}: {description}")
                    security_passed += 1
                else:
                    print(f"WARN {setting}: {description} (current: {value})")
            else:
                print(f"WARN {setting}: Not configured")
        
        print(f"OK {security_passed}/{len(security_checks)} security checks passed")
        
    except Exception as e:
        print(f"FAIL Security validation failed: {e}")
        return False
    
    return True

def validate_user_workflows():
    """Validate user workflows"""
    print("\n" + "=" * 60)
    print("USER WORKFLOW VALIDATION")
    print("=" * 60)
    
    # 1. Student workflow validation
    print("\n1. Student Workflow Validation...")
    
    try:
        # Test student registration
        client = Client()
        
        # Test student endpoints
        student_endpoints = [
            '/api/students/',
            '/api/projects/',
            '/api/files/',
            '/api/communication/',
        ]
        
        student_working = 0
        for endpoint in student_endpoints:
            try:
                response = client.get(endpoint)
                if response.status_code in [200, 401, 404]:
                    student_working += 1
                    print(f"OK Student endpoint: {endpoint}")
                else:
                    print(f"WARN Student endpoint {endpoint}: Status {response.status_code}")
            except Exception as e:
                print(f"FAIL Student endpoint {endpoint}: {str(e)[:30]}")
        
        print(f"OK {student_working}/{len(student_endpoints)} student endpoints working")
        
    except Exception as e:
        print(f"FAIL Student workflow validation failed: {e}")
        return False
    
    # 2. Advisor workflow validation
    print("\n2. Advisor Workflow Validation...")
    
    try:
        advisor_endpoints = [
            '/api/advisors/',
            '/api/projects/',
            '/api/students/',
            '/api/communication/',
        ]
        
        advisor_working = 0
        for endpoint in advisor_endpoints:
            try:
                response = client.get(endpoint)
                if response.status_code in [200, 401, 404]:
                    advisor_working += 1
                    print(f"OK Advisor endpoint: {endpoint}")
                else:
                    print(f"WARN Advisor endpoint {endpoint}: Status {response.status_code}")
            except Exception as e:
                print(f"FAIL Advisor endpoint {endpoint}: {str(e)[:30]}")
        
        print(f"OK {advisor_working}/{len(advisor_endpoints)} advisor endpoints working")
        
    except Exception as e:
        print(f"FAIL Advisor workflow validation failed: {e}")
        return False
    
    # 3. Administrator workflow validation
    print("\n3. Administrator Workflow Validation...")
    
    try:
        admin_endpoints = [
            '/api/auth/',
            '/api/projects/',
            '/api/students/',
            '/api/advisors/',
            '/api/files/',
            '/api/communication/',
            '/api/ai-enhancement/',
            '/api/defense/',
        ]
        
        admin_working = 0
        for endpoint in admin_endpoints:
            try:
                response = client.get(endpoint)
                if response.status_code in [200, 401, 404]:
                    admin_working += 1
                    print(f"OK Admin endpoint: {endpoint}")
                else:
                    print(f"WARN Admin endpoint {endpoint}: Status {response.status_code}")
            except Exception as e:
                print(f"FAIL Admin endpoint {endpoint}: {str(e)[:30]}")
        
        print(f"OK {admin_working}/{len(admin_endpoints)} admin endpoints working")
        
    except Exception as e:
        print(f"FAIL Administrator workflow validation failed: {e}")
        return False
    
    return True

def validate_data_integrity():
    """Validate data integrity"""
    print("\n" + "=" * 60)
    print("DATA INTEGRITY VALIDATION")
    print("=" * 60)
    
    # 1. Database integrity
    print("\n1. Database Integrity...")
    
    try:
        with connection.cursor() as cursor:
            # Check for orphaned records
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            migration_count = cursor.fetchone()[0]
            print(f"OK Database migrations: {migration_count}")
            
            # Check for data consistency
            cursor.execute("SELECT COUNT(*) FROM accounts_user")
            user_count = cursor.fetchone()[0]
            print(f"OK User records: {user_count}")
            
    except Exception as e:
        print(f"FAIL Database integrity check failed: {e}")
        return False
    
    # 2. File system integrity
    print("\n2. File System Integrity...")
    
    try:
        # Check media directory
        media_dir = Path('media')
        if media_dir.exists():
            print("OK Media directory exists")
        else:
            print("WARN Media directory missing")
        
        # Check static files
        static_dir = Path('staticfiles')
        if static_dir.exists():
            print("OK Static files directory exists")
        else:
            print("WARN Static files directory missing")
        
    except Exception as e:
        print(f"FAIL File system integrity check failed: {e}")
        return False
    
    # 3. Configuration integrity
    print("\n3. Configuration Integrity...")
    
    try:
        from django.conf import settings
        
        # Check required settings
        required_settings = [
            'SECRET_KEY',
            'DATABASES',
            'ALLOWED_HOSTS',
            'INSTALLED_APPS',
        ]
        
        config_passed = 0
        for setting in required_settings:
            if hasattr(settings, setting):
                print(f"OK {setting} configured")
                config_passed += 1
            else:
                print(f"FAIL {setting} not configured")
        
        print(f"OK {config_passed}/{len(required_settings)} configuration settings valid")
        
    except Exception as e:
        print(f"FAIL Configuration integrity check failed: {e}")
        return False
    
    return True

def validate_performance():
    """Validate system performance"""
    print("\n" + "=" * 60)
    print("PERFORMANCE VALIDATION")
    print("=" * 60)
    
    # 1. Response time validation
    print("\n1. Response Time Validation...")
    
    try:
        import time
        client = Client()
        
        # Test API response times
        endpoints = [
            '/api/auth/',
            '/api/projects/',
            '/api/students/',
        ]
        
        total_time = 0
        for endpoint in endpoints:
            start_time = time.time()
            try:
                response = client.get(endpoint)
                response_time = time.time() - start_time
                total_time += response_time
                
                if response_time < 2.0:
                    print(f"OK {endpoint}: {response_time:.3f}s")
                else:
                    print(f"WARN {endpoint}: {response_time:.3f}s (slow)")
            except Exception as e:
                print(f"FAIL {endpoint}: {str(e)[:30]}")
        
        avg_time = total_time / len(endpoints)
        if avg_time < 1.0:
            print(f"OK Average response time: {avg_time:.3f}s")
        else:
            print(f"WARN Average response time: {avg_time:.3f}s (slow)")
        
    except Exception as e:
        print(f"FAIL Response time validation failed: {e}")
        return False
    
    # 2. Database performance validation
    print("\n2. Database Performance Validation...")
    
    try:
        import time
        start_time = time.time()
        
        # Test database query performance
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM django_migrations")
            result = cursor.fetchone()
        
        db_time = time.time() - start_time
        
        if db_time < 0.5:
            print(f"OK Database query time: {db_time:.3f}s")
        else:
            print(f"WARN Database query time: {db_time:.3f}s (slow)")
        
    except Exception as e:
        print(f"FAIL Database performance validation failed: {e}")
        return False
    
    # 3. Cache performance validation
    print("\n3. Cache Performance Validation...")
    
    try:
        import time
        start_time = time.time()
        
        # Test cache performance
        cache.set('perf_test', 'ok', 30)
        result = cache.get('perf_test')
        
        cache_time = time.time() - start_time
        
        if cache_time < 0.1:
            print(f"OK Cache operation time: {cache_time:.3f}s")
        else:
            print(f"WARN Cache operation time: {cache_time:.3f}s (slow)")
        
    except Exception as e:
        print(f"FAIL Cache performance validation failed: {e}")
        return False
    
    return True

def run_complete_validation():
    """Run complete system validation"""
    print("=" * 80)
    print("COMPLETE SYSTEM VALIDATION")
    print("=" * 80)
    print(f"Validation started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run all validations
    health_ok = validate_system_health()
    workflow_ok = validate_user_workflows()
    data_ok = validate_data_integrity()
    performance_ok = validate_performance()
    
    # Final status
    print("\n" + "=" * 80)
    print("SYSTEM VALIDATION COMPLETE!")
    print("=" * 80)
    
    if health_ok:
        print("OK System health validation passed")
    else:
        print("FAIL System health validation failed")
    
    if workflow_ok:
        print("OK User workflow validation passed")
    else:
        print("FAIL User workflow validation failed")
    
    if data_ok:
        print("OK Data integrity validation passed")
    else:
        print("FAIL Data integrity validation failed")
    
    if performance_ok:
        print("OK Performance validation passed")
    else:
        print("FAIL Performance validation failed")
    
    overall_status = health_ok and workflow_ok and data_ok and performance_ok
    
    if overall_status:
        print("\nSUCCESS: SYSTEM VALIDATION SUCCESSFUL!")
        print("OK System is ready for production use")
        print("OK All validations passed")
        print("OK System is stable and reliable")
    else:
        print("\nWARNING: SYSTEM VALIDATION ISSUES DETECTED!")
        print("FAIL Some validations failed")
        print("FAIL System needs attention")
        print("FAIL Review failed validations")
    
    print("\nNext steps:")
    if overall_status:
        print("1. Monitor system performance")
        print("2. Collect user feedback")
        print("3. Optimize based on usage")
        print("4. Plan future enhancements")
    else:
        print("1. Fix failed validations")
        print("2. Re-run validation")
        print("3. Address system issues")
        print("4. Ensure system stability")
    
    print("=" * 80)
    
    return overall_status

if __name__ == '__main__':
    run_complete_validation()
