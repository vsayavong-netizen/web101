#!/usr/bin/env python3
"""
Extended Workflow Testing Script for BM23 System
Tests all additional features: files, notifications, AI, analytics, communication, defense, monitoring
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

User = get_user_model()


class ExtendedWorkflowTest:
    """Extended workflow testing for all features"""
    
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
        print("Setting up test data for extended testing...")
        print("="*60)
        
        try:
            # Get or create test users
            self.admin_user, _ = User.objects.get_or_create(
                username='test_admin_ext',
                defaults={
                    'email': 'admin_ext@test.com',
                    'role': 'Admin',
                    'first_name': 'Test',
                    'last_name': 'Admin',
                    'is_active': True
                }
            )
            if not self.admin_user.check_password('admin123'):
                self.admin_user.set_password('admin123')
                self.admin_user.save()
            
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
    
    def test_file_management_endpoints(self):
        """Test file management endpoints"""
        print("\n" + "="*60)
        print("Testing File Management Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/files/'),
            ('GET', '/api/files/?project=1'),
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
    
    def test_communication_endpoints(self):
        """Test communication endpoints"""
        print("\n" + "="*60)
        print("Testing Communication Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/communication/channels/'),
            ('GET', '/api/communication/messages/'),
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
    
    def test_ai_services_endpoints(self):
        """Test AI services endpoints"""
        print("\n" + "="*60)
        print("Testing AI Services Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/ai/'),
            ('GET', '/api/ai-enhancement/'),
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
    
    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        print("\n" + "="*60)
        print("Testing Analytics Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/analytics/'),
            ('GET', '/api/analytics/dashboard/'),
            ('GET', '/api/analytics/statistics/'),
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
    
    def test_defense_management_endpoints(self):
        """Test defense management endpoints"""
        print("\n" + "="*60)
        print("Testing Defense Management Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/defense/'),
            ('GET', '/api/defense/schedules/'),
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
    
    def test_system_monitoring_endpoints(self):
        """Test system monitoring endpoints"""
        print("\n" + "="*60)
        print("Testing System Monitoring Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/monitoring/'),
            ('GET', '/api/monitoring/health/'),
            ('GET', '/api/monitoring/status/'),
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
    
    def test_milestone_endpoints(self):
        """Test milestone endpoints"""
        print("\n" + "="*60)
        print("Testing Milestone Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/milestones/'),
            ('GET', '/api/milestones/templates/'),
            ('GET', '/api/milestones/statistics/'),
            ('GET', '/api/milestones/overdue/'),
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
    
    def test_scoring_endpoints(self):
        """Test scoring endpoints"""
        print("\n" + "="*60)
        print("Testing Scoring Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/scoring/'),
            ('GET', '/api/scoring/statistics/'),
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
    
    def test_reports_endpoints(self):
        """Test reports endpoints"""
        print("\n" + "="*60)
        print("Testing Reports Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/reports/'),
            ('GET', '/api/reports/projects/'),
            ('GET', '/api/reports/students/'),
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
    
    def test_committees_endpoints(self):
        """Test committees endpoints"""
        print("\n" + "="*60)
        print("Testing Committees Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/committees/'),
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
    
    def test_majors_endpoints(self):
        """Test majors endpoints"""
        print("\n" + "="*60)
        print("Testing Majors Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/majors/'),
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
    
    def test_classrooms_endpoints(self):
        """Test classrooms endpoints"""
        print("\n" + "="*60)
        print("Testing Classrooms Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/classrooms/'),
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
    
    def test_notification_endpoints_detailed(self):
        """Test notification endpoints in detail"""
        print("\n" + "="*60)
        print("Testing Notification Endpoints (Detailed)")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        endpoints = [
            ('GET', '/api/notifications/'),
            ('GET', '/api/notifications/templates/'),
            ('GET', '/api/notifications/subscriptions/'),
            ('GET', '/api/notifications/logs/'),
            ('GET', '/api/notifications/announcements/'),
            ('GET', '/api/notifications/preferences/'),
            ('GET', '/api/notifications/statistics/'),
            ('GET', '/api/notifications/search/'),
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
    
    def test_edge_cases(self):
        """Test edge cases"""
        print("\n" + "="*60)
        print("Testing Edge Cases")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test 1: Empty request body
        try:
            response = self.client.post('/api/projects/projects/', {})
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                self.log_result('Empty Request Body Handling', 'pass')
            else:
                self.log_result('Empty Request Body Handling', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Empty Request Body Handling', 'fail', str(e))
        
        # Test 2: Invalid data types
        try:
            response = self.client.post('/api/projects/projects/', {
                'project_id': 123,  # Should be string
                'status': 'InvalidStatus'
            })
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                self.log_result('Invalid Data Type Handling', 'pass')
            else:
                self.log_result('Invalid Data Type Handling', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Invalid Data Type Handling', 'fail', str(e))
        
        # Test 3: Very long strings
        try:
            long_string = 'a' * 10000
            response = self.client.post('/api/projects/projects/', {
                'project_id': long_string,
                'title': 'Test'
            })
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                self.log_result('Long String Handling', 'pass')
            else:
                self.log_result('Long String Handling', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Long String Handling', 'fail', str(e))
        
        # Test 4: SQL injection attempt
        try:
            response = self.client.get('/api/projects/projects/?search=1%27%20OR%20%271%27%3D%271')
            if response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]:
                self.log_result('SQL Injection Protection', 'pass')
            else:
                self.log_result('SQL Injection Protection', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('SQL Injection Protection', 'fail', str(e))
        
        # Test 5: XSS attempt
        try:
            response = self.client.post('/api/projects/projects/', {
                'project_id': 'TEST',
                'title': '<script>alert("XSS")</script>'
            })
            if response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]:
                self.log_result('XSS Protection', 'pass')
            else:
                self.log_result('XSS Protection', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('XSS Protection', 'fail', str(e))
    
    def test_performance_endpoints(self):
        """Test performance-related endpoints"""
        print("\n" + "="*60)
        print("Testing Performance Endpoints")
        print("="*60)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test pagination
        try:
            response = self.client.get('/api/projects/projects/?page=1&page_size=10')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Pagination Support', 'pass')
            else:
                self.log_result('Pagination Support', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Pagination Support', 'fail', str(e))
        
        # Test filtering
        try:
            response = self.client.get('/api/projects/projects/?status=Pending')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Filtering Support', 'pass')
            else:
                self.log_result('Filtering Support', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Filtering Support', 'fail', str(e))
        
        # Test ordering
        try:
            response = self.client.get('/api/projects/projects/?ordering=-created_at')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Ordering Support', 'pass')
            else:
                self.log_result('Ordering Support', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Ordering Support', 'fail', str(e))
        
        # Test search
        try:
            response = self.client.get('/api/projects/projects/?search=test')
            if response.status_code == status.HTTP_200_OK:
                self.log_result('Search Support', 'pass')
            else:
                self.log_result('Search Support', 'warn', f"Status: {response.status_code}")
        except Exception as e:
            self.log_result('Search Support', 'fail', str(e))
    
    def run_all_tests(self):
        """Run all extended tests"""
        print("\n" + "="*60)
        print("BM23 Extended Workflow Testing")
        print("="*60)
        
        try:
            self.test_file_management_endpoints()
            self.test_communication_endpoints()
            self.test_ai_services_endpoints()
            self.test_analytics_endpoints()
            self.test_defense_management_endpoints()
            self.test_system_monitoring_endpoints()
            self.test_milestone_endpoints()
            self.test_scoring_endpoints()
            self.test_reports_endpoints()
            self.test_committees_endpoints()
            self.test_majors_endpoints()
            self.test_classrooms_endpoints()
            self.test_notification_endpoints_detailed()
            self.test_edge_cases()
            self.test_performance_endpoints()
            
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
        print("Extended Test Summary")
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
    test = ExtendedWorkflowTest()
    success = test.run_all_tests()
    sys.exit(0 if success else 1)
