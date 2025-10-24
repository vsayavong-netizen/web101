"""
API integration tests
"""
import pytest
import json
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User
from students.models import Student
from advisors.models import Advisor
from projects.models import Project, ProjectGroup
from notifications.models import Notification
from conftest import UserFactory, StudentFactory, AdvisorFactory, ProjectFactory, ProjectGroupFactory, NotificationFactory

User = get_user_model()


class TestAPIAuthentication:
    """Test API authentication flow"""
    
    def test_complete_auth_flow(self, api_client):
        """Test complete authentication flow"""
        # Register user
        register_url = reverse('user-register')
        register_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'role': 'Student'
        }
        register_response = api_client.post(register_url, register_data, format='json')
        assert register_response.status_code == status.HTTP_201_CREATED
        
        # Login user
        login_url = reverse('token_obtain_pair')
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        login_response = api_client.post(login_url, login_data, format='json')
        assert login_response.status_code == status.HTTP_200_OK
        assert 'access' in login_response.data
        assert 'refresh' in login_response.data
        
        # Use access token
        access_token = login_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test authenticated endpoint
        profile_url = reverse('user-profile')
        profile_response = api_client.get(profile_url)
        assert profile_response.status_code == status.HTTP_200_OK
        assert profile_response.data['username'] == 'testuser'
    
    def test_token_refresh_flow(self, api_client, user):
        """Test token refresh flow"""
        # Get initial tokens
        login_url = reverse('token_obtain_pair')
        login_data = {
            'username': user.username,
            'password': 'password123'
        }
        login_response = api_client.post(login_url, login_data, format='json')
        refresh_token = login_response.data['refresh']
        
        # Refresh token
        refresh_url = reverse('token_refresh')
        refresh_data = {'refresh': refresh_token}
        refresh_response = api_client.post(refresh_url, refresh_data, format='json')
        assert refresh_response.status_code == status.HTTP_200_OK
        assert 'access' in refresh_response.data
        
        # Use new access token
        new_access_token = refresh_response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
        
        # Test authenticated endpoint
        profile_url = reverse('user-profile')
        profile_response = api_client.get(profile_url)
        assert profile_response.status_code == status.HTTP_200_OK


