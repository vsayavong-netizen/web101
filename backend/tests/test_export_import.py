"""
Tests for Export/Import functionality
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from projects.models import Project
from projects.export_import import export_projects_to_csv, export_projects_to_excel, import_projects_from_csv
from io import BytesIO
import csv

User = get_user_model()


class ExportImportTestCase(TestCase):
    """Test export/import functionality"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='Admin'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test project
        self.project = Project.objects.create(
            project_id='TEST-001',
            title='Test Project',
            status='Pending'
        )
    
    def test_export_to_csv(self):
        """Test CSV export"""
        queryset = Project.objects.all()
        response = export_projects_to_csv(queryset)
        
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
        self.assertIn('.csv', response['Content-Disposition'])
    
    def test_export_to_excel(self):
        """Test Excel export"""
        queryset = Project.objects.all()
        try:
            response = export_projects_to_excel(queryset)
            self.assertEqual(
                response['Content-Type'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            self.assertIn('attachment', response['Content-Disposition'])
            self.assertIn('.xlsx', response['Content-Disposition'])
        except ImportError:
            self.skipTest("openpyxl not installed")
    
    def test_export_api_endpoint(self):
        """Test export API endpoint"""
        # Ensure user is authenticated and has admin role
        self.client.force_authenticate(user=self.user)
        
        # Verify user is admin
        self.assertTrue(self.user.is_admin() if hasattr(self.user, 'is_admin') else self.user.role == 'Admin')
        
        # Test CSV export - URL is /api/projects/export/ (function-based view)
        response = self.client.get('/api/projects/export/?format=csv')
        
        # Should return 200 even with empty data (just headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK, 
                        f"Expected 200, got {response.status_code}. Response: {response.data if hasattr(response, 'data') else response.content}")
        
        # Only check Content-Type if response is 200
        if response.status_code == 200:
            self.assertEqual(response['Content-Type'], 'text/csv')
        
        # Test Excel export
        response = self.client.get('/api/projects/export/?format=excel')
        if response.status_code == 200:
            self.assertIn('spreadsheetml', response['Content-Type'])
    
    def test_import_from_csv(self):
        """Test CSV import"""
        # Create CSV content
        csv_content = """Project ID,Topic (Lao),Topic (English),Advisor Name,Student IDs,Student Names,Status,Defense Date,Defense Time,Defense Room,Final Grade,Final Score,Created At,Updated At
IMPORT-001,Test Lao,Test English,Dr. Test,STU001,John Doe,Pending,,,,,,"""
        
        csv_file = BytesIO(csv_content.encode('utf-8'))
        csv_file.name = 'test_import.csv'
        
        success_count, error_count, errors = import_projects_from_csv(
            csv_file, academic_year='2024', user=self.user
        )
        
        self.assertGreater(success_count, 0)
        self.assertEqual(error_count, 0)
        
        # Verify project was created
        self.assertTrue(Project.objects.filter(project_id='IMPORT-001').exists())
    
    def test_import_api_endpoint(self):
        """Test import API endpoint"""
        # Create CSV file
        csv_content = """Project ID,Topic (Lao),Topic (English),Advisor Name,Student IDs,Student Names,Status,Defense Date,Defense Time,Defense Room,Final Grade,Final Score,Created At,Updated At
IMPORT-002,Test,Test Project,Dr. Test,STU002,Jane Doe,Pending,,,,,,"""
        
        csv_file = BytesIO(csv_content.encode('utf-8'))
        csv_file.name = 'test_import.csv'
        
        response = self.client.post(
            '/api/projects/import_data/',
            {
                'file': csv_file,
                'format': 'csv',
                'academic_year': '2024'
            },
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('success_count', response.data)
        self.assertIn('error_count', response.data)

