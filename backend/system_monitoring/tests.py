"""
Tests for system monitoring
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone

User = get_user_model()

# Import models after User is defined
try:
    from system_monitoring.models import (
        SystemMetrics, RequestLog, ErrorLog, HealthCheck, PerformanceMetric
    )
except ImportError:
    # Fallback if import fails
    SystemMetrics = None
    RequestLog = None
    ErrorLog = None
    HealthCheck = None
    PerformanceMetric = None


class SystemMonitoringModelTestCase(TestCase):
    """Test cases for monitoring models"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_system_metrics_creation(self):
        """Test SystemMetrics model"""
        metric = SystemMetrics.objects.create(
            metric_type='response_time',
            value=125.5,
            endpoint='/api/projects/',
            user=self.user
        )
        self.assertEqual(metric.metric_type, 'response_time')
        self.assertEqual(metric.value, 125.5)
        self.assertEqual(str(metric), f"response_time: 125.5 at {metric.timestamp}")
    
    def test_request_log_creation(self):
        """Test RequestLog model"""
        log = RequestLog.objects.create(
            method='GET',
            path='/api/projects/',
            status_code=200,
            response_time=125.5,
            user=self.user,
            ip_address='127.0.0.1'
        )
        self.assertEqual(log.method, 'GET')
        self.assertEqual(log.status_code, 200)
        self.assertIn('GET', str(log))
    
    def test_error_log_creation(self):
        """Test ErrorLog model"""
        error = ErrorLog.objects.create(
            level='ERROR',
            message='Test error message',
            exception_type='ValueError',
            path='/api/projects/',
            method='POST',
            user=self.user
        )
        self.assertEqual(error.level, 'ERROR')
        self.assertFalse(error.resolved)
        self.assertIn('ERROR', str(error))
    
    def test_health_check_creation(self):
        """Test HealthCheck model"""
        health = HealthCheck.objects.create(
            status='healthy',
            database_status=True,
            cache_status=True,
            redis_status=True,
            response_time=12.5
        )
        self.assertEqual(health.status, 'healthy')
        self.assertTrue(health.database_status)
        self.assertIn('healthy', str(health))


class SystemMonitoringAPITestCase(APITestCase):
    """Test cases for monitoring API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            is_staff=True,
            is_superuser=True
        )
        
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='userpass123',
            is_staff=False,
            is_superuser=False
        )
    
    def test_health_check_public(self):
        """Test health check endpoint (public)"""
        url = '/api/monitoring/health/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertIn('checks', response.data)
        self.assertIn('system', response.data)
    
    def test_system_metrics_admin(self):
        """Test system metrics endpoint (admin only)"""
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/monitoring/system-metrics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('metrics', response.data)
        self.assertIn('requests', response.data)
        self.assertIn('errors', response.data)
    
    def test_system_metrics_unauthorized(self):
        """Test system metrics endpoint (unauthorized)"""
        self.client.force_authenticate(user=self.regular_user)
        url = '/api/monitoring/system-metrics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_request_logs_list_admin(self):
        """Test request logs list (admin only)"""
        # Create a test request log
        RequestLog.objects.create(
            method='GET',
            path='/api/projects/',
            status_code=200,
            response_time=125.5,
            user=self.admin_user
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/monitoring/request-logs/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get('results', response.data)), 1)
    
    def test_error_logs_list_admin(self):
        """Test error logs list (admin only)"""
        # Create a test error log
        ErrorLog.objects.create(
            level='ERROR',
            message='Test error',
            exception_type='ValueError',
            user=self.admin_user
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/monitoring/error-logs/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data.get('results', response.data)), 1)
    
    def test_mark_error_as_resolved(self):
        """Test marking error as resolved"""
        error = ErrorLog.objects.create(
            level='ERROR',
            message='Test error',
            exception_type='ValueError',
            user=self.admin_user
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = f'/api/monitoring/error-logs/{error.id}/'
        data = {'resolved': True}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        error.refresh_from_db()
        self.assertTrue(error.resolved)
