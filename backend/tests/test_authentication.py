"""
Authentication tests for the Final Project Management System
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from ..models import User
from ..authentication.serializers import CustomTokenObtainPairSerializer

User = get_user_model()


class AuthenticationTestCase(APITestCase):
    """
    Test cases for authentication functionality
    """
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='student',
            academic_year='2024'
        )
        
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            academic_year='2024'
        )
    
    def test_user_registration(self):
        """Test user registration"""
        url = reverse('authentication:user_register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'student',
            'academic_year': '2024'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_user_registration_password_mismatch(self):
        """Test user registration with password mismatch"""
        url = reverse('authentication:user_register')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'differentpass',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'student',
            'academic_year': '2024'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Passwords don\'t match', str(response.data))
    
    def test_user_login_success(self):
        """Test successful user login"""
        url = reverse('authentication:token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_user_login_failure(self):
        """Test failed user login"""
        url = reverse('authentication:token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_token_refresh(self):
        """Test token refresh"""
        refresh = RefreshToken.for_user(self.user)
        url = reverse('authentication:token_refresh')
        data = {'refresh': str(refresh)}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
    
    def test_user_logout(self):
        """Test user logout"""
        refresh = RefreshToken.for_user(self.user)
        url = reverse('authentication:logout')
        data = {'refresh': str(refresh)}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_user_profile_view(self):
        """Test user profile view"""
        self.client.force_authenticate(user=self.user)
        url = reverse('authentication:user_profile')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
    
    def test_user_profile_update(self):
        """Test user profile update"""
        self.client.force_authenticate(user=self.user)
        url = reverse('authentication:user_profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
    
    def test_change_password(self):
        """Test password change"""
        self.client.force_authenticate(user=self.user)
        url = reverse('authentication:change_password')
        data = {
            'old_password': 'testpass123',
            'new_password': 'newpass123',
            'new_password_confirm': 'newpass123'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test login with new password
        self.client.logout()
        login_url = reverse('authentication:token_obtain_pair')
        login_data = {
            'username': 'testuser',
            'password': 'newpass123'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
    
    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password"""
        self.client.force_authenticate(user=self.user)
        url = reverse('authentication:change_password')
        data = {
            'old_password': 'wrongpassword',
            'new_password': 'newpass123',
            'new_password_confirm': 'newpass123'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_force_password_change(self):
        """Test forcing password change for user"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('authentication:force_password_change')
        data = {'user_id': self.user.id}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.user.refresh_from_db()
        self.assertTrue(self.user.must_change_password)
    
    def test_switch_academic_year(self):
        """Test switching academic year"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('authentication:switch_academic_year')
        data = {'academic_year': '2025'}
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.admin_user.refresh_from_db()
        self.assertEqual(self.admin_user.academic_year, '2025')
    
    def test_user_info(self):
        """Test user info endpoint"""
        self.client.force_authenticate(user=self.user)
        url = reverse('authentication:user_info')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('permissions', response.data)


class CustomTokenObtainPairSerializerTestCase(TestCase):
    """
    Test cases for custom JWT serializer
    """
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='student',
            academic_year='2024'
        )
    
    def test_serializer_validation_success(self):
        """Test serializer validation with valid data"""
        serializer = CustomTokenObtainPairSerializer(data={
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['user'], self.user)
    
    def test_serializer_validation_failure(self):
        """Test serializer validation with invalid data"""
        serializer = CustomTokenObtainPairSerializer(data={
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('Invalid credentials', str(serializer.errors))
    
    def test_serializer_validation_inactive_user(self):
        """Test serializer validation with inactive user"""
        self.user.is_active = False
        self.user.save()
        
        serializer = CustomTokenObtainPairSerializer(data={
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('User account is disabled', str(serializer.errors))
    
    def test_serializer_validation_must_change_password(self):
        """Test serializer validation with user who must change password"""
        self.user.must_change_password = True
        self.user.save()
        
        serializer = CustomTokenObtainPairSerializer(data={
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('Password change required', str(serializer.errors))
    
    def test_get_token(self):
        """Test token generation with custom claims"""
        token = CustomTokenObtainPairSerializer.get_token(self.user)
        
        self.assertIn('user_id', token)
        self.assertIn('role', token)
        self.assertIn('academic_year', token)
        self.assertIn('username', token)
        self.assertIn('email', token)
        
        self.assertEqual(token['user_id'], self.user.id)
        self.assertEqual(token['role'], self.user.role)
        self.assertEqual(token['academic_year'], self.user.academic_year)
        self.assertEqual(token['username'], self.user.username)
        self.assertEqual(token['email'], self.user.email)


class UserModelTestCase(TestCase):
    """
    Test cases for User model
    """
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='student',
            academic_year='2024'
        )
    
    def test_user_creation(self):
        """Test user creation"""
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.role, 'student')
        self.assertEqual(self.user.academic_year, '2024')
        self.assertTrue(self.user.check_password('testpass123'))
    
    def test_user_role_methods(self):
        """Test user role methods"""
        self.assertTrue(self.user.is_student())
        self.assertFalse(self.user.is_admin())
        self.assertFalse(self.user.is_advisor())
        self.assertFalse(self.user.is_department_admin())
    
    def test_user_academic_year_access(self):
        """Test user academic year access"""
        self.assertTrue(self.user.can_access_academic_year('2024'))
        self.assertFalse(self.user.can_access_academic_year('2025'))
    
    def test_user_string_representation(self):
        """Test user string representation"""
        expected = f"{self.user.username} ({self.user.get_role_display()})"
        self.assertEqual(str(self.user), expected)
    
    def test_user_full_name(self):
        """Test user full name"""
        self.user.first_name = 'John'
        self.user.last_name = 'Doe'
        self.user.save()
        
        self.assertEqual(self.user.get_full_name(), 'John Doe')
    
    def test_user_full_name_fallback(self):
        """Test user full name fallback to username"""
        self.assertEqual(self.user.get_full_name(), 'testuser')
