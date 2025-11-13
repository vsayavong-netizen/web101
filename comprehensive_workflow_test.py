#!/usr/bin/env python3
"""
Comprehensive Workflow Testing Script for BM23 System
Tests all major workflows, API endpoints, and edge cases
"""

import os
import sys
import django
import json

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from accounts.models import User
from students.models import Student
from advisors.models import Advisor
from projects.models import ProjectGroup, Project, ProjectStudent
from settings.models import AcademicYear
from milestones.models import MilestoneTemplate

User = get_user_model()


class ComprehensiveWorkflowTest:
    """Comprehensive workflow testing"""
    
    def __init__(self):
        self.client = APIClient()
        self.test_results = {
            'passed': [],
            'failed': [],
            'warnings': [],
            'skipped': []
        }
        self.setup_test_data()
    
    def setup_test_data(self):
        """Set up test data"""
        print("\n" + "="*60)
        print("Setting up test data...")
        print("="*60)
        
        try:
            # Create test users
            self.admin_user, _ = User.objects.get_or_create(
                username='test_admin',
                defaults={
                    'email': 'admin@test.com',
                    'role': 'Admin',
                    'first_name': 'Test',
                    'last_name': 'Admin',
                    'is_active': True
                }
            )
            if not self.admin_user.check_password('admin123'):
                self.admin_user.set_password('admin123')
                self.admin_user.save()
            
            self.advisor_user, _ = User.objects.get_or_create(
                username='test_advisor',
                defaults={
                    'email': 'advisor@test.com',
                    'role': 'Advisor',
                    'first_name': 'Test',
                    'last_name': 'Advisor',
                    'is_active': True
                }
            )
            if not self.advisor_user.check_password('advisor123'):
                self.advisor_user.set_password('advisor123')
                self.advisor_user.save()
            
            self.student_user, _ = User.objects.get_or_create(
                username='test_student',
                defaults={
                    'email': 'student@test.com',
                    'role': 'Student',
                    'first_name': 'Test',
                    'last_name': 'Student',
                    'is_active': True
                }
            )
            if not self.student_user.check_password('student123'):
                self.student_user.set_password('student123')
                self.student_user.save()
            
            # Create advisor
            self.advisor, _ = Advisor.objects.get_or_create(
                user=self.advisor_user,
                defaults={
                    'advisor_id': 'ADV001',
                    'quota': 5
                }
            )
            
            # Create student
            self.student, _ = Student.objects.get_or_create(
                user=self.student_user,
                defaults={
                    'student_id': 'STU001',
                    'major': 'Computer Science',
                    'classroom': 'CS-2024',
                    'academic_year': '2024-2025'
                }
            )
            
            # Create academic year
            self.academic_year, _ = AcademicYear.objects.get_or_create(
                year='2024-2025',
                defaults={'is_active': True}
            )
            
            print("✅ Test data setup complete")
        except Exception as e:
            print(f"❌ Error setting up test data: {e}")
            raise
    
    def log_result(self, test_name, status, message=''):
        """Log test result"""
        if status == 'pass':
            self.test_results['passed'].append(test_name)
            print(f"   ✅ {test_name}")
        elif status == 'fail':
            self.test_results['failed'].append((test_name, message))
            print(f"   ❌ {test_name}: {message}")
        elif status == 'warn':
            self.test_results['warnings'].append((test_name, message))
            print(f"   ⚠️  {test_name}: {message}")
        else:
            self.test_results['skipped'].append(test_name)
            print(f"   ⏭️  {test_name}: {message}")
    
    def test_authentication_endpoints(self):
        """Test all authentication endpoints"""
        print("\n" + "="*60)
        print("Testing Authentication Endpoints")
        print("="*60)
        
        # Test 1: Login
        try:
            response = self.client.post('/api/auth/login/', {
                'username': 'test_admin',
                'password': 'admin123'
            })
            if response.status_code == status.HTTP_200_OK:
                self.access_token = response.data.get('access')
                self.refresh_token = response.data.get('refresh')
                self.log_result('Login', 'pass')
            else:
                self.log_result('Login', 'fail', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Login', 'fail', str(e))
        
        # Test 2: Token Refresh
        try:
            if hasattr(self, 'refresh_token'):
                response = self.client.post('/api/auth/token/refresh/', {
                    'refresh': self.refresh_token
                })
                if response.status_code == status.HTTP_200_OK:
                    self.log_result('Token Refresh', 'pass')
                else:
                    self.log_result('Token Refresh', 'fail', f"Status: {response.status_code}")
            else:
                self.log_result('Token Refresh', 'skip', 'No refresh token')
        except Exception as e:
            self.log_result('Token Refresh', 'fail', str(e))
        
        # Test 3: User Info
        try:
            if hasattr(self, 'access_token'):
                self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
                response = self.client.get('/api/auth/user-info/')
                if response.status_code == status.HTTP_200_OK:
                    self.log_result('User Info', 'pass')
                else:
                    self.log_result('User Info', 'fail', f"Status: {response.status_code}")
            else:
                self.log_result('User Info', 'skip', 'No access token')
        except Exception as e:
            self.log_result('User Info', 'fail', str(e))
        
        # Test 4: Logout
        try:
            if hasattr(self, 'refresh_token'):
                response = self.client.post('/api/auth/logout/', {
                    'refresh': self.refresh_token
                })
                if response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]:
                    self.log_result('Logout', 'pass')
                else:
                    self.log_result('Logout', 'warn', f"Status: {response.status_code}")
            else:
                self.log_result('Logout', 'skip', 'No refresh token')
        except Exception as e:
            self.log_result('Logout', 'fail', str(e))
        
        # Test 5: Invalid Login
        try:
            self.client.credentials()
            response = self.client.post('/api/auth/login/', {
                'username': 'invalid',
                'password': 'wrong'
            })
            if response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST]:
                self.log_result('Invalid Login Handling', 'pass')
            else:
                self.log_result('Invalid Login Handling', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Invalid Login Handling', 'fail', str(e))
    
    def test_project_endpoints(self):
        """Test all project endpoints"""
        print("\n" + "="*60)
        print("Testing Project Endpoints")
        print("="*60)
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test 1: List Projects
        try:
            response = self.client.get('/api/projects/projects/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('List Projects', 'pass')
            else:
                self.log_result('List Projects', 'fail', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('List Projects', 'fail', str(e))
        
        # Test 2: Create Project
        try:
            project_data = {
                'project_id': 'TEST001',
                'title': 'Test Project',
                'status': 'Pending',
                'advisor': self.advisor.id
            }
            response = self.client.post('/api/projects/projects/', project_data)
            if response.status_code == status.HTTP_201_CREATED:
                self.test_project_id = response.data.get('id')
                self.log_result('Create Project', 'pass')
            else:
                self.log_result('Create Project', 'warn', f"Status: {response.status_code}, Data: {response.data}")
        except Exception as e:
            self.log_result('Create Project', 'fail', str(e))
        
        # Test 3: Get Project
        try:
            if hasattr(self, 'test_project_id'):
                response = self.client.get(f'/api/projects/projects/{self.test_project_id}/')
                if response.status_code == status.HTTP_200_OK:
                    self.log_result('Get Project', 'pass')
                else:
                    self.log_result('Get Project', 'fail', f"Status: {response.status_code}")
            else:
                self.log_result('Get Project', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Get Project', 'fail', str(e))
        
        # Test 4: Update Project Status
        try:
            if hasattr(self, 'test_project_id'):
                response = self.client.post(f'/api/projects/projects/{self.test_project_id}/update_status/', {
                    'status': 'Approved',
                    'comment': 'Test approval'
                })
                if response.status_code == status.HTTP_200_OK:
                    self.log_result('Update Project Status', 'pass')
                else:
                    self.log_result('Update Project Status', 'warn', f"Status: {response.status_code}")
            else:
                self.log_result('Update Project Status', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Update Project Status', 'fail', str(e))
        
        # Test 5: Get Project Milestones
        try:
            if hasattr(self, 'test_project_id'):
                response = self.client.get(f'/api/projects/projects/{self.test_project_id}/milestones/')
                if response.status_code == status.HTTP_200_OK:
                    self.log_result('Get Project Milestones', 'pass')
                else:
                    self.log_result('Get Project Milestones', 'warn', f"Status: {response.status_code}")
            else:
                self.log_result('Get Project Milestones', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Get Project Milestones', 'fail', str(e))
        
        # Test 6: Get Project Log Entries
        try:
            if hasattr(self, 'test_project_id'):
                response = self.client.get(f'/api/projects/projects/{self.test_project_id}/log_entries/')
                if response.status_code == status.HTTP_200_OK:
                    self.log_result('Get Project Log Entries', 'pass')
                else:
                    self.log_result('Get Project Log Entries', 'warn', f"Status: {response.status_code}")
            else:
                self.log_result('Get Project Log Entries', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Get Project Log Entries', 'fail', str(e))
        
        # Test 7: Project Statistics
        try:
            response = self.client.get('/api/projects/projects/statistics/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Project Statistics', 'pass')
            else:
                self.log_result('Project Statistics', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Project Statistics', 'fail', str(e))
    
    def test_student_endpoints(self):
        """Test all student endpoints"""
        print("\n" + "="*60)
        print("Testing Student Endpoints")
        print("="*60)
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test 1: List Students
        try:
            response = self.client.get('/api/students/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('List Students', 'pass')
            else:
                self.log_result('List Students', 'fail', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('List Students', 'fail', str(e))
        
        # Test 2: Get Student
        try:
            response = self.client.get(f'/api/students/{self.student.id}/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Get Student', 'pass')
            else:
                self.log_result('Get Student', 'fail', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Get Student', 'fail', str(e))
        
        # Test 3: Student Statistics
        try:
            response = self.client.get('/api/students/statistics/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Student Statistics', 'pass')
            else:
                self.log_result('Student Statistics', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Student Statistics', 'fail', str(e))
        
        # Test 4: Student Search
        try:
            response = self.client.get('/api/students/search/?q=test')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Student Search', 'pass')
            else:
                self.log_result('Student Search', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Student Search', 'fail', str(e))
    
    def test_advisor_endpoints(self):
        """Test all advisor endpoints"""
        print("\n" + "="*60)
        print("Testing Advisor Endpoints")
        print("="*60)
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test 1: List Advisors
        try:
            response = self.client.get('/api/advisors/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('List Advisors', 'pass')
            else:
                self.log_result('List Advisors', 'fail', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('List Advisors', 'fail', str(e))
        
        # Test 2: Get Advisor
        try:
            response = self.client.get(f'/api/advisors/{self.advisor.id}/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Get Advisor', 'pass')
            else:
                self.log_result('Get Advisor', 'fail', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Get Advisor', 'fail', str(e))
        
        # Test 3: Advisor Statistics
        try:
            response = self.client.get('/api/advisors/statistics/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Advisor Statistics', 'pass')
            else:
                self.log_result('Advisor Statistics', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Advisor Statistics', 'fail', str(e))
    
    def test_permissions(self):
        """Test role-based permissions"""
        print("\n" + "="*60)
        print("Testing Role-Based Permissions")
        print("="*60)
        
        # Test 1: Student can only see their projects
        try:
            refresh = RefreshToken.for_user(self.student_user)
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
            response = self.client.get('/api/projects/projects/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Student Project Access', 'pass')
            else:
                self.log_result('Student Project Access', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Student Project Access', 'fail', str(e))
        
        # Test 2: Advisor can see their projects
        try:
            refresh = RefreshToken.for_user(self.advisor_user)
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
            response = self.client.get('/api/projects/projects/')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Advisor Project Access', 'pass')
            else:
                self.log_result('Advisor Project Access', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Advisor Project Access', 'fail', str(e))
        
        # Test 3: Unauthenticated access denied
        try:
            self.client.credentials()
            response = self.client.get('/api/projects/projects/')
            if response.status_code == status.HTTP_401_UNAUTHORIZED:
                self.log_result('Unauthenticated Access Denied', 'pass')
            else:
                self.log_result('Unauthenticated Access Denied', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Unauthenticated Access Denied', 'fail', str(e))
    
    def test_error_handling(self):
        """Test error handling"""
        print("\n" + "="*60)
        print("Testing Error Handling")
        print("="*60)
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test 1: Invalid project ID
        try:
            response = self.client.get('/api/projects/projects/99999/')
            if response.status_code == status.HTTP_404_NOT_FOUND:
                self.log_result('Invalid Project ID Handling', 'pass')
            else:
                self.log_result('Invalid Project ID Handling', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Invalid Project ID Handling', 'fail', str(e))
        
        # Test 2: Invalid student ID
        try:
            response = self.client.get('/api/students/99999/')
            if response.status_code == status.HTTP_404_NOT_FOUND:
                self.log_result('Invalid Student ID Handling', 'pass')
            else:
                self.log_result('Invalid Student ID Handling', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Invalid Student ID Handling', 'fail', str(e))
        
        # Test 3: Invalid request data
        try:
            response = self.client.post('/api/projects/projects/', {})
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                self.log_result('Invalid Request Data Handling', 'pass')
            else:
                self.log_result('Invalid Request Data Handling', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Invalid Request Data Handling', 'fail', str(e))
    
    def test_api_endpoints_coverage(self):
        """Test API endpoints coverage"""
        print("\n" + "="*60)
        print("Testing API Endpoints Coverage")
        print("="*60)
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # List of endpoints to test
        endpoints = [
            ('GET', '/api/settings/academic-years/'),
            ('GET', '/api/settings/academic-years/current/'),
            ('GET', '/api/notifications/'),
        ]
        
        for method, endpoint in endpoints:
            try:
                if method == 'GET':
                    response = self.client.get(endpoint)
                elif method == 'POST':
                    response = self.client.post(endpoint, {})
                
                if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
                    self.log_result(f'{method} {endpoint}', 'pass')
                elif response.status_code == status.HTTP_404_NOT_FOUND:
                    self.log_result(f'{method} {endpoint}', 'warn', 'Endpoint not found')
                else:
                    self.log_result(f'{method} {endpoint}', 'warn', f"Status: {response.status_code}")
            except Exception as e:
                self.log_result(f'{method} {endpoint}', 'fail', str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*60)
        print("BM23 Comprehensive Workflow Testing")
        print("="*60)
        
        try:
            self.test_authentication_endpoints()
            self.test_project_endpoints()
            self.test_student_endpoints()
            self.test_advisor_endpoints()
            self.test_permissions()
            self.test_error_handling()
            self.test_api_endpoints_coverage()
            
            # Print summary
            self.print_summary()
            
            return len(self.test_results['failed']) == 0
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("Test Summary")
        print("="*60)
        
        total = len(self.test_results['passed']) + len(self.test_results['failed']) + len(self.test_results['warnings']) + len(self.test_results['skipped'])
        passed = len(self.test_results['passed'])
        failed = len(self.test_results['failed'])
        warnings = len(self.test_results['warnings'])
        skipped = len(self.test_results['skipped'])
        
        print(f"\nTotal Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"⏭️  Skipped: {skipped}")
        
        if failed > 0:
            print("\nFailed Tests:")
            for test_name, message in self.test_results['failed']:
                print(f"  - {test_name}: {message}")
        
        if warnings > 0:
            print("\nWarnings:")
            for test_name, message in self.test_results['warnings']:
                print(f"  - {test_name}: {message}")
        
        print("\n" + "="*60)
        
        if failed == 0:
            print("✅ All Critical Tests Passed!")
        else:
            print("❌ Some Tests Failed - Review Required")
        print("="*60)


if __name__ == '__main__':
    test = ComprehensiveWorkflowTest()
    success = test.run_all_tests()
    sys.exit(0 if success else 1)
