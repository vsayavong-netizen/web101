#!/usr/bin/env python
"""
BM23 Automated Testing Suite
Comprehensive testing for all system components
"""

import os
import sys
import django
import json
import time
import requests
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(project_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.conf import settings

class AutomatedTestSuite:
    def __init__(self):
        self.test_results = {
            'timestamp': datetime.now().isoformat(),
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_categories': {},
            'test_details': [],
            'overall_status': 'unknown'
        }
        self.client = Client()
    
    def run_test(self, test_name, test_func, category='general'):
        """Run a single test and record results"""
        self.test_results['total_tests'] += 1
        
        try:
            result = test_func()
            if result:
                self.test_results['passed_tests'] += 1
                status = 'PASS'
                message = 'Test passed successfully'
            else:
                self.test_results['failed_tests'] += 1
                status = 'FAIL'
                message = 'Test failed'
        except Exception as e:
            self.test_results['failed_tests'] += 1
            status = 'ERROR'
            message = f'Test error: {str(e)}'
        
        # Record test details
        test_detail = {
            'name': test_name,
            'category': category,
            'status': status,
            'message': message,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results['test_details'].append(test_detail)
        
        # Update category results
        if category not in self.test_results['test_categories']:
            self.test_results['test_categories'][category] = {'passed': 0, 'failed': 0, 'total': 0}
        
        self.test_results['test_categories'][category]['total'] += 1
        if status == 'PASS':
            self.test_results['test_categories'][category]['passed'] += 1
        else:
            self.test_results['test_categories'][category]['failed'] += 1
        
        return status == 'PASS'
    
    def test_database_connection(self):
        """Test database connectivity"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                return True
        except:
            return False
    
    def test_database_migrations(self):
        """Test if all migrations are applied"""
        try:
            from django.core.management import call_command
            from io import StringIO
            out = StringIO()
            call_command('showmigrations', '--plan', stdout=out)
            return ']' not in out.getvalue()
        except:
            return False
    
    def test_user_model(self):
        """Test user model functionality"""
        try:
            User = get_user_model()
            # Test user creation
            user = User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='testpass123'
            )
            # Test user retrieval
            retrieved_user = User.objects.get(username='testuser')
            # Test user deletion
            user.delete()
            return True
        except:
            return False
    
    def test_api_endpoints(self):
        """Test API endpoints availability"""
        try:
            base_url = "http://localhost:8000"
            endpoints = [
                "/api/",
                "/api/auth/",
                "/api/projects/",
                "/api/students/",
                "/api/advisors/"
            ]
            
            for endpoint in endpoints:
                try:
                    response = requests.get(f"{base_url}{endpoint}", timeout=5)
                    if response.status_code not in [200, 401, 403]:
                        return False
                except requests.exceptions.RequestException:
                    return False
            return True
        except:
            return False
    
    def test_authentication(self):
        """Test authentication system"""
        try:
            User = get_user_model()
            # Create test user
            user = User.objects.create_user(
                username='authtest',
                email='authtest@example.com',
                password='authtest123'
            )
            
            # Test login
            response = self.client.post('/api/auth/login/', {
                'username': 'authtest',
                'password': 'authtest123'
            })
            
            # Clean up
            user.delete()
            
            return response.status_code == 200
        except:
            return False
    
    def test_static_files(self):
        """Test static files configuration"""
        try:
            static_root = settings.STATIC_ROOT
            return os.path.exists(static_root)
        except:
            return False
    
    def test_media_files(self):
        """Test media files configuration"""
        try:
            media_root = settings.MEDIA_ROOT
            return os.path.exists(media_root)
        except:
            return False
    
    def test_cache_system(self):
        """Test cache system"""
        try:
            from django.core.cache import cache
            cache.set('test_key', 'test_value', 10)
            result = cache.get('test_key')
            return result == 'test_value'
        except:
            return False
    
    def test_logging_system(self):
        """Test logging system"""
        try:
            logs_dir = Path('logs')
            return logs_dir.exists()
        except:
            return False
    
    def test_security_settings(self):
        """Test security settings"""
        try:
            # Check if security settings are configured
            security_settings = [
                'SECURE_BROWSER_XSS_FILTER',
                'SECURE_CONTENT_TYPE_NOSNIFF',
                'X_FRAME_OPTIONS',
                'SESSION_COOKIE_SECURE',
                'CSRF_COOKIE_SECURE'
            ]
            
            for setting in security_settings:
                if not hasattr(settings, setting):
                    return False
            
            return True
        except:
            return False
    
    def test_cors_settings(self):
        """Test CORS settings"""
        try:
            cors_settings = [
                'CORS_ALLOWED_ORIGINS',
                'CORS_ALLOW_CREDENTIALS',
                'CORS_ALLOWED_HEADERS',
                'CORS_ALLOWED_METHODS'
            ]
            
            for setting in cors_settings:
                if not hasattr(settings, setting):
                    return False
            
            return True
        except:
            return False
    
    def test_environment_variables(self):
        """Test environment variables"""
        try:
            required_vars = [
                'SECRET_KEY',
                'DEBUG',
                'ALLOWED_HOSTS'
            ]
            
            for var in required_vars:
                if not hasattr(settings, var):
                    return False
            
            return True
        except:
            return False
    
    def test_docker_configuration(self):
        """Test Docker configuration files"""
        try:
            docker_files = [
                'Dockerfile',
                'docker-compose.yml',
                'docker-compose.prod.yml',
                'nginx.conf'
            ]
            
            for file in docker_files:
                if not Path(file).exists():
                    return False
            
            return True
        except:
            return False
    
    def test_backup_system(self):
        """Test backup system"""
        try:
            backup_script = Path('backup.py')
            return backup_script.exists()
        except:
            return False
    
    def test_monitoring_system(self):
        """Test monitoring system"""
        try:
            monitoring_scripts = [
                'health_check.py',
                'monitor.py',
                'system_status.py'
            ]
            
            for script in monitoring_scripts:
                if not Path(script).exists():
                    return False
            
            return True
        except:
            return False
    
    def test_documentation(self):
        """Test documentation completeness"""
        try:
            doc_files = [
                'README.md',
                'QUICK_START.md',
                'TROUBLESHOOTING.md',
                'MAINTENANCE_SCHEDULE.md',
                'SYSTEM_OVERVIEW.md',
                'FINAL_SUMMARY.md'
            ]
            
            for doc in doc_files:
                if not Path(doc).exists():
                    return False
            
            return True
        except:
            return False
    
    def test_performance(self):
        """Test system performance"""
        try:
            # Test database query performance
            start_time = time.time()
            User = get_user_model()
            User.objects.count()
            db_time = time.time() - start_time
            
            # Test cache performance
            start_time = time.time()
            from django.core.cache import cache
            cache.set('perf_test', 'value', 10)
            cache.get('perf_test')
            cache_time = time.time() - start_time
            
            # Performance thresholds
            return db_time < 1.0 and cache_time < 0.1
        except:
            return False
    
    def test_security_vulnerabilities(self):
        """Test for common security vulnerabilities"""
        try:
            # Check for debug mode in production
            if not settings.DEBUG:
                # Check for secure settings
                secure_settings = [
                    'SECURE_SSL_REDIRECT',
                    'SECURE_HSTS_SECONDS',
                    'SESSION_COOKIE_SECURE',
                    'CSRF_COOKIE_SECURE'
                ]
                
                for setting in secure_settings:
                    if not getattr(settings, setting, False):
                        return False
            
            return True
        except:
            return False
    
    def run_all_tests(self):
        """Run all automated tests"""
        print("Running BM23 Automated Test Suite...")
        print("=" * 50)
        
        # Database tests
        self.run_test("Database Connection", self.test_database_connection, "database")
        self.run_test("Database Migrations", self.test_database_migrations, "database")
        
        # Model tests
        self.run_test("User Model", self.test_user_model, "models")
        
        # API tests
        self.run_test("API Endpoints", self.test_api_endpoints, "api")
        self.run_test("Authentication", self.test_authentication, "api")
        
        # Configuration tests
        self.run_test("Static Files", self.test_static_files, "configuration")
        self.run_test("Media Files", self.test_media_files, "configuration")
        self.run_test("Cache System", self.test_cache_system, "configuration")
        self.run_test("Logging System", self.test_logging_system, "configuration")
        self.run_test("Environment Variables", self.test_environment_variables, "configuration")
        
        # Security tests
        self.run_test("Security Settings", self.test_security_settings, "security")
        self.run_test("CORS Settings", self.test_cors_settings, "security")
        self.run_test("Security Vulnerabilities", self.test_security_vulnerabilities, "security")
        
        # Infrastructure tests
        self.run_test("Docker Configuration", self.test_docker_configuration, "infrastructure")
        self.run_test("Backup System", self.test_backup_system, "infrastructure")
        self.run_test("Monitoring System", self.test_monitoring_system, "infrastructure")
        self.run_test("Documentation", self.test_documentation, "infrastructure")
        
        # Performance tests
        self.run_test("Performance", self.test_performance, "performance")
        
        # Determine overall status
        if self.test_results['failed_tests'] == 0:
            self.test_results['overall_status'] = 'excellent'
        elif self.test_results['failed_tests'] <= 2:
            self.test_results['overall_status'] = 'good'
        elif self.test_results['failed_tests'] <= 5:
            self.test_results['overall_status'] = 'fair'
        else:
            self.test_results['overall_status'] = 'poor'
        
        return self.test_results
    
    def print_test_report(self):
        """Print formatted test report"""
        print("\n" + "=" * 50)
        print("BM23 AUTOMATED TEST REPORT")
        print("=" * 50)
        
        # Overall status
        status_emoji = {
            'excellent': '🟢',
            'good': '🟡',
            'fair': '🟠',
            'poor': '🔴',
            'unknown': '⚪'
        }
        
        print(f"Overall Status: {status_emoji.get(self.test_results['overall_status'], '⚪')} {self.test_results['overall_status'].upper()}")
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"Passed: {self.test_results['passed_tests']}")
        print(f"Failed: {self.test_results['failed_tests']}")
        print(f"Success Rate: {(self.test_results['passed_tests'] / self.test_results['total_tests'] * 100):.1f}%")
        
        # Category results
        print(f"\n📊 TEST CATEGORIES:")
        for category, results in self.test_results['test_categories'].items():
            success_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0
            print(f"  {category.title()}: {results['passed']}/{results['total']} ({success_rate:.1f}%)")
        
        # Failed tests
        failed_tests = [test for test in self.test_results['test_details'] if test['status'] != 'PASS']
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  • {test['name']} ({test['category']}): {test['message']}")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        if self.test_results['failed_tests'] > 0:
            print("  • Review failed tests and fix issues")
            print("  • Run tests regularly to catch issues early")
            print("  • Consider adding more test coverage")
        else:
            print("  • All tests passed! System is healthy")
            print("  • Continue regular testing to maintain quality")
        
        print("\n" + "=" * 50)
    
    def save_test_report(self, filename=None):
        """Save test report to file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"logs/test_report_{timestamp}.json"
        
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        with open(filename, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"Test report saved to: {filename}")

def main():
    """Run automated test suite"""
    test_suite = AutomatedTestSuite()
    
    # Run all tests
    results = test_suite.run_all_tests()
    
    # Print test report
    test_suite.print_test_report()
    
    # Save test report
    test_suite.save_test_report()
    
    # Return exit code based on results
    if results['overall_status'] in ['excellent', 'good']:
        sys.exit(0)
    elif results['overall_status'] == 'fair':
        sys.exit(1)
    else:
        sys.exit(2)

if __name__ == "__main__":
    main()
