"""
Tests for settings app, especially Academic Year API
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import date, datetime
from settings.models import AcademicYear, SystemSettings

User = get_user_model()


class AcademicYearModelTestCase(TestCase):
    """Test cases for AcademicYear model"""
    
    def setUp(self):
        """Set up test data"""
        self.academic_year = AcademicYear.objects.create(
            year='2024',
            start_date=date(2024, 8, 1),
            end_date=date(2025, 7, 31),
            is_active=True,
            description='Test Academic Year 2024-2025'
        )
    
    def test_academic_year_creation(self):
        """Test academic year creation"""
        self.assertEqual(self.academic_year.year, '2024')
        self.assertEqual(self.academic_year.start_date, date(2024, 8, 1))
        self.assertEqual(self.academic_year.end_date, date(2025, 7, 31))
        self.assertTrue(self.academic_year.is_active)
        self.assertEqual(str(self.academic_year), '2024')
    
    def test_academic_year_unique(self):
        """Test that academic year must be unique"""
        with self.assertRaises(Exception):
            AcademicYear.objects.create(
                year='2024',
                start_date=date(2024, 8, 1),
                end_date=date(2025, 7, 31)
            )
    
    def test_academic_year_ordering(self):
        """Test academic year ordering"""
        AcademicYear.objects.create(
            year='2023',
            start_date=date(2023, 8, 1),
            end_date=date(2024, 7, 31),
            is_active=False
        )
        
        years = AcademicYear.objects.all()
        self.assertEqual(years[0].year, '2024')  # Latest first
        self.assertEqual(years[1].year, '2023')


class AcademicYearAPITestCase(APITestCase):
    """Test cases for Academic Year API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        # Create users
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
        
        # Create academic years
        self.year_2024 = AcademicYear.objects.create(
            year='2024',
            start_date=date(2024, 8, 1),
            end_date=date(2025, 7, 31),
            is_active=True,
            description='Academic Year 2024-2025'
        )
        
        self.year_2023 = AcademicYear.objects.create(
            year='2023',
            start_date=date(2023, 8, 1),
            end_date=date(2024, 7, 31),
            is_active=False,
            description='Academic Year 2023-2024'
        )
    
    def test_list_academic_years_authenticated(self):
        """Test listing academic years as authenticated user"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('academic-year-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Regular users should only see active years
        # Handle pagination if present
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        active_years = [year for year in data if year.get('is_active', False)]
        self.assertGreaterEqual(len(active_years), 1)
        # Check that 2024 is in the list
        years_list = [year['year'] for year in data]
        self.assertIn('2024', years_list)
    
    def test_list_academic_years_admin(self):
        """Test listing academic years as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('academic-year-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Admin should see all years (handle pagination)
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        # Admin should see at least the 2 years we created in setUp
        self.assertGreaterEqual(len(data), 2)
        # Check that both 2024 and 2023 are in the list
        years_list = [year['year'] for year in data]
        self.assertIn('2024', years_list)
        self.assertIn('2023', years_list)
    
    def test_get_current_academic_year(self):
        """Test getting current active academic year"""
        self.client.force_authenticate(user=self.regular_user)
        url = '/api/settings/academic-years/current/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['year'], '2024')
        self.assertTrue(response.data['is_active'])
    
    def test_get_available_academic_years(self):
        """Test getting available academic years"""
        self.client.force_authenticate(user=self.regular_user)
        url = '/api/settings/academic-years/available/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        # Regular users see only active years
        self.assertEqual(len(response.data), 1)
    
    def test_create_academic_year_admin(self):
        """Test creating academic year as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('academic-year-list')
        data = {
            'year': '2025',
            'start_date': '2025-08-01',
            'end_date': '2026-07-31',
            'is_active': False,
            'description': 'Academic Year 2025-2026'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['year'], '2025')
        self.assertEqual(AcademicYear.objects.count(), 3)
    
    def test_create_academic_year_unauthorized(self):
        """Test creating academic year as regular user (should fail)"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('academic-year-list')
        data = {
            'year': '2025',
            'start_date': '2025-08-01',
            'end_date': '2026-07-31'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_activate_academic_year(self):
        """Test activating an academic year"""
        self.client.force_authenticate(user=self.admin_user)
        url = f'/api/settings/academic-years/{self.year_2023.id}/activate/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that 2023 is now active
        self.year_2023.refresh_from_db()
        self.assertTrue(self.year_2023.is_active)
        
        # Check that 2024 is now inactive
        self.year_2024.refresh_from_db()
        self.assertFalse(self.year_2024.is_active)
    
    def test_activate_academic_year_unauthorized(self):
        """Test activating academic year as regular user (should fail)"""
        self.client.force_authenticate(user=self.regular_user)
        url = f'/api/settings/academic-years/{self.year_2023.id}/activate/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_next_year(self):
        """Test creating next academic year"""
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/settings/academic-years/create_next_year/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('2025', response.data['data']['year'])
        
        # Check that new year was created
        new_year = AcademicYear.objects.filter(year__startswith='2025').first()
        self.assertIsNotNone(new_year)
    
    def test_create_next_year_unauthorized(self):
        """Test creating next year as regular user (should fail)"""
        self.client.force_authenticate(user=self.regular_user)
        url = '/api/settings/academic-years/create_next_year/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_update_academic_year_admin(self):
        """Test updating academic year as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('academic-year-detail', kwargs={'pk': self.year_2024.id})
        data = {
            'year': '2024',
            'start_date': '2024-08-01',
            'end_date': '2025-07-31',
            'description': 'Updated description'
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Updated description')
    
    def test_delete_academic_year_admin(self):
        """Test deleting academic year as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('academic-year-detail', kwargs={'pk': self.year_2023.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(AcademicYear.objects.count(), 1)
    
    def test_delete_academic_year_unauthorized(self):
        """Test deleting academic year as regular user (should fail)"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('academic-year-detail', kwargs={'pk': self.year_2023.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_serializer_validation(self):
        """Test serializer validation"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('academic-year-list')
        
        # Test invalid year format
        data = {
            'year': 'invalid',
            'start_date': '2024-08-01',
            'end_date': '2025-07-31'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test end_date before start_date
        data = {
            'year': '2025',
            'start_date': '2025-08-01',
            'end_date': '2024-07-31'  # Invalid: end before start
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access"""
        url = reverse('academic-year-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SystemSettingsModelTestCase(TestCase):
    """Test cases for SystemSettings model"""
    
    def setUp(self):
        """Set up test data"""
        self.setting = SystemSettings.objects.create(
            setting_name='test_setting',
            setting_value='test_value',
            setting_type='string',
            description='Test setting'
        )
    
    def test_system_settings_creation(self):
        """Test system settings creation"""
        self.assertEqual(self.setting.setting_name, 'test_setting')
        self.assertEqual(self.setting.setting_value, 'test_value')
        self.assertEqual(str(self.setting), 'test_setting')


class AppSettingsAPITestCase(APITestCase):
    """Test cases for App Settings API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        import json
        
        # Create users
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
        
        # Create academic year
        self.academic_year = AcademicYear.objects.create(
            year='2024',
            start_date=date(2024, 8, 1),
            end_date=date(2025, 7, 31),
            is_active=True,
            description='Academic Year 2024-2025'
        )
        
        # Test data
        self.test_milestone_templates = [
            {
                'id': 'TPL01',
                'name': 'Standard 5-Chapter Final Project',
                'description': 'A standard template',
                'tasks': [
                    {'id': 'TSK01', 'name': 'Chapter 1', 'durationDays': 30}
                ]
            }
        ]
        
        self.test_announcements = [
            {
                'id': 'ANN01',
                'title': 'Welcome',
                'content': 'Welcome to the new year',
                'audience': 'All',
                'authorName': 'Admin'
            }
        ]
        
        self.test_defense_settings = {
            'startDefenseDate': '2024-12-01',
            'timeSlots': '09:00-10:00,10:15-11:15',
            'rooms': ['Room A', 'Room B'],
            'stationaryAdvisors': {},
            'timezone': 'Asia/Bangkok'
        }
        
        self.test_scoring_settings = {
            'mainAdvisorWeight': 60,
            'committeeWeight': 40,
            'gradeBoundaries': [],
            'advisorRubrics': [],
            'committeeRubrics': []
        }
    
    def test_get_setting_not_exists(self):
        """Test getting setting that doesn't exist"""
        self.client.force_authenticate(user=self.regular_user)
        url = '/api/settings/app-settings/milestone_templates/2024/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['value'])
        self.assertIsNone(response.data['updated_at'])
    
    def test_create_setting_admin(self):
        """Test creating setting as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/settings/app-settings/milestone_templates/2024/'
        data = {'value': self.test_milestone_templates}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['setting_type'], 'milestone_templates')
        self.assertEqual(response.data['academic_year'], '2024')
        self.assertTrue(response.data['created'])
        
        # Verify in database
        setting = SystemSettings.objects.get(setting_name='milestone_templates_2024')
        self.assertIsNotNone(setting)
        import json
        value = json.loads(setting.setting_value)
        self.assertEqual(len(value), 1)
        self.assertEqual(value[0]['id'], 'TPL01')
    
    def test_create_setting_unauthorized(self):
        """Test creating setting as regular user (should fail)"""
        self.client.force_authenticate(user=self.regular_user)
        url = '/api/settings/app-settings/milestone_templates/2024/'
        data = {'value': self.test_milestone_templates}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_setting_after_create(self):
        """Test getting setting after creation"""
        # Create setting first
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/settings/app-settings/milestone_templates/2024/'
        data = {'value': self.test_milestone_templates}
        self.client.post(url, data, format='json')
        
        # Get setting
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data['value'])
        self.assertEqual(len(response.data['value']), 1)
        self.assertEqual(response.data['value'][0]['id'], 'TPL01')
    
    def test_update_setting(self):
        """Test updating setting"""
        # Create setting first
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/settings/app-settings/milestone_templates/2024/'
        data = {'value': self.test_milestone_templates}
        self.client.post(url, data, format='json')
        
        # Update setting
        updated_value = self.test_milestone_templates.copy()
        updated_value[0]['name'] = 'Updated Template Name'
        data = {'value': updated_value}
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['value'][0]['name'], 'Updated Template Name')
    
    def test_delete_setting(self):
        """Test deleting setting"""
        # Create setting first
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/settings/app-settings/milestone_templates/2024/'
        data = {'value': self.test_milestone_templates}
        self.client.post(url, data, format='json')
        
        # Delete setting
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify setting is marked as inactive
        setting = SystemSettings.objects.get(setting_name='milestone_templates_2024')
        self.assertFalse(setting.is_active)
    
    def test_invalid_setting_type(self):
        """Test with invalid setting type"""
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/settings/app-settings/invalid_type/2024/'
        data = {'value': {}}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid setting type', str(response.data))
    
    def test_all_setting_types(self):
        """Test all supported setting types"""
        self.client.force_authenticate(user=self.admin_user)
        
        test_cases = [
            ('milestone_templates', self.test_milestone_templates),
            ('announcements', self.test_announcements),
            ('defense_settings', self.test_defense_settings),
            ('scoring_settings', self.test_scoring_settings),
        ]
        
        for setting_type, test_value in test_cases:
            url = f'/api/settings/app-settings/{setting_type}/2024/'
            data = {'value': test_value}
            
            # Create
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, 
                           f"Failed to create {setting_type}")
            
            # Get
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK,
                           f"Failed to get {setting_type}")
            self.assertIsNotNone(response.data['value'],
                               f"Value is None for {setting_type}")
    
    def test_setting_without_academic_year(self):
        """Test setting endpoint without academic year (should use current active year)"""
        self.client.force_authenticate(user=self.admin_user)
        url = '/api/settings/app-settings/milestone_templates/'
        data = {'value': self.test_milestone_templates}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['academic_year'], '2024')  # Should use active year
    
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access"""
        url = '/api/settings/app-settings/milestone_templates/2024/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

