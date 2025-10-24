#!/usr/bin/env python
"""
Health check script for BM23 application
"""

import os
import sys
import django
import requests
import time
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

def check_database():
    """Check database connectivity"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return True, "Database connection successful"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

def check_cache():
    """Check cache connectivity"""
    try:
        cache.set('health_check', 'ok', 10)
        result = cache.get('health_check')
        if result == 'ok':
            return True, "Cache connection successful"
        else:
            return False, "Cache test failed"
    except Exception as e:
        return False, f"Cache connection failed: {str(e)}"

def check_static_files():
    """Check if static files are accessible"""
    try:
        static_root = settings.STATIC_ROOT
        if os.path.exists(static_root):
            return True, "Static files directory exists"
        else:
            return False, "Static files directory not found"
    except Exception as e:
        return False, f"Static files check failed: {str(e)}"

def check_media_files():
    """Check if media files directory exists"""
    try:
        media_root = settings.MEDIA_ROOT
        if os.path.exists(media_root):
            return True, "Media files directory exists"
        else:
            return False, "Media files directory not found"
    except Exception as e:
        return False, f"Media files check failed: {str(e)}"

def check_api_endpoints():
    """Check if API endpoints are responding"""
    try:
        base_url = "http://localhost:8000"
        endpoints = [
            "/api/",
            "/api/auth/",
            "/api/projects/",
            "/api/students/",
            "/api/advisors/",
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                if response.status_code in [200, 401, 403]:  # 401/403 are OK for protected endpoints
                    continue
                else:
                    return False, f"API endpoint {endpoint} returned {response.status_code}"
            except requests.exceptions.RequestException:
                return False, f"API endpoint {endpoint} is not accessible"
        
        return True, "All API endpoints are responding"
    except Exception as e:
        return False, f"API check failed: {str(e)}"

def check_environment_variables():
    """Check if required environment variables are set"""
    required_vars = [
        'SECRET_KEY',
        'DEBUG',
        'ALLOWED_HOSTS',
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        return False, f"Missing environment variables: {', '.join(missing_vars)}"
    else:
        return True, "All required environment variables are set"

def main():
    """Run all health checks"""
    print("Running BM23 Health Checks...")
    print("=" * 50)
    
    checks = [
        ("Environment Variables", check_environment_variables),
        ("Database", check_database),
        ("Cache", check_cache),
        ("Static Files", check_static_files),
        ("Media Files", check_media_files),
        ("API Endpoints", check_api_endpoints),
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        print(f"Checking {check_name}...", end=" ")
        try:
            passed, message = check_func()
            if passed:
                print("PASS")
                print(f"   {message}")
            else:
                print("FAIL")
                print(f"   {message}")
                all_passed = False
        except Exception as e:
            print("ERROR")
            print(f"   {str(e)}")
            all_passed = False
        print()
    
    print("=" * 50)
    if all_passed:
        print("All health checks passed! System is healthy.")
        sys.exit(0)
    else:
        print("Some health checks failed. Please review the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
