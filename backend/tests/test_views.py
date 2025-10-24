"""
Comprehensive view tests
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


class TestAuthenticationViews:
    """Test authentication views"""
    
    def test_user_registration(self, api_client):
        """Test user registration"""
        url = reverse('user-register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpassword123',
            'role': 'Student'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(username='newuser').exists()
    
    def test_user_login(self, api_client, user):
        """Test user login"""
        url = reverse('token_obtain_pair')
        data = {
            'username': user.username,
            'password': 'password123'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_user_login_invalid_credentials(self, api_client):
        """Test user login with invalid credentials"""
        url = reverse('token_obtain_pair')
        data = {
            'username': 'nonexistent',
            'password': 'wrongpassword'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_token_refresh(self, api_client, user):
        """Test token refresh"""
        # First get tokens
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
        response = api_client.post(refresh_url, refresh_data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
    
    def test_user_profile(self, authenticated_client, user):
        """Test user profile retrieval"""
        url = reverse('user-profile')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == user.username


class TestStudentViews:
    """Test student views"""
    
    def test_student_list(self, authenticated_client):
        """Test student list view"""
        StudentFactory.create_batch(3)
        url = reverse('student-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_student_detail(self, authenticated_client, student):
        """Test student detail view"""
        url = reverse('student-detail', kwargs={'pk': student.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['student_id'] == student.student_id
    
    def test_student_creation(self, authenticated_client):
        """Test student creation"""
        user = UserFactory(role='Student')
        url = reverse('student-list')
        data = {
            'user': user.id,
            'student_id': 'STU001',
            'major': 'Computer Science',
            'gpa': 3.5,
            'academic_year': '2024'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Student.objects.filter(student_id='STU001').exists()
    
    def test_student_update(self, authenticated_client, student):
        """Test student update"""
        url = reverse('student-detail', kwargs={'pk': student.pk})
        data = {
            'student_id': student.student_id,
            'major': 'Updated Major',
            'gpa': 3.8,
            'academic_year': student.academic_year
        }
        response = authenticated_client.put(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        student.refresh_from_db()
        assert student.major == 'Updated Major'
    
    def test_student_deletion(self, authenticated_client, student):
        """Test student deletion"""
        url = reverse('student-detail', kwargs={'pk': student.pk})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Student.objects.filter(pk=student.pk).exists()
    
    def test_student_search(self, authenticated_client):
        """Test student search functionality"""
        StudentFactory(student_id='STU001')
        StudentFactory(student_id='STU002')
        url = reverse('student-list')
        response = authenticated_client.get(url, {'search': 'STU001'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['student_id'] == 'STU001'
    
    def test_student_filtering(self, authenticated_client):
        """Test student filtering"""
        StudentFactory(major='Computer Science')
        StudentFactory(major='Mathematics')
        url = reverse('student-list')
        response = authenticated_client.get(url, {'major': 'Computer Science'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['major'] == 'Computer Science'


class TestAdvisorViews:
    """Test advisor views"""
    
    def test_advisor_list(self, authenticated_client):
        """Test advisor list view"""
        AdvisorFactory.create_batch(3)
        url = reverse('advisor-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_advisor_detail(self, authenticated_client, advisor):
        """Test advisor detail view"""
        url = reverse('advisor-detail', kwargs={'pk': advisor.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['specialization'] == advisor.specialization
    
    def test_advisor_creation(self, authenticated_client):
        """Test advisor creation"""
        user = UserFactory(role='Advisor')
        url = reverse('advisor-list')
        data = {
            'user': user.id,
            'specialization': 'Computer Science',
            'max_students': 5,
            'current_students': 0
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Advisor.objects.filter(specialization='Computer Science').exists()
    
    def test_advisor_update(self, authenticated_client, advisor):
        """Test advisor update"""
        url = reverse('advisor-detail', kwargs={'pk': advisor.pk})
        data = {
            'specialization': 'Updated Specialization',
            'max_students': 10,
            'current_students': advisor.current_students
        }
        response = authenticated_client.put(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        advisor.refresh_from_db()
        assert advisor.specialization == 'Updated Specialization'
    
    def test_advisor_deletion(self, authenticated_client, advisor):
        """Test advisor deletion"""
        url = reverse('advisor-detail', kwargs={'pk': advisor.pk})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Advisor.objects.filter(pk=advisor.pk).exists()


class TestProjectViews:
    """Test project views"""
    
    def test_project_list(self, authenticated_client):
        """Test project list view"""
        ProjectFactory.create_batch(3)
        url = reverse('project-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 3
    
    def test_project_detail(self, authenticated_client, project_group):
        """Test project detail view"""
        url = reverse('project-detail', kwargs={'pk': project_group.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['project']['project_id'] == project_group.project.project_id
    
    def test_project_creation(self, authenticated_client, advisor):
        """Test project creation"""
        url = reverse('project-list')
        data = {
            'project': {
                'project_id': 'PROJ001',
                'title': 'Test Project',
                'description': 'A test project',
                'advisor': advisor.id,
                'status': 'Pending'
            },
            'students': []
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Project.objects.filter(project_id='PROJ001').exists()
    
    def test_project_update(self, authenticated_client, project_group):
        """Test project update"""
        url = reverse('project-detail', kwargs={'pk': project_group.pk})
        data = {
            'project': {
                'project_id': project_group.project.project_id,
                'title': 'Updated Project',
                'description': project_group.project.description,
                'advisor': project_group.project.advisor.id,
                'status': 'Approved'
            },
            'students': []
        }
        response = authenticated_client.put(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        project_group.project.refresh_from_db()
        assert project_group.project.status == 'Approved'
    
    def test_project_deletion(self, authenticated_client, project_group):
        """Test project deletion"""
        url = reverse('project-detail', kwargs={'pk': project_group.pk})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not ProjectGroup.objects.filter(pk=project_group.pk).exists()


class TestNotificationViews:
    """Test notification views"""
    
    def test_notification_list(self, authenticated_client, user):
        """Test notification list view"""
        NotificationFactory(user_ids=[str(user.id)])
        url = reverse('notification-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
    
    def test_notification_detail(self, authenticated_client, notification):
        """Test notification detail view"""
        url = reverse('notification-detail', kwargs={'pk': notification.pk})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == notification.title
    
    def test_notification_creation(self, authenticated_client, user):
        """Test notification creation"""
        url = reverse('notification-list')
        data = {
            'title': 'Test Notification',
            'message': 'This is a test notification',
            'type': 'System',
            'user_ids': [str(user.id)],
            'project_id': 'PROJ001'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Notification.objects.filter(title='Test Notification').exists()
    
    def test_notification_mark_read(self, authenticated_client, notification):
        """Test marking notification as read"""
        url = reverse('notification-mark-read', kwargs={'pk': notification.pk})
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        notification.refresh_from_db()
        assert notification.read is True


class TestPermissionViews:
    """Test permission-based views"""
    
    def test_admin_only_endpoints(self, api_client, admin_user):
        """Test admin-only endpoints"""
        # Login as admin
        api_client.force_authenticate(user=admin_user)
        
        # Test admin dashboard
        url = reverse('admin-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_advisor_only_endpoints(self, api_client, advisor_user):
        """Test advisor-only endpoints"""
        # Login as advisor
        api_client.force_authenticate(user=advisor_user)
        
        # Test advisor dashboard
        url = reverse('advisor-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_student_only_endpoints(self, api_client, student_user):
        """Test student-only endpoints"""
        # Login as student
        api_client.force_authenticate(user=student_user)
        
        # Test student dashboard
        url = reverse('student-dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_unauthorized_access(self, api_client):
        """Test unauthorized access"""
        # Test without authentication
        url = reverse('student-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestPaginationViews:
    """Test pagination in views"""
    
    def test_student_pagination(self, authenticated_client):
        """Test student list pagination"""
        StudentFactory.create_batch(25)  # Create more than default page size
        url = reverse('student-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert 'next' in response.data
        assert 'previous' in response.data
        assert len(response.data['results']) <= 20  # Default page size
    
    def test_project_pagination(self, authenticated_client):
        """Test project list pagination"""
        ProjectFactory.create_batch(25)
        url = reverse('project-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'count' in response.data
        assert len(response.data['results']) <= 20


class TestFilteringViews:
    """Test filtering in views"""
    
    def test_student_filtering_by_major(self, authenticated_client):
        """Test student filtering by major"""
        StudentFactory(major='Computer Science')
        StudentFactory(major='Mathematics')
        url = reverse('student-list')
        response = authenticated_client.get(url, {'major': 'Computer Science'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['major'] == 'Computer Science'
    
    def test_project_filtering_by_status(self, authenticated_client):
        """Test project filtering by status"""
        ProjectFactory(status='Pending')
        ProjectFactory(status='Approved')
        url = reverse('project-list')
        response = authenticated_client.get(url, {'status': 'Pending'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['project']['status'] == 'Pending'


class TestSearchViews:
    """Test search functionality in views"""
    
    def test_student_search(self, authenticated_client):
        """Test student search"""
        StudentFactory(student_id='STU001')
        StudentFactory(student_id='STU002')
        url = reverse('student-list')
        response = authenticated_client.get(url, {'search': 'STU001'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['student_id'] == 'STU001'
    
    def test_project_search(self, authenticated_client):
        """Test project search"""
        ProjectFactory(title='Machine Learning Project')
        ProjectFactory(title='Web Development Project')
        url = reverse('project-list')
        response = authenticated_client.get(url, {'search': 'Machine Learning'})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert 'Machine Learning' in response.data['results'][0]['project']['title']


class TestBulkOperations:
    """Test bulk operations"""
    
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


class TestErrorHandling:
    """Test error handling in views"""
    
    def test_invalid_data_handling(self, authenticated_client):
        """Test handling of invalid data"""
        url = reverse('student-list')
        data = {
            'student_id': '',  # Invalid empty string
            'major': 'Computer Science',
            'gpa': 'invalid_gpa'  # Invalid GPA format
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'errors' in response.data or 'detail' in response.data
    
    def test_not_found_handling(self, authenticated_client):
        """Test handling of not found resources"""
        url = reverse('student-detail', kwargs={'pk': 99999})
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_duplicate_data_handling(self, authenticated_client):
        """Test handling of duplicate data"""
        StudentFactory(student_id='STU001')
        url = reverse('student-list')
        data = {
            'student_id': 'STU001',  # Duplicate
            'major': 'Computer Science',
            'gpa': 3.5,
            'academic_year': '2024'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
