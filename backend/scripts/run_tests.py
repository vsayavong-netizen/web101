#!/usr/bin/env python
"""
Test runner script for the Final Project Management system.
"""
import os
import sys
import subprocess
import django
from django.conf import settings
from django.test.utils import get_runner

def run_tests():
    """Run the test suite with coverage and reporting."""
    
    # Set up Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
    django.setup()
    
    print("🧪 Running Final Project Management Test Suite")
    print("=" * 50)
    
    # Test categories
    test_categories = [
        ('unit', 'Unit Tests'),
        ('integration', 'Integration Tests'),
        ('api', 'API Tests'),
        ('websocket', 'WebSocket Tests'),
        ('models', 'Model Tests'),
        ('views', 'View Tests'),
        ('auth', 'Authentication Tests'),
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    
    for category, description in test_categories:
        print(f"\n📋 Running {description}...")
        print("-" * 30)
        
        try:
            # Run tests with coverage
            result = subprocess.run([
                'pytest', 
                f'-m {category}',
                '--cov=.',
                '--cov-report=html',
                '--cov-report=term-missing',
                '--tb=short',
                '-v'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"✅ {description} PASSED")
                passed_tests += 1
            else:
                print(f"❌ {description} FAILED")
                print(result.stdout)
                print(result.stderr)
                failed_tests += 1
                
        except Exception as e:
            print(f"❌ Error running {description}: {e}")
            failed_tests += 1
        
        total_tests += 1
    
    # Run all tests together
    print(f"\n📋 Running All Tests...")
    print("-" * 30)
    
    try:
        result = subprocess.run([
            'pytest',
            '--cov=.',
            '--cov-report=html',
            '--cov-report=term-missing',
            '--tb=short',
            '-v',
            '--junitxml=test-results.xml'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ All Tests PASSED")
        else:
            print("❌ Some Tests FAILED")
            print(result.stdout)
            print(result.stderr)
            
    except Exception as e:
        print(f"❌ Error running all tests: {e}")
    
    # Performance tests
    print(f"\n📋 Running Performance Tests...")
    print("-" * 30)
    
    try:
        result = subprocess.run([
            'pytest',
            '-m slow',
            '--tb=short',
            '-v'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Performance Tests PASSED")
        else:
            print("❌ Performance Tests FAILED")
            
    except Exception as e:
        print(f"❌ Error running performance tests: {e}")
    
    # Security tests
    print(f"\n📋 Running Security Tests...")
    print("-" * 30)
    
    try:
        result = subprocess.run([
            'pytest',
            'tests/test_security.py',
            '--tb=short',
            '-v'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Security Tests PASSED")
        else:
            print("❌ Security Tests FAILED")
            
    except Exception as e:
        print(f"❌ Error running security tests: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Total Test Categories: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if failed_tests > 0:
        print("\n❌ Some tests failed. Please check the output above.")
        sys.exit(1)
    else:
        print("\n✅ All tests passed successfully!")
        sys.exit(0)

if __name__ == '__main__':
    run_tests()
