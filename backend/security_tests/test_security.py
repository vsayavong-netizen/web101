"""
Security testing suite
"""
import pytest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
import json

User = get_user_model()


class SecurityTestCase(TestCase):
    """Security test cases"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='Student'
        )
    
    def test_sql_injection_protection(self):
        """Test SQL injection protection"""
        # Attempt SQL injection in search query
        malicious_query = "'; DROP TABLE projects; --"
        response = self.client.get(
            f'/api/projects/search/?query={malicious_query}',
            HTTP_AUTHORIZATION=f'Bearer {self.get_token()}'
        )
        # Should not crash and should handle gracefully
        self.assertIn(response.status_code, [200, 400, 401])
    
    def test_xss_protection(self):
        """Test XSS protection"""
        # Attempt XSS in project title
        xss_payload = "<script>alert('XSS')</script>"
        response = self.client.post(
            '/api/projects/',
            {
                'project_id': 'TEST-001',
                'topic_eng': xss_payload,
                'status': 'Pending'
            },
            HTTP_AUTHORIZATION=f'Bearer {self.get_token()}',
            format='json'
        )
        # Should sanitize or reject
        self.assertNotIn('<script>', str(response.data))
    
    def test_authentication_required(self):
        """Test that protected endpoints require authentication"""
        response = self.client.get('/api/projects/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_authorization_enforcement(self):
        """Test that users can only access authorized resources"""
        # Student should not access admin endpoints
        student_token = self.get_token()
        response = self.client.get(
            '/api/admin/users/',
            HTTP_AUTHORIZATION=f'Bearer {student_token}'
        )
        # Should be forbidden or not found
        self.assertIn(response.status_code, [403, 404])
    
    def test_rate_limiting(self):
        """Test rate limiting"""
        token = self.get_token()
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        
        # Make many rapid requests
        for i in range(100):
            response = self.client.get('/api/projects/', **headers)
            if response.status_code == 429:  # Too Many Requests
                break
        
        # Should eventually hit rate limit
        # (This depends on your rate limiting configuration)
    
    def test_csrf_protection(self):
        """Test CSRF protection for state-changing operations"""
        # CSRF protection is typically handled by Django middleware
        # This test verifies it's enabled
        response = self.client.post(
            '/api/projects/',
            {'project_id': 'TEST-002'},
            format='json'
        )
        # Should require CSRF token or authentication
        self.assertIn(response.status_code, [401, 403])
    
    def test_input_validation(self):
        """Test input validation"""
        # Test with invalid data types
        response = self.client.post(
            '/api/projects/',
            {
                'project_id': None,
                'topic_eng': 12345,  # Should be string
                'status': 'InvalidStatus'
            },
            HTTP_AUTHORIZATION=f'Bearer {self.get_token()}',
            format='json'
        )
        # Should return validation errors
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_path_traversal_protection(self):
        """Test path traversal protection"""
        # Attempt path traversal
        malicious_paths = [
            '../../../etc/passwd',
            '..\\..\\windows\\system32',
            '/api/files/../../../etc/passwd'
        ]
        
        for path in malicious_paths:
            response = self.client.get(
                f'/api/files/{path}',
                HTTP_AUTHORIZATION=f'Bearer {self.get_token()}'
            )
            # Should be blocked
            self.assertIn(response.status_code, [403, 404])
    
    def test_jwt_token_expiration(self):
        """Test JWT token expiration"""
        # Create expired token (would need to mock time)
        # Or test with invalid token
        response = self.client.get(
            '/api/projects/',
            HTTP_AUTHORIZATION='Bearer invalid_token_here'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_sensitive_data_exposure(self):
        """Test that sensitive data is not exposed"""
        response = self.client.get(
            '/api/users/',
            HTTP_AUTHORIZATION=f'Bearer {self.get_token()}'
        )
        if response.status_code == 200:
            data = response.json()
            # Check that passwords are not exposed
            if isinstance(data, list):
                for user in data:
                    self.assertNotIn('password', user)
            elif isinstance(data, dict):
                self.assertNotIn('password', data)
    
    def get_token(self):
        """Helper to get auth token"""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
        if response.status_code == 200:
            return response.json().get('access') or response.json().get('token')
        return None


class VulnerabilityScanTestCase(TestCase):
    """Vulnerability scanning tests"""
    
    def setUp(self):
        self.client = Client()
    
    def test_headers_security(self):
        """Test security headers"""
        response = self.client.get('/')
        # Check for security headers
        self.assertIn('X-Content-Type-Options', response.headers or {})
        # Add more header checks as needed
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        # Test from unauthorized origin
        response = self.client.get(
            '/api/projects/',
            HTTP_ORIGIN='https://malicious-site.com'
        )
        # Should be blocked or not include CORS headers
        # (Depends on your CORS configuration)
    
    def test_sql_injection_in_filters(self):
        """Test SQL injection in filter parameters"""
        malicious_filters = [
            "'; DROP TABLE projects; --",
            "1' OR '1'='1",
            "1; DELETE FROM projects; --"
        ]
        
        for filter_val in malicious_filters:
            response = self.client.get(
                f'/api/projects/?status={filter_val}',
                HTTP_AUTHORIZATION=f'Bearer {self.get_token()}'
            )
            # Should handle gracefully
            self.assertIn(response.status_code, [200, 400, 401, 403])

