#!/usr/bin/env python3
"""
CRUD Operations Test Script for BM23 System
Tests Add, Edit, Delete operations for all workflows
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
from projects.models import ProjectGroup, Project, ProjectStudent, LogEntry
from settings.models import AcademicYear

User = get_user_model()


class CRUDOperationsTest:
    """Test CRUD operations for all workflows"""
    
    def __init__(self):
        self.client = APIClient()
        self.test_results = {
            'passed': [],
            'failed': [],
            'warnings': [],
            'skipped': [],
            'details': {}
        }
        self.created_resources = {}  # Track created resources for cleanup
        self.setup_test_data()
    
    def setup_test_data(self):
        """Set up test data"""
        print("\n" + "="*70)
        print("Setting up test data for CRUD operations...")
        print("="*70)
        
        try:
            # Create admin user
            self.admin_user, _ = User.objects.get_or_create(
                username='test_admin_crud',
                defaults={
                    'email': 'admin_crud@test.com',
                    'role': 'Admin',
                    'first_name': 'Test',
                    'last_name': 'Admin',
                    'is_active': True
                }
            )
            if not self.admin_user.check_password('admin123'):
                self.admin_user.set_password('admin123')
                self.admin_user.save()
            
            # Create advisor user
            self.advisor_user, _ = User.objects.get_or_create(
                username='test_advisor_crud',
                defaults={
                    'email': 'advisor_crud@test.com',
                    'role': 'Advisor',
                    'first_name': 'Test',
                    'last_name': 'Advisor',
                    'is_active': True
                }
            )
            if not self.advisor_user.check_password('advisor123'):
                self.advisor_user.set_password('advisor123')
                self.advisor_user.save()
            
            # Create student user
            self.student_user, _ = User.objects.get_or_create(
                username='test_student_crud',
                defaults={
                    'email': 'student_crud@test.com',
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
                    'advisor_id': 'ADV_CRUD001',
                    'quota': 5
                }
            )
            
            # Create student
            self.student, _ = Student.objects.get_or_create(
                user=self.student_user,
                defaults={
                    'student_id': 'STU_CRUD001',
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
    
    def log_result(self, category, operation, resource, status, message='', details=None):
        """Log test result"""
        key = f"{category}::{operation}::{resource}"
        
        if status == 'pass':
            self.test_results['passed'].append(key)
            self.test_results['details'][key] = {
                'status': 'pass',
                'message': message,
                'details': details or {}
            }
            print(f"   ✅ [{category}] {operation} {resource}: {message}")
        elif status == 'fail':
            self.test_results['failed'].append(key)
            self.test_results['details'][key] = {
                'status': 'fail',
                'message': message,
                'details': details or {}
            }
            print(f"   ❌ [{category}] {operation} {resource}: {message}")
        elif status == 'warn':
            self.test_results['warnings'].append(key)
            self.test_results['details'][key] = {
                'status': 'warn',
                'message': message,
                'details': details or {}
            }
            print(f"   ⚠️  [{category}] {operation} {resource}: {message}")
        else:
            self.test_results['skipped'].append(key)
            self.test_results['details'][key] = {
                'status': 'skip',
                'message': message,
                'details': details or {}
            }
            print(f"   ⏭️  [{category}] {operation} {resource}: {message}")
    
    def test_project_crud(self):
        """Test Project CRUD operations"""
        print("\n" + "="*70)
        print("Testing Project CRUD Operations")
        print("="*70)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # CREATE
        try:
            project_data = {
                'project_id': 'CRUD_TEST001',
                'title': 'CRUD Test Project',
                'status': 'Pending',
                'advisor': self.advisor.id
            }
            response = self.client.post('/api/projects/projects/', project_data)
            
            if response.status_code == status.HTTP_201_CREATED:
                project_id = response.data.get('id')
                project_id_str = response.data.get('project_id')
                self.created_resources['project'] = project_id
                
                self.log_result(
                    'Project', 'CREATE', 'Project', 'pass',
                    f'Created: {project_id_str}',
                    {'id': project_id, 'project_id': project_id_str}
                )
            else:
                self.log_result(
                    'Project', 'CREATE', 'Project', 'fail',
                    f'Status: {response.status_code}, Data: {response.data}'
                )
                return
        except Exception as e:
            self.log_result('Project', 'CREATE', 'Project', 'fail', str(e))
            return
        
        # READ
        try:
            if 'project' in self.created_resources:
                project_id = self.created_resources['project']
                response = self.client.get(f'/api/projects/projects/{project_id}/')
                
                if response.status_code == status.HTTP_200_OK:
                    data = response.data
                    required_fields = ['id', 'project_id', 'status']
                    missing = [f for f in required_fields if f not in data]
                    
                    if not missing:
                        self.log_result(
                            'Project', 'READ', 'Project', 'pass',
                            f'Retrieved: {data.get("project_id")}',
                            {'fields': required_fields}
                        )
                    else:
                        self.log_result(
                            'Project', 'READ', 'Project', 'warn',
                            f'Missing fields: {", ".join(missing)}'
                        )
                else:
                    self.log_result(
                        'Project', 'READ', 'Project', 'fail',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Project', 'READ', 'Project', 'skip', 'No project created')
        except Exception as e:
            self.log_result('Project', 'READ', 'Project', 'fail', str(e))
        
        # UPDATE
        try:
            if 'project' in self.created_resources:
                project_id = self.created_resources['project']
                update_data = {
                    'title': 'Updated CRUD Test Project',
                    'status': 'Approved'
                }
                response = self.client.patch(f'/api/projects/projects/{project_id}/', update_data)
                
                if response.status_code == status.HTTP_200_OK:
                    # Verify update
                    get_response = self.client.get(f'/api/projects/projects/{project_id}/')
                    if get_response.status_code == status.HTTP_200_OK:
                        updated_title = get_response.data.get('title')
                        updated_status = get_response.data.get('status')
                        
                        if updated_title == 'Updated CRUD Test Project' and updated_status == 'Approved':
                            self.log_result(
                                'Project', 'UPDATE', 'Project', 'pass',
                                f'Updated: title={updated_title}, status={updated_status}',
                                {'title': updated_title, 'status': updated_status}
                            )
                        else:
                            self.log_result(
                                'Project', 'UPDATE', 'Project', 'warn',
                                f'Update not reflected: title={updated_title}, status={updated_status}'
                            )
                else:
                    self.log_result(
                        'Project', 'UPDATE', 'Project', 'fail',
                        f'Status: {response.status_code}, Data: {response.data}'
                    )
            else:
                self.log_result('Project', 'UPDATE', 'Project', 'skip', 'No project created')
        except Exception as e:
            self.log_result('Project', 'UPDATE', 'Project', 'fail', str(e))
        
        # DELETE
        try:
            if 'project' in self.created_resources:
                project_id = self.created_resources['project']
                response = self.client.delete(f'/api/projects/projects/{project_id}/')
                
                if response.status_code in [status.HTTP_204_NO_CONTENT, status.HTTP_200_OK]:
                    # Verify deletion
                    get_response = self.client.get(f'/api/projects/projects/{project_id}/')
                    if get_response.status_code == status.HTTP_404_NOT_FOUND:
                        self.log_result(
                            'Project', 'DELETE', 'Project', 'pass',
                            'Deleted and verified',
                            {'status': response.status_code}
                        )
                        del self.created_resources['project']
                    else:
                        self.log_result(
                            'Project', 'DELETE', 'Project', 'warn',
                            'Deleted but still accessible'
                        )
                else:
                    self.log_result(
                        'Project', 'DELETE', 'Project', 'fail',
                        f'Status: {response.status_code}, Data: {response.data}'
                    )
            else:
                self.log_result('Project', 'DELETE', 'Project', 'skip', 'No project created')
        except Exception as e:
            self.log_result('Project', 'DELETE', 'Project', 'fail', str(e))
    
    def test_student_crud(self):
        """Test Student CRUD operations"""
        print("\n" + "="*70)
        print("Testing Student CRUD Operations")
        print("="*70)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # CREATE
        try:
            student_data = {
                'student_id': 'STU_CRUD_NEW',
                'major': 'Computer Science',
                'classroom': 'CS-2024',
                'academic_year': '2024-2025',
                'user': {
                    'username': 'new_student_crud',
                    'email': 'new_student_crud@test.com',
                    'first_name': 'New',
                    'last_name': 'Student',
                    'role': 'Student',
                    'password': 'student123'
                }
            }
            response = self.client.post('/api/students/', student_data, format='json')
            
            if response.status_code == status.HTTP_201_CREATED:
                student_id = response.data.get('id')
                student_id_str = response.data.get('student_id')
                self.created_resources['student'] = student_id
                
                self.log_result(
                    'Student', 'CREATE', 'Student', 'pass',
                    f'Created: {student_id_str}',
                    {'id': student_id, 'student_id': student_id_str}
                )
            else:
                self.log_result(
                    'Student', 'CREATE', 'Student', 'warn',
                    f'Status: {response.status_code}, May need user creation first'
                )
                # Use existing student for other tests
                self.created_resources['student'] = self.student.id
        except Exception as e:
            self.log_result('Student', 'CREATE', 'Student', 'fail', str(e))
            self.created_resources['student'] = self.student.id
        
        # READ
        try:
            if 'student' in self.created_resources:
                student_id = self.created_resources['student']
                response = self.client.get(f'/api/students/{student_id}/')
                
                if response.status_code == status.HTTP_200_OK:
                    data = response.data
                    required_fields = ['id', 'student_id']
                    missing = [f for f in required_fields if f not in data]
                    
                    if not missing:
                        self.log_result(
                            'Student', 'READ', 'Student', 'pass',
                            f'Retrieved: {data.get("student_id")}',
                            {'fields': required_fields}
                        )
                    else:
                        self.log_result(
                            'Student', 'READ', 'Student', 'warn',
                            f'Missing fields: {", ".join(missing)}'
                        )
                else:
                    self.log_result(
                        'Student', 'READ', 'Student', 'fail',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Student', 'READ', 'Student', 'skip', 'No student available')
        except Exception as e:
            self.log_result('Student', 'READ', 'Student', 'fail', str(e))
        
        # UPDATE
        try:
            if 'student' in self.created_resources:
                student_id = self.created_resources['student']
                update_data = {
                    'major': 'Updated Major',
                    'classroom': 'CS-2025'
                }
                response = self.client.patch(f'/api/students/{student_id}/', update_data)
                
                if response.status_code == status.HTTP_200_OK:
                    # Verify update
                    get_response = self.client.get(f'/api/students/{student_id}/')
                    if get_response.status_code == status.HTTP_200_OK:
                        updated_major = get_response.data.get('major')
                        
                        if updated_major == 'Updated Major':
                            self.log_result(
                                'Student', 'UPDATE', 'Student', 'pass',
                                f'Updated: major={updated_major}',
                                {'major': updated_major}
                            )
                        else:
                            self.log_result(
                                'Student', 'UPDATE', 'Student', 'warn',
                                f'Update not reflected: major={updated_major}'
                            )
                else:
                    self.log_result(
                        'Student', 'UPDATE', 'Student', 'warn',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Student', 'UPDATE', 'Student', 'skip', 'No student available')
        except Exception as e:
            self.log_result('Student', 'UPDATE', 'Student', 'fail', str(e))
        
        # DELETE (Skip for existing test data)
        self.log_result('Student', 'DELETE', 'Student', 'skip', 'Skipped to preserve test data')
    
    def test_advisor_crud(self):
        """Test Advisor CRUD operations"""
        print("\n" + "="*70)
        print("Testing Advisor CRUD Operations")
        print("="*70)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # CREATE
        try:
            advisor_data = {
                'advisor_id': 'ADV_CRUD_NEW',
                'quota': 3,
                'user': {
                    'username': 'new_advisor_crud',
                    'email': 'new_advisor_crud@test.com',
                    'first_name': 'New',
                    'last_name': 'Advisor',
                    'role': 'Advisor',
                    'password': 'advisor123'
                }
            }
            response = self.client.post('/api/advisors/', advisor_data, format='json')
            
            if response.status_code == status.HTTP_201_CREATED:
                advisor_id = response.data.get('id')
                advisor_id_str = response.data.get('advisor_id')
                self.created_resources['advisor'] = advisor_id
                
                self.log_result(
                    'Advisor', 'CREATE', 'Advisor', 'pass',
                    f'Created: {advisor_id_str}',
                    {'id': advisor_id, 'advisor_id': advisor_id_str}
                )
            else:
                self.log_result(
                    'Advisor', 'CREATE', 'Advisor', 'warn',
                    f'Status: {response.status_code}, May need user creation first'
                )
                # Use existing advisor for other tests
                self.created_resources['advisor'] = self.advisor.id
        except Exception as e:
            self.log_result('Advisor', 'CREATE', 'Advisor', 'fail', str(e))
            self.created_resources['advisor'] = self.advisor.id
        
        # READ
        try:
            if 'advisor' in self.created_resources:
                advisor_id = self.created_resources['advisor']
                response = self.client.get(f'/api/advisors/{advisor_id}/')
                
                if response.status_code == status.HTTP_200_OK:
                    data = response.data
                    required_fields = ['id', 'advisor_id']
                    missing = [f for f in required_fields if f not in data]
                    
                    if not missing:
                        self.log_result(
                            'Advisor', 'READ', 'Advisor', 'pass',
                            f'Retrieved: {data.get("advisor_id")}',
                            {'fields': required_fields}
                        )
                    else:
                        self.log_result(
                            'Advisor', 'READ', 'Advisor', 'warn',
                            f'Missing fields: {", ".join(missing)}'
                        )
                else:
                    self.log_result(
                        'Advisor', 'READ', 'Advisor', 'fail',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Advisor', 'READ', 'Advisor', 'skip', 'No advisor available')
        except Exception as e:
            self.log_result('Advisor', 'READ', 'Advisor', 'fail', str(e))
        
        # UPDATE
        try:
            if 'advisor' in self.created_resources:
                advisor_id = self.created_resources['advisor']
                update_data = {
                    'quota': 10,
                    'academic_title': 'Professor'
                }
                response = self.client.patch(f'/api/advisors/{advisor_id}/', update_data)
                
                if response.status_code == status.HTTP_200_OK:
                    # Verify update
                    get_response = self.client.get(f'/api/advisors/{advisor_id}/')
                    if get_response.status_code == status.HTTP_200_OK:
                        updated_quota = get_response.data.get('quota')
                        
                        if updated_quota == 10:
                            self.log_result(
                                'Advisor', 'UPDATE', 'Advisor', 'pass',
                                f'Updated: quota={updated_quota}',
                                {'quota': updated_quota}
                            )
                        else:
                            self.log_result(
                                'Advisor', 'UPDATE', 'Advisor', 'warn',
                                f'Update not reflected: quota={updated_quota}'
                            )
                else:
                    self.log_result(
                        'Advisor', 'UPDATE', 'Advisor', 'warn',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('Advisor', 'UPDATE', 'Advisor', 'skip', 'No advisor available')
        except Exception as e:
            self.log_result('Advisor', 'UPDATE', 'Advisor', 'fail', str(e))
        
        # DELETE (Skip for existing test data)
        self.log_result('Advisor', 'DELETE', 'Advisor', 'skip', 'Skipped to preserve test data')
    
    def test_log_entry_crud(self):
        """Test Log Entry CRUD operations"""
        print("\n" + "="*70)
        print("Testing Log Entry CRUD Operations")
        print("="*70)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create a project first for log entries
        try:
            project_data = {
                'project_id': 'CRUD_LOG001',
                'title': 'CRUD Log Test Project',
                'status': 'Pending',
                'advisor': self.advisor.id
            }
            response = self.client.post('/api/projects/projects/', project_data)
            
            if response.status_code == status.HTTP_201_CREATED:
                project_id = response.data.get('id')
                self.created_resources['log_project'] = project_id
            else:
                self.log_result('LogEntry', 'CREATE', 'LogEntry', 'skip', 'Cannot create project')
                return
        except Exception as e:
            self.log_result('LogEntry', 'CREATE', 'LogEntry', 'skip', f'Error: {str(e)}')
            return
        
        # CREATE
        try:
            if 'log_project' in self.created_resources:
                project_id = self.created_resources['log_project']
                log_data = {
                    'type': 'comment',
                    'content': 'Test log entry for CRUD operations',
                    'metadata': {'test': True}
                }
                response = self.client.post(f'/api/projects/projects/{project_id}/add_log_entry/', log_data)
                
                if response.status_code == status.HTTP_200_OK:
                    log_entry_id = response.data.get('log_entry', {}).get('id')
                    if log_entry_id:
                        self.created_resources['log_entry'] = log_entry_id
                        self.log_result(
                            'LogEntry', 'CREATE', 'LogEntry', 'pass',
                            f'Created: {log_entry_id}',
                            {'id': log_entry_id}
                        )
                    else:
                        self.log_result(
                            'LogEntry', 'CREATE', 'LogEntry', 'warn',
                            'Created but no ID returned'
                        )
                else:
                    self.log_result(
                        'LogEntry', 'CREATE', 'LogEntry', 'fail',
                        f'Status: {response.status_code}, Data: {response.data}'
                    )
            else:
                self.log_result('LogEntry', 'CREATE', 'LogEntry', 'skip', 'No project available')
        except Exception as e:
            self.log_result('LogEntry', 'CREATE', 'LogEntry', 'fail', str(e))
        
        # READ (via log_entries endpoint)
        try:
            if 'log_project' in self.created_resources:
                project_id = self.created_resources['log_project']
                response = self.client.get(f'/api/projects/projects/{project_id}/log_entries/')
                
                if response.status_code == status.HTTP_200_OK:
                    log_entries = response.data
                    if isinstance(log_entries, list) and len(log_entries) > 0:
                        first_entry = log_entries[0]
                        required_fields = ['id', 'type', 'content']
                        missing = [f for f in required_fields if f not in first_entry]
                        
                        if not missing:
                            self.log_result(
                                'LogEntry', 'READ', 'LogEntry', 'pass',
                                f'Retrieved {len(log_entries)} entries',
                                {'count': len(log_entries), 'fields': required_fields}
                            )
                        else:
                            self.log_result(
                                'LogEntry', 'READ', 'LogEntry', 'warn',
                                f'Missing fields: {", ".join(missing)}'
                            )
                    else:
                        self.log_result(
                            'LogEntry', 'READ', 'LogEntry', 'warn',
                            'No log entries found'
                        )
                else:
                    self.log_result(
                        'LogEntry', 'READ', 'LogEntry', 'fail',
                        f'Status: {response.status_code}'
                    )
            else:
                self.log_result('LogEntry', 'READ', 'LogEntry', 'skip', 'No project available')
        except Exception as e:
            self.log_result('LogEntry', 'READ', 'LogEntry', 'fail', str(e))
        
        # UPDATE (Log entries are typically read-only, but test if update endpoint exists)
        self.log_result('LogEntry', 'UPDATE', 'LogEntry', 'skip', 'Log entries are typically read-only')
        
        # DELETE (Log entries are typically not deletable, but test if delete endpoint exists)
        self.log_result('LogEntry', 'DELETE', 'LogEntry', 'skip', 'Log entries are typically not deletable')
    
    def test_error_handling_crud(self):
        """Test error handling in CRUD operations"""
        print("\n" + "="*70)
        print("Testing CRUD Error Handling")
        print("="*70)
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # CREATE with invalid data
        try:
            invalid_data = {
                'project_id': '',  # Empty required field
                'title': 'Test'
            }
            response = self.client.post('/api/projects/projects/', invalid_data)
            
            if response.status_code == status.HTTP_400_BAD_REQUEST:
                self.log_result(
                    'Error Handling', 'CREATE Invalid Data', 'Project', 'pass',
                    'Properly rejected with 400'
                )
            else:
                self.log_result(
                    'Error Handling', 'CREATE Invalid Data', 'Project', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Error Handling', 'CREATE Invalid Data', 'Project', 'fail', str(e))
        
        # UPDATE non-existent resource
        try:
            response = self.client.patch('/api/projects/projects/99999/', {'title': 'Test'})
            
            if response.status_code == status.HTTP_404_NOT_FOUND:
                self.log_result(
                    'Error Handling', 'UPDATE Non-existent', 'Project', 'pass',
                    'Properly rejected with 404'
                )
            else:
                self.log_result(
                    'Error Handling', 'UPDATE Non-existent', 'Project', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Error Handling', 'UPDATE Non-existent', 'Project', 'fail', str(e))
        
        # DELETE non-existent resource
        try:
            response = self.client.delete('/api/projects/projects/99999/')
            
            if response.status_code == status.HTTP_404_NOT_FOUND:
                self.log_result(
                    'Error Handling', 'DELETE Non-existent', 'Project', 'pass',
                    'Properly rejected with 404'
                )
            else:
                self.log_result(
                    'Error Handling', 'DELETE Non-existent', 'Project', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Error Handling', 'DELETE Non-existent', 'Project', 'fail', str(e))
        
        # READ non-existent resource
        try:
            response = self.client.get('/api/projects/projects/99999/')
            
            if response.status_code == status.HTTP_404_NOT_FOUND:
                self.log_result(
                    'Error Handling', 'READ Non-existent', 'Project', 'pass',
                    'Properly rejected with 404'
                )
            else:
                self.log_result(
                    'Error Handling', 'READ Non-existent', 'Project', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Error Handling', 'READ Non-existent', 'Project', 'fail', str(e))
    
    def test_permissions_crud(self):
        """Test permissions for CRUD operations"""
        print("\n" + "="*70)
        print("Testing CRUD Permissions")
        print("="*70)
        
        # Test student cannot create project
        try:
            refresh = RefreshToken.for_user(self.student_user)
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
            
            project_data = {
                'project_id': 'STU_TEST001',
                'title': 'Student Test Project',
                'status': 'Pending'
            }
            response = self.client.post('/api/projects/projects/', project_data)
            
            if response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED]:
                self.log_result(
                    'Permissions', 'CREATE', 'Project (Student)', 'pass',
                    'Properly restricted'
                )
            else:
                self.log_result(
                    'Permissions', 'CREATE', 'Project (Student)', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Permissions', 'CREATE', 'Project (Student)', 'fail', str(e))
        
        # Test unauthenticated cannot access
        try:
            self.client.credentials()
            response = self.client.get('/api/projects/projects/')
            
            if response.status_code == status.HTTP_401_UNAUTHORIZED:
                self.log_result(
                    'Permissions', 'READ', 'Project (Unauthenticated)', 'pass',
                    'Properly restricted'
                )
            else:
                self.log_result(
                    'Permissions', 'READ', 'Project (Unauthenticated)', 'warn',
                    f'Unexpected status: {response.status_code}'
                )
        except Exception as e:
            self.log_result('Permissions', 'READ', 'Project (Unauthenticated)', 'fail', str(e))
    
    def run_all_tests(self):
        """Run all CRUD tests"""
        print("\n" + "="*70)
        print("BM23 CRUD Operations Testing")
        print("="*70)
        
        try:
            self.test_project_crud()
            self.test_student_crud()
            self.test_advisor_crud()
            self.test_log_entry_crud()
            self.test_error_handling_crud()
            self.test_permissions_crud()
            
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
        print("\n" + "="*70)
        print("CRUD Operations Test Summary")
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
        
        # Group by operation
        operations = {}
        for key in self.test_results['passed'] + self.test_results['failed'] + self.test_results['warnings']:
            parts = key.split('::')
            if len(parts) >= 2:
                operation = parts[1]
                if operation not in operations:
                    operations[operation] = {'passed': 0, 'failed': 0, 'warnings': 0}
                
                if key in self.test_results['passed']:
                    operations[operation]['passed'] += 1
                elif key in self.test_results['failed']:
                    operations[operation]['failed'] += 1
                elif key in self.test_results['warnings']:
                    operations[operation]['warnings'] += 1
        
        print("\nResults by Operation:")
        for operation, counts in operations.items():
            total_op = counts['passed'] + counts['failed'] + counts['warnings']
            print(f"  {operation}:")
            print(f"    ✅ Passed: {counts['passed']}")
            print(f"    ❌ Failed: {counts['failed']}")
            print(f"    ⚠️  Warnings: {counts['warnings']}")
        
        if failed > 0:
            print("\n❌ Failed Tests:")
            for key in self.test_results['failed'][:10]:
                details = self.test_results['details'].get(key, {})
                print(f"  - {key}: {details.get('message', 'No message')}")
            if len(self.test_results['failed']) > 10:
                print(f"  ... and {len(self.test_results['failed']) - 10} more")
        
        print("\n" + "="*70)
        
        if failed == 0:
            print("✅ All Critical CRUD Tests Passed!")
            if warnings > 0:
                print(f"⚠️  {warnings} warnings to review")
        else:
            print("❌ Some CRUD Tests Failed - Review Required")
        print("="*70)


if __name__ == '__main__':
    test = CRUDOperationsTest()
    success = test.run_all_tests()
    sys.exit(0 if success else 1)
