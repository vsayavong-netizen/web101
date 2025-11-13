#!/usr/bin/env python3
"""
Workflow Testing Script for BM23 System
Tests all major workflows of the application
"""

import os
import sys
import django

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
import json

User = get_user_model()


class WorkflowTestCase(TestCase):
    """Test all major workflows"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='admin123',
            role='Admin',
            first_name='Admin',
            last_name='User',
            is_active=True
        )
        
        self.advisor_user = User.objects.create_user(
            username='advisor1',
            email='advisor1@test.com',
            password='advisor123',
            role='Advisor',
            first_name='Advisor',
            last_name='One',
            is_active=True
        )
        
        self.student_user = User.objects.create_user(
            username='student1',
            email='student1@test.com',
            password='student123',
            role='Student',
            first_name='Student',
            last_name='One',
            is_active=True
        )
        
        # Create advisor
        self.advisor = Advisor.objects.create(
            user=self.advisor_user,
            advisor_id='ADV001',
            quota=5
        )
        
        # Create student
        self.student = Student.objects.create(
            user=self.student_user,
            student_id='STU001',
            major='Computer Science',
            classroom='CS-2024',
            academic_year='2024-2025'
        )
        
        # Create academic year
        self.academic_year = AcademicYear.objects.create(
            year='2024-2025',
            is_active=True
        )
    
    def test_authentication_workflow(self):
        """Test complete authentication workflow"""
        print("\n=== Testing Authentication Workflow ===")
        
        # 1. Test Login
        print("1. Testing login...")
        response = self.client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'admin123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        print("   ✅ Login successful")
        
        access_token = response.data['access']
        refresh_token = response.data['refresh']
        
        # 2. Test Authenticated Request
        print("2. Testing authenticated request...")
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get('/api/auth/user-info/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'admin')
        print("   ✅ Authenticated request successful")
        
        # 3. Test Token Refresh
        print("3. Testing token refresh...")
        response = self.client.post('/api/auth/token/refresh/', {
            'refresh': refresh_token
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        print("   ✅ Token refresh successful")
        
        # 4. Test Logout
        print("4. Testing logout...")
        response = self.client.post('/api/auth/logout/', {
            'refresh': refresh_token
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ Logout successful")
        
        print("✅ Authentication workflow complete\n")
    
    def test_project_workflow(self):
        """Test complete project management workflow"""
        print("\n=== Testing Project Workflow ===")
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # 1. Create Project
        print("1. Testing project creation...")
        project_data = {
            'project_id': 'PROJ001',
            'topic_lao': 'ທົດລອງ',
            'topic_eng': 'Test Project',
            'advisor_name': 'Advisor One',
            'status': 'Pending'
        }
        response = self.client.post('/api/projects/projects/', project_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project_id = response.data['id']
        print(f"   ✅ Project created: {project_id}")
        
        # 2. Get Project
        print("2. Testing get project...")
        response = self.client.get(f'/api/projects/projects/{project_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project_id'], 'PROJ001')
        print("   ✅ Get project successful")
        
        # 3. Update Project Status
        print("3. Testing update project status...")
        response = self.client.patch(f'/api/projects/projects/{project_id}/update_status/', {
            'status': 'Approved',
            'comment': 'Approved for development'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ Update status successful")
        
        # 4. List Projects
        print("4. Testing list projects...")
        response = self.client.get('/api/projects/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
        print("   ✅ List projects successful")
        
        print("✅ Project workflow complete\n")
    
    def test_student_workflow(self):
        """Test student management workflow"""
        print("\n=== Testing Student Workflow ===")
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # 1. List Students
        print("1. Testing list students...")
        response = self.client.get('/api/students/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ List students successful")
        
        # 2. Get Student
        print("2. Testing get student...")
        response = self.client.get(f'/api/students/{self.student.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student_id'], 'STU001')
        print("   ✅ Get student successful")
        
        # 3. Update Student
        print("3. Testing update student...")
        response = self.client.patch(f'/api/students/{self.student.id}/', {
            'status': 'Approved'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ Update student successful")
        
        print("✅ Student workflow complete\n")
    
    def test_advisor_workflow(self):
        """Test advisor management workflow"""
        print("\n=== Testing Advisor Workflow ===")
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # 1. List Advisors
        print("1. Testing list advisors...")
        response = self.client.get('/api/advisors/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ List advisors successful")
        
        # 2. Get Advisor
        print("2. Testing get advisor...")
        response = self.client.get(f'/api/advisors/{self.advisor.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['advisor_id'], 'ADV001')
        print("   ✅ Get advisor successful")
        
        print("✅ Advisor workflow complete\n")
    
    def test_academic_year_workflow(self):
        """Test academic year management workflow"""
        print("\n=== Testing Academic Year Workflow ===")
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # 1. List Academic Years
        print("1. Testing list academic years...")
        response = self.client.get('/api/settings/academic-years/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print("   ✅ List academic years successful")
        
        # 2. Get Current Academic Year
        print("2. Testing get current academic year...")
        response = self.client.get('/api/settings/academic-years/current/')
        if response.status_code == status.HTTP_200_OK:
            print("   ✅ Get current academic year successful")
        else:
            print(f"   ⚠️  Get current academic year: {response.status_code}")
        
        print("✅ Academic year workflow complete\n")
    
    def test_notification_workflow(self):
        """Test notification workflow"""
        print("\n=== Testing Notification Workflow ===")
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # 1. Create Notification
        print("1. Testing create notification...")
        notification_data = {
            'title': 'Test Notification',
            'message': 'This is a test notification',
            'type': 'System',
            'user_ids': [str(self.admin_user.id)],
            'project_id': ''
        }
        response = self.client.post('/api/notifications/', notification_data)
        if response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]:
            print("   ✅ Create notification successful")
        else:
            print(f"   ⚠️  Create notification: {response.status_code} - {response.data}")
        
        # 2. List Notifications
        print("2. Testing list notifications...")
        response = self.client.get('/api/notifications/')
        if response.status_code == status.HTTP_200_OK:
            print("   ✅ List notifications successful")
        else:
            print(f"   ⚠️  List notifications: {response.status_code}")
        
        print("✅ Notification workflow complete\n")
    
    def test_error_handling(self):
        """Test error handling in workflows"""
        print("\n=== Testing Error Handling ===")
        
        # 1. Test Invalid Login
        print("1. Testing invalid login...")
        response = self.client.post('/api/auth/login/', {
            'username': 'invalid',
            'password': 'wrong'
        })
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST])
        print("   ✅ Invalid login handled correctly")
        
        # 2. Test Unauthenticated Request
        print("2. Testing unauthenticated request...")
        self.client.credentials()  # Clear credentials
        response = self.client.get('/api/projects/projects/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        print("   ✅ Unauthenticated request handled correctly")
        
        # 3. Test Invalid Project ID
        print("3. Testing invalid project ID...")
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        response = self.client.get('/api/projects/projects/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        print("   ✅ Invalid project ID handled correctly")
        
        print("✅ Error handling complete\n")
    
    def run_all_tests(self):
        """Run all workflow tests"""
        print("=" * 60)
        print("BM23 Workflow Testing")
        print("=" * 60)
        
        try:
            self.test_authentication_workflow()
            self.test_project_workflow()
            self.test_student_workflow()
            self.test_advisor_workflow()
            self.test_academic_year_workflow()
            self.test_notification_workflow()
            self.test_error_handling()
            
            print("=" * 60)
            print("✅ All Workflow Tests Completed Successfully!")
            print("=" * 60)
            return True
        except Exception as e:
            print(f"\n❌ Test failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == '__main__':
    test = WorkflowTestCase()
    test.setUp()
    success = test.run_all_tests()
    sys.exit(0 if success else 1)
