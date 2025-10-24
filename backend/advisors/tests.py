"""
Tests for advisors app.
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date, timedelta
import json

from accounts.models import User
from advisors.models import Advisor, AdvisorSpecialization, AdvisorWorkload, AdvisorPerformance, AdvisorAvailability, AdvisorNote

User = get_user_model()


class AdvisorModelTest(TestCase):
    """Test cases for Advisor model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='testpass123',
            role='Advisor'
        )

    def test_create_advisor(self):
        """Test advisor creation."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10,
            is_available=True
        )
        self.assertEqual(advisor.user, self.user)
        self.assertEqual(advisor.employee_id, 'ADV001')
        self.assertEqual(advisor.department, 'Computer Science')
        self.assertEqual(advisor.specialization, 'Software Engineering')
        self.assertEqual(advisor.max_students, 10)
        self.assertTrue(advisor.is_available)

    def test_advisor_str_representation(self):
        """Test advisor string representation."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        expected = f"{self.user.get_full_name()} ({advisor.employee_id})"
        self.assertEqual(str(advisor), expected)

    def test_advisor_specialization(self):
        """Test advisor specialization creation."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        specialization = AdvisorSpecialization.objects.create(
            advisor=advisor,
            specialization='Machine Learning',
            proficiency_level='Expert',
            years_experience=5
        )
        self.assertEqual(specialization.advisor, advisor)
        self.assertEqual(specialization.specialization, 'Machine Learning')
        self.assertEqual(specialization.proficiency_level, 'Expert')

    def test_advisor_workload(self):
        """Test advisor workload creation."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        workload = AdvisorWorkload.objects.create(
            advisor=advisor,
            academic_year='2024-2025',
            semester='Fall',
            current_students=5,
            max_capacity=10,
            workload_percentage=50.0
        )
        self.assertEqual(workload.advisor, advisor)
        self.assertEqual(workload.academic_year, '2024-2025')
        self.assertEqual(workload.current_students, 5)
        self.assertEqual(workload.workload_percentage, 50.0)

    def test_advisor_performance(self):
        """Test advisor performance creation."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        performance = AdvisorPerformance.objects.create(
            advisor=advisor,
            academic_year='2024-2025',
            student_satisfaction_score=4.5,
            project_completion_rate=95.0,
            average_project_grade=3.8,
            total_projects_supervised=10
        )
        self.assertEqual(performance.advisor, advisor)
        self.assertEqual(performance.academic_year, '2024-2025')
        self.assertEqual(performance.student_satisfaction_score, 4.5)
        self.assertEqual(performance.project_completion_rate, 95.0)

    def test_advisor_availability(self):
        """Test advisor availability creation."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        availability = AdvisorAvailability.objects.create(
            advisor=advisor,
            day_of_week='Monday',
            start_time='09:00:00',
            end_time='17:00:00',
            is_available=True
        )
        self.assertEqual(availability.advisor, advisor)
        self.assertEqual(availability.day_of_week, 'Monday')
        self.assertEqual(availability.start_time, '09:00:00')
        self.assertEqual(availability.end_time, '17:00:00')
        self.assertTrue(availability.is_available)

    def test_advisor_note(self):
        """Test advisor note creation."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        note = AdvisorNote.objects.create(
            advisor=advisor,
            note_type='Performance',
            title='Quarterly Review',
            content='Excellent performance in student supervision',
            is_private=False,
            created_by='admin@example.com'
        )
        self.assertEqual(note.advisor, advisor)
        self.assertEqual(note.note_type, 'Performance')
        self.assertEqual(note.title, 'Quarterly Review')


class AdvisorAPITest(APITestCase):
    """Test cases for Advisor API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='testpass123',
            role='Advisor'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        self.advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10
        )

    def test_advisor_list_requires_auth(self):
        """Test that advisor list requires authentication."""
        url = reverse('advisor-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_advisor_list_authenticated(self):
        """Test advisor list with authentication."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_advisor_detail(self):
        """Test advisor detail retrieval."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-detail', kwargs={'pk': self.advisor.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['employee_id'], 'ADV001')

    def test_advisor_create(self):
        """Test advisor creation."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-list')
        data = {
            'user': self.user.pk,
            'employee_id': 'ADV002',
            'department': 'Information Technology',
            'specialization': 'Database Systems',
            'max_students': 8
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Advisor.objects.filter(employee_id='ADV002').exists())

    def test_advisor_update(self):
        """Test advisor update."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-detail', kwargs={'pk': self.advisor.pk})
        data = {'max_students': 15}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.advisor.refresh_from_db()
        self.assertEqual(self.advisor.max_students, 15)

    def test_advisor_delete(self):
        """Test advisor deletion."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-detail', kwargs={'pk': self.advisor.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Advisor.objects.filter(pk=self.advisor.pk).exists())

    def test_advisor_specializations(self):
        """Test advisor specializations endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-specializations', kwargs={'pk': self.advisor.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_advisor_workload(self):
        """Test advisor workload endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-workload', kwargs={'pk': self.advisor.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_advisor_performance(self):
        """Test advisor performance endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-performance', kwargs={'pk': self.advisor.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_advisor_availability(self):
        """Test advisor availability endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-availability', kwargs={'pk': self.advisor.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_advisor_notes(self):
        """Test advisor notes endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('advisor-notes', kwargs={'pk': self.advisor.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AdvisorIntegrationTest(TestCase):
    """Integration tests for advisor functionality."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='testpass123',
            role='Advisor'
        )

    def test_advisor_complete_profile(self):
        """Test complete advisor profile setup."""
        # Create advisor
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10,
            is_available=True
        )
        
        # Add specializations
        specializations = [
            ('Software Engineering', 'Expert', 10),
            ('Machine Learning', 'Advanced', 5),
            ('Database Systems', 'Intermediate', 3)
        ]
        
        for specialization, level, years in specializations:
            AdvisorSpecialization.objects.create(
                advisor=advisor,
                specialization=specialization,
                proficiency_level=level,
                years_experience=years
            )
        
        # Add workload
        AdvisorWorkload.objects.create(
            advisor=advisor,
            academic_year='2024-2025',
            semester='Fall',
            current_students=5,
            max_capacity=10,
            workload_percentage=50.0
        )
        
        # Add performance
        AdvisorPerformance.objects.create(
            advisor=advisor,
            academic_year='2024-2025',
            student_satisfaction_score=4.5,
            project_completion_rate=95.0,
            average_project_grade=3.8,
            total_projects_supervised=10
        )
        
        # Add availability
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        for day in days:
            AdvisorAvailability.objects.create(
                advisor=advisor,
                day_of_week=day,
                start_time='09:00:00',
                end_time='17:00:00',
                is_available=True
            )
        
        # Add notes
        AdvisorNote.objects.create(
            advisor=advisor,
            note_type='Performance',
            title='Quarterly Review',
            content='Excellent performance in student supervision',
            is_private=False,
            created_by='admin@example.com'
        )
        
        # Verify all relationships
        self.assertEqual(advisor.specializations.count(), 3)
        self.assertEqual(advisor.workloads.count(), 1)
        self.assertEqual(advisor.performance_records.count(), 1)
        self.assertEqual(advisor.availability.count(), 5)
        self.assertEqual(advisor.notes.count(), 1)

    def test_advisor_workload_calculation(self):
        """Test advisor workload calculation."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10
        )
        
        # Add workload records
        AdvisorWorkload.objects.create(
            advisor=advisor,
            academic_year='2024-2025',
            semester='Fall',
            current_students=5,
            max_capacity=10,
            workload_percentage=50.0
        )
        
        AdvisorWorkload.objects.create(
            advisor=advisor,
            academic_year='2024-2025',
            semester='Spring',
            current_students=8,
            max_capacity=10,
            workload_percentage=80.0
        )
        
        # Calculate average workload
        workloads = advisor.workloads.all()
        avg_workload = sum(w.workload_percentage for w in workloads) / len(workloads)
        self.assertEqual(avg_workload, 65.0)

    def test_advisor_performance_tracking(self):
        """Test advisor performance tracking."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        
        # Add performance records for multiple years
        performance_data = [
            ('2022-2023', 4.2, 90.0, 3.6, 8),
            ('2023-2024', 4.5, 95.0, 3.8, 10),
            ('2024-2025', 4.7, 98.0, 3.9, 12)
        ]
        
        for year, satisfaction, completion, grade, projects in performance_data:
            AdvisorPerformance.objects.create(
                advisor=advisor,
                academic_year=year,
                student_satisfaction_score=satisfaction,
                project_completion_rate=completion,
                average_project_grade=grade,
                total_projects_supervised=projects
            )
        
        # Verify performance tracking
        self.assertEqual(advisor.performance_records.count(), 3)
        latest_performance = advisor.performance_records.latest('academic_year')
        self.assertEqual(latest_performance.student_satisfaction_score, 4.7)

    def test_advisor_availability_schedule(self):
        """Test advisor availability schedule."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        
        # Add availability for different days
        availability_data = [
            ('Monday', '09:00:00', '17:00:00', True),
            ('Tuesday', '09:00:00', '17:00:00', True),
            ('Wednesday', '10:00:00', '16:00:00', True),
            ('Thursday', '09:00:00', '17:00:00', True),
            ('Friday', '09:00:00', '15:00:00', True),
            ('Saturday', '10:00:00', '14:00:00', False),
            ('Sunday', '10:00:00', '14:00:00', False)
        ]
        
        for day, start, end, available in availability_data:
            AdvisorAvailability.objects.create(
                advisor=advisor,
                day_of_week=day,
                start_time=start,
                end_time=end,
                is_available=available
            )
        
        # Verify availability
        self.assertEqual(advisor.availability.count(), 7)
        available_days = advisor.availability.filter(is_available=True)
        self.assertEqual(available_days.count(), 5)
        unavailable_days = advisor.availability.filter(is_available=False)
        self.assertEqual(unavailable_days.count(), 2)


class AdvisorModelValidationTest(TestCase):
    """Test cases for advisor model validation."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='testpass123',
            role='Advisor'
        )

    def test_employee_id_required(self):
        """Test that employee_id is required."""
        with self.assertRaises(Exception):
            Advisor.objects.create(
                user=self.user,
                department='Computer Science',
                specialization='Software Engineering'
            )

    def test_department_required(self):
        """Test that department is required."""
        with self.assertRaises(Exception):
            Advisor.objects.create(
                user=self.user,
                employee_id='ADV001',
                specialization='Software Engineering'
            )

    def test_specialization_required(self):
        """Test that specialization is required."""
        with self.assertRaises(Exception):
            Advisor.objects.create(
                user=self.user,
                employee_id='ADV001',
                department='Computer Science'
            )

    def test_unique_employee_id(self):
        """Test that employee_id must be unique."""
        Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        with self.assertRaises(Exception):
            Advisor.objects.create(
                user=self.user,
                employee_id='ADV001',
                department='Information Technology',
                specialization='Database Systems'
            )

    def test_max_students_validation(self):
        """Test max_students validation."""
        # Valid max_students
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10
        )
        self.assertEqual(advisor.max_students, 10)
        
        # Test edge cases
        advisor.max_students = 0
        advisor.save()
        self.assertEqual(advisor.max_students, 0)
        
        advisor.max_students = 50
        advisor.save()
        self.assertEqual(advisor.max_students, 50)

    def test_workload_percentage_validation(self):
        """Test workload percentage validation."""
        advisor = Advisor.objects.create(
            user=self.user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        
        # Valid workload percentage
        workload = AdvisorWorkload.objects.create(
            advisor=advisor,
            academic_year='2024-2025',
            semester='Fall',
            current_students=5,
            max_capacity=10,
            workload_percentage=50.0
        )
        self.assertEqual(workload.workload_percentage, 50.0)
        
        # Test edge cases
        workload.workload_percentage = 0.0
        workload.save()
        self.assertEqual(workload.workload_percentage, 0.0)
        
        workload.workload_percentage = 100.0
        workload.save()
        self.assertEqual(workload.workload_percentage, 100.0)


class AdvisorPermissionsTest(TestCase):
    """Test cases for advisor permissions."""

    def setUp(self):
        """Set up test data."""
        self.advisor_user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='testpass123',
            role='Advisor'
        )
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )

    def test_advisor_can_view_own_profile(self):
        """Test that advisors can view their own profile."""
        advisor = Advisor.objects.create(
            user=self.advisor_user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        # This would be tested in the API layer
        self.assertEqual(advisor.user, self.advisor_user)

    def test_admin_can_manage_all_advisors(self):
        """Test that admins can manage all advisors."""
        advisor = Advisor.objects.create(
            user=self.advisor_user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering'
        )
        # This would be tested in the API layer
        self.assertEqual(advisor.user, self.advisor_user)

    def test_advisor_role_permissions(self):
        """Test advisor role permissions."""
        self.assertEqual(self.advisor_user.role, 'Advisor')
        self.assertFalse(self.advisor_user.is_staff)
        self.assertFalse(self.advisor_user.is_superuser)

    def test_admin_role_permissions(self):
        """Test admin role permissions."""
        self.assertTrue(self.admin_user.is_staff)
        self.assertTrue(self.admin_user.is_superuser)
