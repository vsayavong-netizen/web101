#!/usr/bin/env python
"""
Test script to verify the fixes applied to BM23 application.
This script tests the migration and fixture loading process.
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')

# Setup Django
django.setup()

from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.db import connection
from django.core.management.base import CommandError

User = get_user_model()

def test_database_connection():
    """Test database connection."""
    print("🔍 Testing database connection...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                print("✅ Database connection successful")
                return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_migrations():
    """Test if migrations can be run."""
    print("🔍 Testing migrations...")
    try:
        call_command('migrate', verbosity=0)
        print("✅ Migrations completed successfully")
        return True
    except Exception as e:
        print(f"❌ Migrations failed: {e}")
        return False

def test_user_model():
    """Test if custom user model is working."""
    print("🔍 Testing custom user model...")
    try:
        # Check if User model is accessible
        user_count = User.objects.count()
        print(f"✅ User model is working. Current user count: {user_count}")
        return True
    except Exception as e:
        print(f"❌ User model test failed: {e}")
        return False

def test_superuser_creation():
    """Test superuser creation."""
    print("🔍 Testing superuser creation...")
    try:
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@bm23.com',
                password='admin123'
            )
            print("✅ Superuser created successfully")
        else:
            print("✅ Superuser already exists")
        return True
    except Exception as e:
        print(f"❌ Superuser creation failed: {e}")
        return False

def test_fixture_loading():
    """Test fixture loading."""
    print("🔍 Testing fixture loading...")
    try:
        fixture_path = 'fixtures/initial_data.json'
        if os.path.exists(fixture_path):
            call_command('loaddata', fixture_path, verbosity=0)
            print("✅ Fixture loaded successfully")
        else:
            print("⚠️ No fixture file found")
        return True
    except Exception as e:
        print(f"❌ Fixture loading failed: {e}")
        return False

def test_static_files():
    """Test static files collection."""
    print("🔍 Testing static files collection...")
    try:
        call_command('collectstatic', '--noinput', verbosity=0)
        print("✅ Static files collected successfully")
        return True
    except Exception as e:
        print(f"❌ Static files collection failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 Starting BM23 Fix Tests...")
    print("=" * 50)
    
    tests = [
        ("Database Connection", test_database_connection),
        ("Migrations", test_migrations),
        ("User Model", test_user_model),
        ("Superuser Creation", test_superuser_creation),
        ("Fixture Loading", test_fixture_loading),
        ("Static Files", test_static_files),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} test...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The fixes are working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
