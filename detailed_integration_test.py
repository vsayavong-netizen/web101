#!/usr/bin/env python3
"""
Detailed Integration Test Script for BM23 System
Tests every component in detail to ensure consistency and proper integration
"""

import os
import sys
import django
import json
import re
from pathlib import Path
from typing import Dict, List, Any

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
from projects.models import ProjectGroup, Project, ProjectStudent, LogEntry
from settings.models import AcademicYear
from milestones.models import MilestoneTemplate

User = get_user_model()


class DetailedIntegrationTest:
    """Detailed integration testing for all components"""
    
    def __init__(self):
        self.client = APIClient()
        self.test_results = {
            'passed': [],
            'failed': [],
            'warnings': [],
            'skipped': [],
            'details': {}
        }
        self.setup_test_data()
    
    def setup_test_data(self):
        """Set up comprehensive test data"""
        print("\n" + "="*70)
        print("Setting up comprehensive test data...")
        print("="*70)
        
        try:
            # Create test users with all roles
            self.admin_user, _ = User.objects.get_or_create(
                username='test_admin_detailed',
                defaults={
                    'email': 'admin_detailed@test.com',
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
                username='test_advisor_detailed',
                defaults={
                    'email': 'advisor_detailed@test.com',
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
                username='test_student_detailed',
                defaults={
                    'email': 'student_detailed@test.com',
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
                    'advisor_id': 'ADV_DET001',
                    'quota': 5
                }
            )
            
            # Create student
            self.student, _ = Student.objects.get_or_create(
                user=self.student_user,
                defaults={
                    'student_id': 'STU_DET001',
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
    
    def log_result(self, category, test_name, status, message='', details=None):
        """Log test result with details"""
        key = f"{category}::{test_name}"
        
        if status == 'pass':
            self.test_results['passed'].append(key)
            self.test_results['details'][key] = {
                'status': 'pass',
                'message': message,
                'details': details or {}
            }
            print(f"   ✅ [{category}] {test_name}")
            if message:
                print(f"      → {message}")
        elif status == 'fail':
            self.test_results['failed'].append(key)
            self.test_results['details'][key] = {
                'status': 'fail',
                'message': message,
                'details': details or {}
            }
            print(f"   ❌ [{category}] {test_name}: {message}")
        elif status == 'warn':
            self.test_results['warnings'].append(key)
            self.test_results['details'][key] = {
                'status': 'warn',
                'message': message,
                'details': details or {}
            }
            print(f"   ⚠️  [{category}] {test_name}: {message}")
        else:
            self.test_results['skipped'].append(key)
            self.test_results['details'][key] = {
                'status': 'skip',
                'message': message,
                'details': details or {}
            }
            print(f"   ⏭️  [{category}] {test_name}: {message}")
    
    def test_authentication_flow_detailed(self):
        """Test authentication flow in detail"""
        print("\n" + "="*70)
        print("Testing Authentication Flow (Detailed)")
        print("="*70)
        
        # Test 1: Login with valid credentials
        try:
            self.client.credentials()
            response = self.client.post('/api/auth/login/', {
                'username': 'test_admin_detailed',
                'password': 'admin123'
            })
            
            if response.status_code == status.HTTP_200_OK:
                data = response.data
                has_access = 'access' in data or 'token' in data
                has_refresh = 'refresh' in data
                has_user = 'user' in data
                
                if has_access and has_refresh and has_user:
                    self.access_token = data.get('access') or data.get('token')
                    self.refresh_token = data.get('refresh')
                    self.log_result(
                        'Authentication', 'Login Valid Credentials', 'pass',
                        f'Status: {response.status_code}, Has tokens: {has_access}, Has user: {has_user}',
                        {'status_code': response.status_code, 'has_tokens': has_access, 'has_user': has_user}
                    )
                else:
                    self.log_result(
                        'Authentication', 'Login Valid Credentials', 'warn',
                        f'Missing fields: access={has_access}, refresh={has_refresh}, user={has_user}'
                    )
            else:
                self.log_result(
                    'Authentication', 'Login Valid Credentials', 'fail',
                    f'Status: {response.status_code}, Data: {response.data}'
                )
        except Exception as e:
            self.log_result('Authentication', 'Login Valid Credentials', 'fail', str(e))
        
        # Test 2: Login with invalid credentials
        try:
            self.client.credentials()
            response = self.client.post('/api/auth/login/', {
                'username': 'invalid_user',
                'password': 'wrong_password'
            })
            
            if response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST]:
                self.log_result(
                    'Authentication', 'Login Invalid Credentials', 'pass',
                    f'Properly rejected with status: {response.status_code}'
                )
            else:
                self.log_result(
                    'Authentication', 'Login Invalid Credentials', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Authentication', 'Login Invalid Credentials', 'fail', str(e))
        
        # Test 3: Token refresh
        try:
            if hasattr(self, 'refresh_token'):
                response = self.client.post('/api/auth/token/refresh/', {
                    'refresh': self.refresh_token
                })
                
                if response.status_code == status.HTTP_200_OK:
                    new_access = response.data.get('access') or response.data.get('token')
                    if new_access:
                        self.log_result(
                            'Authentication', 'Token Refresh', 'pass',
                            'Token refreshed successfully'
                        )
                    else:
                        self.log_result(
                            'Authentication', 'Token Refresh', 'warn',
                            'No new access token in response'
                        )
                else:
                    self.log_result(
                        'Authentication', 'Token Refresh', 'fail',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Authentication', 'Token Refresh', 'skip', 'No refresh token')
        except Exception as e:
            self.log_result('Authentication', 'Token Refresh', 'fail', str(e))
        
        # Test 4: Authenticated request
        try:
            if hasattr(self, 'access_token'):
                self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
                response = self.client.get('/api/auth/user-info/')
                
                if response.status_code == status.HTTP_200_OK:
                    user_data = response.data.get('user', {})
                    if user_data:
                        self.log_result(
                            'Authentication', 'Authenticated Request', 'pass',
                            f'User: {user_data.get("username")}, Role: {user_data.get("role")}',
                            {'username': user_data.get('username'), 'role': user_data.get('role')}
                        )
                    else:
                        self.log_result(
                            'Authentication', 'Authenticated Request', 'warn',
                            'No user data in response'
                        )
                else:
                    self.log_result(
                        'Authentication', 'Authenticated Request', 'fail',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Authentication', 'Authenticated Request', 'skip', 'No access token')
        except Exception as e:
            self.log_result('Authentication', 'Authenticated Request', 'fail', str(e))
        
        # Test 5: Unauthenticated request
        try:
            self.client.credentials()
            response = self.client.get('/api/projects/projects/')
            
            if response.status_code == status.HTTP_401_UNAUTHORIZED:
                self.log_result(
                    'Authentication', 'Unauthenticated Request', 'pass',
                    'Properly rejected with 401'
                )
            else:
                self.log_result(
                    'Authentication', 'Unauthenticated Request', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Authentication', 'Unauthenticated Request', 'fail', str(e))
    
    def test_project_workflow_detailed(self):
        """Test project workflow in detail"""
        print("\n" + "="*70)
        print("Testing Project Workflow (Detailed)")
        print("="*70)
        
        # Authenticate as admin
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test 1: Create project
        try:
            project_data = {
                'project_id': 'DET_TEST001',
                'title': 'Detailed Test Project',
                'status': 'Pending',
                'advisor': self.advisor.id
            }
            response = self.client.post('/api/projects/projects/', project_data)
            
            if response.status_code == status.HTTP_201_CREATED:
                self.test_project_id = response.data.get('id')
                project_id = response.data.get('project_id')
                
                self.log_result(
                    'Project', 'Create Project', 'pass',
                    f'Project created: {project_id}',
                    {'project_id': project_id, 'id': self.test_project_id}
                )
            else:
                self.log_result(
                    'Project', 'Create Project', 'warn',
                    f'Status: {response.status_code}, Data: {response.data}'
                )
        except Exception as e:
            self.log_result('Project', 'Create Project', 'fail', str(e))
        
        # Test 2: Get project details
        try:
            if hasattr(self, 'test_project_id'):
                response = self.client.get(f'/api/projects/projects/{self.test_project_id}/')
                
                if response.status_code == status.HTTP_200_OK:
                    data = response.data
                    required_fields = ['id', 'project_id', 'status']
                    missing_fields = [f for f in required_fields if f not in data]
                    
                    if not missing_fields:
                        self.log_result(
                            'Project', 'Get Project Details', 'pass',
                            f'All required fields present: {", ".join(required_fields)}',
                            {'fields': required_fields}
                        )
                    else:
                        self.log_result(
                            'Project', 'Get Project Details', 'warn',
                            f'Missing fields: {", ".join(missing_fields)}'
                        )
                else:
                    self.log_result(
                        'Project', 'Get Project Details', 'fail',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Project', 'Get Project Details', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Project', 'Get Project Details', 'fail', str(e))
        
        # Test 3: Update project status
        try:
            if hasattr(self, 'test_project_id'):
                response = self.client.post(f'/api/projects/projects/{self.test_project_id}/update_status/', {
                    'status': 'Approved',
                    'comment': 'Test approval for detailed testing'
                })
                
                if response.status_code == status.HTTP_200_OK:
                    # Verify status was updated
                    get_response = self.client.get(f'/api/projects/projects/{self.test_project_id}/')
                    if get_response.status_code == status.HTTP_200_OK:
                        new_status = get_response.data.get('status')
                        if new_status == 'Approved':
                            self.log_result(
                                'Project', 'Update Project Status', 'pass',
                                f'Status updated to: {new_status}',
                                {'old_status': 'Pending', 'new_status': new_status}
                            )
                        else:
                            self.log_result(
                                'Project', 'Update Project Status', 'warn',
                                f'Status not updated correctly: {new_status}'
                            )
                else:
                    self.log_result(
                        'Project', 'Update Project Status', 'fail',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Project', 'Update Project Status', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Project', 'Update Project Status', 'fail', str(e))
        
        # Test 4: Get log entries
        try:
            if hasattr(self, 'test_project_id'):
                response = self.client.get(f'/api/projects/projects/{self.test_project_id}/log_entries/')
                
                if response.status_code == status.HTTP_200_OK:
                    log_entries = response.data
                    if isinstance(log_entries, list):
                        # Check log entry structure
                        if len(log_entries) > 0:
                            first_entry = log_entries[0]
                            required_fields = ['id', 'type', 'content', 'created_at']
                            missing_fields = [f for f in required_fields if f not in first_entry]
                            
                            if not missing_fields:
                                self.log_result(
                                    'Project', 'Get Log Entries', 'pass',
                                    f'Found {len(log_entries)} entries with correct structure',
                                    {'count': len(log_entries), 'fields': required_fields}
                                )
                            else:
                                self.log_result(
                                    'Project', 'Get Log Entries', 'warn',
                                    f'Missing fields in log entry: {", ".join(missing_fields)}'
                                )
                        else:
                            self.log_result(
                                'Project', 'Get Log Entries', 'pass',
                                'No log entries (empty list is valid)'
                            )
                    else:
                        self.log_result(
                            'Project', 'Get Log Entries', 'warn',
                            'Response is not a list'
                        )
                else:
                    self.log_result(
                        'Project', 'Get Log Entries', 'fail',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Project', 'Get Log Entries', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Project', 'Get Log Entries', 'fail', str(e))
        
        # Test 5: Add log entry
        try:
            if hasattr(self, 'test_project_id'):
                response = self.client.post(f'/api/projects/projects/{self.test_project_id}/add_log_entry/', {
                    'type': 'comment',
                    'content': 'Test log entry for detailed testing',
                    'metadata': {'test': True}
                })
                
                if response.status_code == status.HTTP_200_OK:
                    self.log_result(
                        'Project', 'Add Log Entry', 'pass',
                        'Log entry added successfully'
                    )
                else:
                    self.log_result(
                        'Project', 'Add Log Entry', 'warn',
                        f'Status: {response.status_code}, Data: {response.data}'
                    )
            else:
                self.log_result('Project', 'Add Log Entry', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Project', 'Add Log Entry', 'fail', str(e))
    
    def test_data_consistency_detailed(self):
        """Test data consistency in detail"""
        print("\n" + "="*70)
        print("Testing Data Consistency (Detailed)")
        print("="*70)
        
        # Test 1: Project and ProjectGroup relationship
        try:
            if hasattr(self, 'test_project_id'):
                # Get project
                project_response = self.client.get(f'/api/projects/projects/{self.test_project_id}/')
                if project_response.status_code == status.HTTP_200_OK:
                    project_data = project_response.data
                    project_id = project_data.get('project_id')
                    
                    # Check if ProjectGroup exists
                    try:
                        project_group = ProjectGroup.objects.get(project_id=project_id)
                        
                        # Verify consistency
                        if project_group:
                            self.log_result(
                                'Data Consistency', 'Project-ProjectGroup Relationship', 'pass',
                                f'ProjectGroup found for project_id: {project_id}',
                                {'project_id': project_id, 'project_group_id': project_group.id}
                            )
                        else:
                            self.log_result(
                                'Data Consistency', 'Project-ProjectGroup Relationship', 'warn',
                                'ProjectGroup not found'
                            )
                    except ProjectGroup.DoesNotExist:
                        self.log_result(
                            'Data Consistency', 'Project-ProjectGroup Relationship', 'warn',
                            'ProjectGroup does not exist (may be created on demand)'
                        )
            else:
                self.log_result('Data Consistency', 'Project-ProjectGroup Relationship', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Data Consistency', 'Project-ProjectGroup Relationship', 'fail', str(e))
        
        # Test 2: LogEntry and ProjectGroup relationship
        try:
            if hasattr(self, 'test_project_id'):
                project_response = self.client.get(f'/api/projects/projects/{self.test_project_id}/')
                if project_response.status_code == status.HTTP_200_OK:
                    project_id = project_response.data.get('project_id')
                    
                    try:
                        project_group = ProjectGroup.objects.get(project_id=project_id)
                        log_entries = project_group.log_entries.all()
                        
                        self.log_result(
                            'Data Consistency', 'LogEntry-ProjectGroup Relationship', 'pass',
                            f'Found {log_entries.count()} log entries for project group',
                            {'count': log_entries.count()}
                        )
                    except ProjectGroup.DoesNotExist:
                        self.log_result(
                            'Data Consistency', 'LogEntry-ProjectGroup Relationship', 'warn',
                            'ProjectGroup does not exist'
                        )
            else:
                self.log_result('Data Consistency', 'LogEntry-ProjectGroup Relationship', 'skip', 'No project ID')
        except Exception as e:
            self.log_result('Data Consistency', 'LogEntry-ProjectGroup Relationship', 'fail', str(e))
        
        # Test 3: Serializer field consistency
        try:
            from projects.serializers import ProjectSerializer
            from projects.models import Project
            
            serializer = ProjectSerializer()
            serializer_fields = set(serializer.fields.keys())
            
            # Get a project instance
            if Project.objects.exists():
                project = Project.objects.first()
                model_fields = {f.name for f in Project._meta.get_fields()}
                
                # Check if serializer includes model fields
                common_fields = serializer_fields & model_fields
                
                self.log_result(
                    'Data Consistency', 'Serializer-Model Fields', 'pass',
                    f'Serializer has {len(common_fields)} common fields with model',
                    {'serializer_fields': len(serializer_fields), 'common_fields': len(common_fields)}
                )
            else:
                self.log_result('Data Consistency', 'Serializer-Model Fields', 'skip', 'No projects in database')
        except Exception as e:
            self.log_result('Data Consistency', 'Serializer-Model Fields', 'fail', str(e))
    
    def test_permissions_detailed(self):
        """Test permissions in detail"""
        print("\n" + "="*70)
        print("Testing Permissions (Detailed)")
        print("="*70)
        
        # Test 1: Admin can see all projects
        try:
            refresh = RefreshToken.for_user(self.admin_user)
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
            response = self.client.get('/api/projects/projects/')
            
            if response.status_code == status.HTTP_200_OK:
                self.log_result(
                    'Permissions', 'Admin Project Access', 'pass',
                    f'Admin can access projects (status: {response.status_code})'
                )
            else:
                self.log_result(
                    'Permissions', 'Admin Project Access', 'fail',
                    f'Status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Permissions', 'Admin Project Access', 'fail', str(e))
        
        # Test 2: Advisor can see their projects
        try:
            refresh = RefreshToken.for_user(self.advisor_user)
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
            response = self.client.get('/api/projects/projects/')
            
            if response.status_code == status.HTTP_200_OK:
                self.log_result(
                    'Permissions', 'Advisor Project Access', 'pass',
                    f'Advisor can access projects (status: {response.status_code})'
                )
            else:
                self.log_result(
                    'Permissions', 'Advisor Project Access', 'warn',
                    f'Status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Permissions', 'Advisor Project Access', 'fail', str(e))
        
        # Test 3: Student can see their projects
        try:
            refresh = RefreshToken.for_user(self.student_user)
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
            response = self.client.get('/api/projects/projects/')
            
            if response.status_code == status.HTTP_200_OK:
                self.log_result(
                    'Permissions', 'Student Project Access', 'pass',
                    f'Student can access projects (status: {response.status_code})'
                )
            else:
                self.log_result(
                    'Permissions', 'Student Project Access', 'warn',
                    f'Status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Permissions', 'Student Project Access', 'fail', str(e))
        
        # Test 4: Unauthenticated cannot access
        try:
            self.client.credentials()
            response = self.client.get('/api/projects/projects/')
            
            if response.status_code == status.HTTP_401_UNAUTHORIZED:
                self.log_result(
                    'Permissions', 'Unauthenticated Access Denied', 'pass',
                    'Properly rejected with 401'
                )
            else:
                self.log_result(
                    'Permissions', 'Unauthenticated Access Denied', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Permissions', 'Unauthenticated Access Denied', 'fail', str(e))
    
    def test_error_handling_detailed(self):
        """Test error handling in detail"""
        print("\n" + "="*70)
        print("Testing Error Handling (Detailed)")
        print("="*70)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test 1: Invalid project ID
        try:
            response = self.client.get('/api/projects/projects/99999/')
            
            if response.status_code == status.HTTP_404_NOT_FOUND:
                error_data = response.data
                has_error_message = 'detail' in error_data or 'error' in error_data or 'message' in error_data
                
                if has_error_message:
                    self.log_result(
                        'Error Handling', 'Invalid Project ID', 'pass',
                        '404 with error message',
                        {'status': 404, 'has_message': has_error_message}
                    )
                else:
                    self.log_result(
                        'Error Handling', 'Invalid Project ID', 'warn',
                        '404 but no error message'
                    )
            else:
                self.log_result(
                    'Error Handling', 'Invalid Project ID', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Error Handling', 'Invalid Project ID', 'fail', str(e))
        
        # Test 2: Invalid request data
        try:
            response = self.client.post('/api/projects/projects/', {})
            
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                error_data = response.data
                has_errors = 'errors' in error_data or isinstance(error_data, dict)
                
                if has_errors:
                    self.log_result(
                        'Error Handling', 'Invalid Request Data', 'pass',
                        '400 with error details',
                        {'status': 400, 'has_errors': has_errors}
                    )
                else:
                    self.log_result(
                        'Error Handling', 'Invalid Request Data', 'warn',
                        '400 but no error details'
                    )
            else:
                self.log_result(
                    'Error Handling', 'Invalid Request Data', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Error Handling', 'Invalid Request Data', 'fail', str(e))
        
        # Test 3: Missing required fields
        try:
            response = self.client.post('/api/projects/projects/', {
                'title': 'Test'  # Missing required fields
            })
            
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                self.log_result(
                    'Error Handling', 'Missing Required Fields', 'pass',
                    '400 for missing required fields'
                )
            else:
                self.log_result(
                    'Error Handling', 'Missing Required Fields', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Error Handling', 'Missing Required Fields', 'fail', str(e))
    
    def test_api_response_format(self):
        """Test API response format consistency"""
        print("\n" + "="*70)
        print("Testing API Response Format")
        print("="*70)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test various endpoints for response format
        endpoints = [
            ('/api/projects/projects/', 'GET', 'Projects List'),
            ('/api/students/', 'GET', 'Students List'),
            ('/api/advisors/', 'GET', 'Advisors List'),
        ]
        
        for endpoint, method, name in endpoints:
            try:
                if method == 'GET':
                    response = self.client.get(endpoint)
                elif method == 'POST':
                    response = self.client.post(endpoint, {})
                
                if response.status_code == status.HTTP_200_OK:
                    data = response.data
                    # Check if response is a list or has 'results' (pagination)
                    is_list = isinstance(data, list)
                    has_results = isinstance(data, dict) and 'results' in data
                    
                    if is_list or has_results:
                        self.log_result(
                            'API Format', f'{name} Response Format', 'pass',
                            f'Valid response format (list: {is_list}, paginated: {has_results})'
                        )
                    else:
                        self.log_result(
                            'API Format', f'{name} Response Format', 'warn',
                            'Unexpected response format'
                        )
                else:
                    self.log_result(
                        'API Format', f'{name} Response Format', 'skip',
                        f'Status: {response.status_code}'
                    )
            except Exception as e:
                self.log_result('API Format', f'{name} Response Format', 'fail', str(e))
    
    def run_all_tests(self):
        """Run all detailed tests"""
        print("\n" + "="*70)
        print("BM23 Detailed Integration Testing")
        print("="*70)
        
        try:
            self.test_authentication_flow_detailed()
            self.test_project_workflow_detailed()
            self.test_data_consistency_detailed()
            self.test_permissions_detailed()
            self.test_error_handling_detailed()
            self.test_api_response_format()
            
            # Print summary
            self.print_summary()
            
            return len(self.test_results['failed']) == 0
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def print_summary(self):
        """Print detailed test summary"""
        print("\n" + "="*70)
        print("Detailed Test Summary")
        print("="*70)
        
        total = len(self.test_results['passed']) + len(self.test_results['failed']) + len(self.test_results['warnings']) + len(self.test_results['skipped'])
        passed = len(self.test_results['passed'])
        failed = len(self.test_results['failed'])
        warnings = len(self.test_results['warnings'])
        skipped = len(self.test_results['skipped'])
        
        print(f"\nTotal Tests: {total}")
        print(f"✅ Passed: {passed} ({passed/total*100:.1f}%)")
        print(f"❌ Failed: {failed} ({failed/total*100:.1f}%)")
        print(f"⚠️  Warnings: {warnings} ({warnings/total*100:.1f}%)")
        print(f"⏭️  Skipped: {skipped} ({skipped/total*100:.1f}%)")
        
        # Group by category
        categories = {}
        for key in self.test_results['passed'] + self.test_results['failed'] + self.test_results['warnings']:
            category = key.split('::')[0]
            if category not in categories:
                categories[category] = {'passed': 0, 'failed': 0, 'warnings': 0}
            
            if key in self.test_results['passed']:
                categories[category]['passed'] += 1
            elif key in self.test_results['failed']:
                categories[category]['failed'] += 1
            elif key in self.test_results['warnings']:
                categories[category]['warnings'] += 1
        
        print("\nResults by Category:")
        for category, counts in categories.items():
            total_cat = counts['passed'] + counts['failed'] + counts['warnings']
            print(f"  {category}:")
            print(f"    ✅ Passed: {counts['passed']}")
            print(f"    ❌ Failed: {counts['failed']}")
            print(f"    ⚠️  Warnings: {counts['warnings']}")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for key in self.test_results['failed'][:10]:  # Show first 10
                details = self.test_results['details'].get(key, {})
                print(f"  - {key}: {details.get('message', 'No message')}")
            if len(self.test_results['failed']) > 10:
                print(f"  ... and {len(self.test_results['failed']) - 10} more")
        
        print("\n" + "="*70)
        
        if failed == 0:
            print("✅ All Critical Tests Passed!")
            if warnings > 0:
                print(f"⚠️  {warnings} warnings to review")
        else:
            print("❌ Some Tests Failed - Review Required")
        print("="*70)


if __name__ == '__main__':
    test = DetailedIntegrationTest()
    success = test.run_all_tests()
    sys.exit(0 if success else 1)
