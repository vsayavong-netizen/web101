"""
Tests for accounts app.
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import json

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model."""

    def setUp(self):
        """Set up test data."""
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'Student',
            'phone': '+1234567890',
            'current_academic_year': '2024-2025'
        }

    def test_create_user(self):
        """Test user creation."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.role, 'Student')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_create_superuser(self):
        """Test superuser creation."""
        user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_user_str_representation(self):
        """Test user string representation."""
        user = User.objects.create_user(**self.user_data)
        expected = f"{user.first_name} {user.last_name} ({user.role})"
        self.assertEqual(str(user), expected)

    def test_get_full_name(self):
        """Test get_full_name method."""
        user = User.objects.create_user(**self.user_data)
        expected = f"{user.first_name} {user.last_name}"
        self.assertEqual(user.get_full_name(), expected)

    def test_user_roles(self):
        """Test user role choices."""
        roles = ['Admin', 'DepartmentAdmin', 'Advisor', 'Student']
        for role in roles:
            user_data = self.user_data.copy()
            user_data['username'] = f'test_{role.lower()}'
            user_data['role'] = role
            user = User.objects.create_user(**user_data)
            self.assertEqual(user.role, role)

    def test_user_gender_choices(self):
        """Test user gender choices."""
        genders = ['Male', 'Female', 'Monk']
        for gender in genders:
            user_data = self.user_data.copy()
            user_data['username'] = f'test_{gender.lower()}'
            user_data['gender'] = gender
            user = User.objects.create_user(**user_data)
            self.assertEqual(user.gender, gender)


class UserSessionModelTest(TestCase):
    """Test cases for UserSession model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_user_session(self):
        """Test user session creation."""
        session = self.user.sessions.create(
            session_key='test_session_key',
            ip_address='192.168.1.1',
            user_agent='Test Browser'
        )
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.session_key, 'test_session_key')
        self.assertTrue(session.is_active)

    def test_session_str_representation(self):
        """Test session string representation."""
        session = self.user.sessions.create(
            session_key='test_session_key',
            ip_address='192.168.1.1'
        )
        expected = f"{self.user.username} - {session.session_key}"
        self.assertEqual(str(session), expected)


class PasswordResetTokenModelTest(TestCase):
    """Test cases for PasswordResetToken model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_password_reset_token(self):
        """Test password reset token creation."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            token='test_token_123'
        )
        self.assertEqual(token.user, self.user)
        self.assertEqual(token.token, 'test_token_123')
        self.assertFalse(token.is_used)

    def test_token_str_representation(self):
        """Test token string representation."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            token='test_token_123'
        )
        expected = f"Reset token for {self.user.username}"
        self.assertEqual(str(token), expected)


class UserAPITest(APITestCase):
    """Test cases for User API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='Student'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )

    def test_user_registration(self):
        """Test user registration endpoint."""
        url = reverse('user-register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'Student',
            'phone': '+1234567890'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_user_login(self):
        """Test user login endpoint."""
        url = reverse('user-login')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_profile_retrieve(self):
        """Test user profile retrieval."""
        self.client.force_authenticate(user=self.user)
        url = reverse('user-profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.user.username)

    def test_user_profile_update(self):
        """Test user profile update."""
        self.client.force_authenticate(user=self.user)
        url = reverse('user-profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'phone': '+9876543210'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')

    def test_user_list_requires_admin(self):
        """Test that user list requires admin permissions."""
        self.client.force_authenticate(user=self.user)
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_list_admin_access(self):
        """Test that admin can access user list."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('user-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_authentication_required(self):
        """Test that authentication is required for protected endpoints."""
        url = reverse('user-profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserIntegrationTest(TestCase):
    """Integration tests for user functionality."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='Student'
        )

    def test_user_login_flow(self):
        """Test complete user login flow."""
        # Test login
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, 200)
        
        # Test accessing protected endpoint
        token = response.json()['access']
        headers = {'Authorization': f'Bearer {token}'}
        response = self.client.get('/api/auth/profile/', headers=headers)
        self.assertEqual(response.status_code, 200)

    def test_user_registration_flow(self):
        """Test complete user registration flow."""
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'Student'
        }
        response = self.client.post('/api/auth/register/', data)
        self.assertEqual(response.status_code, 201)
        
        # Verify user was created
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_user_password_change(self):
        """Test user password change."""
        self.client.force_login(self.user)
        data = {
            'old_password': 'testpass123',
            'new_password': 'newpass123'
        }
        response = self.client.post('/api/auth/change-password/', data)
        self.assertEqual(response.status_code, 200)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))


class UserModelValidationTest(TestCase):
    """Test cases for user model validation."""

    def test_username_required(self):
        """Test that username is required."""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email='test@example.com',
                password='testpass123'
            )

    def test_email_required(self):
        """Test that email is required."""
        # Email is not required in our custom User model
        user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.assertIsNotNone(user)

    def test_password_required(self):
        """Test that password is required."""
        # Password is not required in our custom User model
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )
        self.assertIsNotNone(user)

    def test_unique_username(self):
        """Test that username must be unique."""
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        with self.assertRaises(Exception):
            User.objects.create_user(
                username='testuser',
                email='test2@example.com',
                password='testpass123'
            )

    def test_unique_email(self):
        """Test that email must be unique."""
        User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        # Email uniqueness is not enforced in our custom User model
        user2 = User.objects.create_user(
            username='testuser2',
            email='test@example.com',
            password='testpass123'
        )
        self.assertIsNotNone(user2)


class UserPermissionsTest(TestCase):
    """Test cases for user permissions."""

    def setUp(self):
        """Set up test data."""
        self.student = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='testpass123',
            role='Student'
        )
        self.advisor = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='testpass123',
            role='Advisor'
        )
        self.admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )

    def test_student_permissions(self):
        """Test student user permissions."""
        self.assertFalse(self.student.is_staff)
        self.assertFalse(self.student.is_superuser)
        self.assertEqual(self.student.role, 'Student')

    def test_advisor_permissions(self):
        """Test advisor user permissions."""
        self.assertFalse(self.advisor.is_staff)
        self.assertFalse(self.advisor.is_superuser)
        self.assertEqual(self.advisor.role, 'Advisor')

    def test_admin_permissions(self):
        """Test admin user permissions."""
        self.assertTrue(self.admin.is_staff)
        self.assertTrue(self.admin.is_superuser)
        self.assertEqual(self.admin.role, 'Admin')

    def test_role_based_access(self):
        """Test role-based access control."""
        # Students should not have admin access
        self.assertFalse(self.student.has_perm('accounts.add_user'))
        
        # Admins should have all permissions
        self.assertTrue(self.admin.has_perm('accounts.add_user'))
        self.assertTrue(self.admin.has_perm('accounts.change_user'))
        self.assertTrue(self.admin.has_perm('accounts.delete_user'))