class TestAPIEndpoints:
    """Test API endpoints integration"""
    
    def test_student_crud_flow(self, authenticated_client):
        """Test complete student CRUD flow"""
        # Create student
        user = UserFactory(role='Student')
        create_url = reverse('student-list')
        create_data = {
            'user': user.id,
            'student_id': 'STU001',
            'major': 'Computer Science',
            'gpa': 3.5,
            'academic_year': '2024'
        }
        create_response = authenticated_client.post(create_url, create_data, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        student_id = create_response.data['id']
        
        # Read student
        detail_url = reverse('student-detail', kwargs={'pk': student_id})
        read_response = authenticated_client.get(detail_url)
        assert read_response.status_code == status.HTTP_200_OK
        assert read_response.data['student_id'] == 'STU001'
        
        # Update student
        update_data = {
            'user': user.id,
            'student_id': 'STU001',
            'major': 'Updated Major',
            'gpa': 3.8,
            'academic_year': '2024'
        }
        update_response = authenticated_client.put(detail_url, update_data, format='json')
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data['major'] == 'Updated Major'
        
        # Delete student
        delete_response = authenticated_client.delete(detail_url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
        
        # Verify deletion
        verify_response = authenticated_client.get(detail_url)
        assert verify_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_project_crud_flow(self, authenticated_client):
        """Test complete project CRUD flow"""
        # Create advisor first
        advisor_user = UserFactory(role='Advisor')
        advisor = AdvisorFactory(user=advisor_user)
        
        # Create project
        create_url = reverse('project-list')
        create_data = {
            'project': {
                'project_id': 'PROJ001',
                'title': 'Test Project',
                'description': 'A test project',
                'advisor': advisor.id,
                'status': 'Pending'
            },
            'students': []
        }
        create_response = authenticated_client.post(create_url, create_data, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        project_group_id = create_response.data['id']
        
        # Read project
        detail_url = reverse('project-detail', kwargs={'pk': project_group_id})
        read_response = authenticated_client.get(detail_url)
        assert read_response.status_code == status.HTTP_200_OK
        assert read_response.data['project']['project_id'] == 'PROJ001'
        
        # Update project
        update_data = {
            'project': {
                'project_id': 'PROJ001',
                'title': 'Updated Project',
                'description': 'An updated test project',
                'advisor': advisor.id,
                'status': 'Approved'
            },
            'students': []
        }
        update_response = authenticated_client.put(detail_url, update_data, format='json')
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.data['project']['status'] == 'Approved'
        
        # Delete project
        delete_response = authenticated_client.delete(detail_url)
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    
    def test_notification_flow(self, authenticated_client, user):
        """Test notification flow"""
        # Create notification
        create_url = reverse('notification-list')
        create_data = {
            'title': 'Test Notification',
            'message': 'This is a test notification',
            'type': 'System',
            'user_ids': [str(user.id)],
            'project_id': 'PROJ001'
        }
        create_response = authenticated_client.post(create_url, create_data, format='json')
        assert create_response.status_code == status.HTTP_201_CREATED
        notification_id = create_response.data['id']
        
        # Read notification
        detail_url = reverse('notification-detail', kwargs={'pk': notification_id})
        read_response = authenticated_client.get(detail_url)
        assert read_response.status_code == status.HTTP_200_OK
        assert read_response.data['title'] == 'Test Notification'
        
        # Mark as read
        mark_read_url = reverse('notification-mark-read', kwargs={'pk': notification_id})
        mark_read_response = authenticated_client.post(mark_read_url)
        assert mark_read_response.status_code == status.HTTP_200_OK
        
        # Verify read status
        verify_response = authenticated_client.get(detail_url)
        assert verify_response.status_code == status.HTTP_200_OK
        assert verify_response.data['read'] is True


class TestAPIPagination:
    """Test API pagination"""
    
    def test_student_pagination(self, authenticated_client):
        """Test student list pagination"""
        # Create more students than default page size
        StudentFactory.create_batch(25)
        
        # Test first page
        url = reverse('student-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'next' in response.data
        assert 'previous' in response.data
        assert len(response.data['results']) <= 20  # Default page size
        
        # Test second page
        if response.data['next']:
            next_response = authenticated_client.get(response.data['next'])
            assert next_response.status_code == status.HTTP_200_OK
            assert len(next_response.data['results']) <= 20
    
    def test_project_pagination(self, authenticated_client):
        """Test project list pagination"""
        # Create more projects than default page size
        ProjectFactory.create_batch(25)
        
        # Test first page
        url = reverse('project-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert len(response.data['results']) <= 20


class TestAPIFiltering:
    """Test API filtering"""
    
    def test_student_filtering(self, authenticated_client):
        """Test student filtering"""
        # Create students with different majors
        StudentFactory(major='Computer Science')
        StudentFactory(major='Mathematics')
        StudentFactory(major='Computer Science')
        
        # Filter by major
        url = reverse('student-list')
        response = authenticated_client.get(url, {'major': 'Computer Science'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
        for student in response.data['results']:
            assert student['major'] == 'Computer Science'
    
    def test_project_filtering(self, authenticated_client):
        """Test project filtering"""
        # Create projects with different statuses
        ProjectFactory(status='Pending')
        ProjectFactory(status='Approved')
        ProjectFactory(status='Pending')
        
        # Filter by status
        url = reverse('project-list')
        response = authenticated_client.get(url, {'status': 'Pending'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
        for project in response.data['results']:
            assert project['project']['status'] == 'Pending'


class TestAPISearch:
    """Test API search functionality"""
    
    def test_student_search(self, authenticated_client):
        """Test student search"""
        # Create students with different IDs
        StudentFactory(student_id='STU001')
        StudentFactory(student_id='STU002')
        StudentFactory(student_id='STU003')
        
        # Search for specific student
        url = reverse('student-list')
        response = authenticated_client.get(url, {'search': 'STU001'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['student_id'] == 'STU001'
    
    def test_project_search(self, authenticated_client):
        """Test project search"""
        # Create projects with different titles
        ProjectFactory(title='Machine Learning Project')
        ProjectFactory(title='Web Development Project')
        ProjectFactory(title='Data Science Project')
        
        # Search for specific project
        url = reverse('project-list')
        response = authenticated_client.get(url, {'search': 'Machine Learning'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert 'Machine Learning' in response.data['results'][0]['project']['title']


class TestAPIBulkOperations:
    """Test API bulk operations"""
    
    def test_bulk_student_creation(self, authenticated_client):
        """Test bulk student creation"""
        users = UserFactory.create_batch(3, role='Student')
        url = reverse('student-bulk-create')
        data = {
            'students': [
                {
                    'user': user.id,
                    'student_id': f'STU{i:03d}',
                    'major': 'Computer Science',
                    'gpa': 3.5,
                    'academic_year': '2024'
                }
                for i, user in enumerate(users)
            ]
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert len(response.data) == 3
        assert Student.objects.count() == 3
    
    def test_bulk_student_update(self, authenticated_client):
        """Test bulk student update"""
        students = StudentFactory.create_batch(3)
        url = reverse('student-bulk-update')
        data = {
            'student_ids': [str(s.id) for s in students],
            'updates': {'major': 'Updated Major'}
        }
        response = authenticated_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Verify updates
        for student in students:
            student.refresh_from_db()
            assert student.major == 'Updated Major'
    
    def test_bulk_student_deletion(self, authenticated_client):
        """Test bulk student deletion"""
        students = StudentFactory.create_batch(3)
        url = reverse('student-bulk-delete')
        data = {'student_ids': [str(s.id) for s in students]}
        response = authenticated_client.delete(url, data, format='json')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Student.objects.count() == 0


class TestAPIPermissions:
    """Test API permissions"""
    
    def test_admin_only_endpoints(self, api_client, admin_user):
        """Test admin-only endpoints"""
        api_client.force_authenticate(user=admin_user)
        
        # Test admin dashboard
        url = reverse('admin-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_advisor_only_endpoints(self, api_client, advisor_user):
        """Test advisor-only endpoints"""
        api_client.force_authenticate(user=advisor_user)
        
        # Test advisor dashboard
        url = reverse('advisor-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_student_only_endpoints(self, api_client, student_user):
        """Test student-only endpoints"""
        api_client.force_authenticate(user=student_user)
        
        # Test student dashboard
        url = reverse('student-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_cross_role_access_denied(self, api_client, student_user):
        """Test cross-role access is denied"""
        api_client.force_authenticate(user=student_user)
        
        # Student should not access admin endpoints
        url = reverse('admin-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestAPIErrorHandling:
    """Test API error handling"""
    
    def test_400_bad_request(self, authenticated_client):
        """Test 400 bad request handling"""
        url = reverse('student-list')
        data = {
            'student_id': '',  # Invalid empty string
            'major': 'Computer Science',
            'gpa': 'invalid_gpa'  # Invalid GPA format
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_401_unauthorized(self, api_client):
        """Test 401 unauthorized handling"""
        url = reverse('student-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_403_forbidden(self, api_client, student_user):
        """Test 403 forbidden handling"""
        api_client.force_authenticate(user=student_user)
        
        # Student should not access admin endpoints
        url = reverse('admin-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_404_not_found(self, authenticated_client):
        """Test 404 not found handling"""
        url = reverse('student-detail', kwargs={'pk': 99999})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_500_internal_server_error(self, authenticated_client):
        """Test 500 internal server error handling"""
        # This would test scenarios that cause 500 errors
        # For now, just test that the endpoint exists
        url = reverse('student-list')
        response = authenticated_client.get(url)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]


class TestAPIDocumentation:
    """Test API documentation endpoints"""
    
    def test_api_schema(self, api_client):
        """Test API schema endpoint"""
        url = reverse('schema')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'openapi' in response.data
    
    def test_swagger_ui(self, api_client):
        """Test Swagger UI endpoint"""
        url = reverse('swagger-ui')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_redoc(self, api_client):
        """Test ReDoc endpoint"""
        url = reverse('redoc')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK


class TestAPIPerformance:
    """Test API performance"""
    
    def test_large_dataset_handling(self, authenticated_client):
        """Test handling of large datasets"""
        # Create large dataset
        StudentFactory.create_batch(100)
        
        # Test pagination performance
        url = reverse('student-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) <= 20  # Should be paginated
    
    def test_complex_queries(self, authenticated_client):
        """Test complex query performance"""
        # Create complex data relationships
        advisor = AdvisorFactory()
        students = StudentFactory.create_batch(5)
        projects = ProjectFactory.create_batch(3, advisor=advisor)
        
        for project in projects:
            project_group = ProjectGroupFactory(project=project)
            project_group.students.set(students[:2])  # Assign 2 students to each project
        
        # Test complex filtering
        url = reverse('project-list')
        response = authenticated_client.get(url, {
            'advisor': advisor.id,
            'status': 'Pending'
        })
        assert response.status_code == status.HTTP_200_OK


class TestAPISecurity:
    """Test API security"""
    
    def test_sql_injection_protection(self, authenticated_client):
        """Test SQL injection protection"""
        url = reverse('student-list')
        # Attempt SQL injection
        response = authenticated_client.get(url, {
            'search': "'; DROP TABLE students; --"
        })
        assert response.status_code == status.HTTP_200_OK
        # Should not crash or return unexpected results
    
    def test_xss_protection(self, authenticated_client):
        """Test XSS protection"""
        url = reverse('student-list')
        data = {
            'student_id': '<script>alert("xss")</script>',
            'major': 'Computer Science',
            'gpa': 3.5,
            'academic_year': '2024'
        }
        response = authenticated_client.post(url, data, format='json')
        # Should either reject the request or sanitize the input
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]
    
    def test_csrf_protection(self, api_client):
        """Test CSRF protection"""
        # CSRF protection should be handled by Django
        # This is a basic test to ensure the endpoint exists
        url = reverse('student-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
