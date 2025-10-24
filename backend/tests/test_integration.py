"""
Integration tests for the Final Project Management System
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from ..models import User, Student, Advisor, Project, ProjectGroup
from ..models.majors import Major
from ..models.classrooms import Classroom

User = get_user_model()


class SystemIntegrationTestCase(APITestCase):
    """
    Test cases for system integration
    """
    
    def setUp(self):
        """Set up test data"""
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            academic_year='2024'
        )
        
        # Create advisor user
        self.advisor_user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='advisorpass123',
            role='advisor',
            academic_year='2024'
        )
        
        # Create student user
        self.student_user = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='studentpass123',
            role='student',
            academic_year='2024'
        )
        
        # Create major and classroom
        self.major = Major.objects.create(
            name='Business Administration',
            abbreviation='BA',
            academic_year='2024'
        )
        
        self.classroom = Classroom.objects.create(
            name='BA-4A',
            major=self.major,
            major_name='Business Administration',
            academic_year='2024'
        )
        
        # Create advisor
        self.advisor = Advisor.objects.create(
            user=self.advisor_user,
            name='Dr. John Advisor',
            academic_year='2024'
        )
        
        # Create student
        self.student = Student.objects.create(
            user=self.student_user,
            student_id='155N1000/24',
            name='John',
            surname='Student',
            major=self.major,
            classroom=self.classroom,
            academic_year='2024'
        )
    
    def test_complete_project_lifecycle(self):
        """Test complete project lifecycle from creation to completion"""
        # 1. Admin creates a project
        self.client.force_authenticate(user=self.admin_user)
        project_url = reverse('projects:projects-list')
        project_data = {
            'topic_lao': 'ໂຄງການທົດສອບ',
            'topic_eng': 'Test Project',
            'advisor_name': 'Dr. John Advisor',
            'advisor': self.advisor.id,
            'comment': 'Test comment',
            'student_ids': ['155N1000/24'],
            'academic_year': '2024'
        }
        
        response = self.client.post(project_url, project_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project_id = response.data['id']
        
        # 2. Admin approves the project
        approve_url = reverse('projects:projects-update-status', kwargs={'pk': project_id})
        approve_data = {
            'status': 'Approved',
            'comment': 'Project approved'
        }
        
        response = self.client.post(approve_url, approve_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 3. Admin schedules defense
        defense_url = reverse('projects:projects-schedule-defense', kwargs={'pk': project_id})
        defense_data = {
            'defense_date': '2024-12-15',
            'defense_time': '09:00:00',
            'defense_room': 'Room A101'
        }
        
        response = self.client.post(defense_url, defense_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Verify project status
        project_detail_url = reverse('projects:projects-detail', kwargs={'pk': project_id})
        response = self.client.get(project_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Approved')
        self.assertEqual(response.data['defense_date'], '2024-12-15')
        self.assertEqual(response.data['defense_time'], '09:00:00')
        self.assertEqual(response.data['defense_room'], 'Room A101')
    
    def test_user_role_based_access(self):
        """Test user role-based access control"""
        # Test admin access
        self.client.force_authenticate(user=self.admin_user)
        
        # Admin should be able to access all endpoints
        students_url = reverse('users:students-list')
        response = self.client.get(students_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        advisors_url = reverse('users:advisors-list')
        response = self.client.get(advisors_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        projects_url = reverse('projects:projects-list')
        response = self.client.get(projects_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test advisor access
        self.client.force_authenticate(user=self.advisor_user)
        
        # Advisor should be able to access projects but not user management
        projects_url = reverse('projects:projects-list')
        response = self.client.get(projects_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        students_url = reverse('users:students-list')
        response = self.client.get(students_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test student access
        self.client.force_authenticate(user=self.student_user)
        
        # Student should be able to access their own projects
        projects_url = reverse('projects:projects-list')
        response = self.client.get(projects_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Student should not be able to access user management
        students_url = reverse('users:students-list')
        response = self.client.get(students_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_academic_year_isolation(self):
        """Test academic year data isolation"""
        # Create data for 2024
        project_2024 = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ 2024',
            topic_eng='Test Project 2024',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        # Create data for 2025
        project_2025 = Project.objects.create(
            project_id='P25001',
            topic_lao='ໂຄງການທົດສອບ 2025',
            topic_eng='Test Project 2025',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2025'
        )
        
        # Test filtering by academic year
        self.client.force_authenticate(user=self.admin_user)
        projects_url = reverse('projects:projects-list')
        
        # Get projects for 2024
        response = self.client.get(projects_url, {'academic_year': '2024'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['project_id'], 'P24001')
        
        # Get projects for 2025
        response = self.client.get(projects_url, {'academic_year': '2025'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['project_id'], 'P25001')
    
    def test_bulk_operations(self):
        """Test bulk operations"""
        # Create multiple students
        students = []
        for i in range(3):
            user = User.objects.create_user(
                username=f'student{i}',
                email=f'student{i}@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            )
            
            student = Student.objects.create(
                user=user,
                student_id=f'155N100{i}/24',
                name=f'Student{i}',
                surname='Test',
                major=self.major,
                classroom=self.classroom,
                academic_year='2024'
            )
            students.append(student)
        
        # Test bulk update students
        self.client.force_authenticate(user=self.admin_user)
        bulk_update_url = reverse('users:students-bulk-update')
        bulk_update_data = {
            'student_ids': ['155N1000/24', '155N1001/24', '155N1002/24'],
            'updates': {
                'status': 'Approved'
            }
        }
        
        response = self.client.post(bulk_update_url, bulk_update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify all students are approved
        for student in students:
            student.refresh_from_db()
            self.assertEqual(student.status, 'Approved')
        
        # Test bulk delete students
        bulk_delete_url = reverse('users:students-bulk-delete')
        bulk_delete_data = {
            'student_ids': ['155N1001/24', '155N1002/24']
        }
        
        response = self.client.delete(bulk_delete_url, bulk_delete_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify students are deleted
        self.assertFalse(Student.objects.filter(student_id='155N1001/24').exists())
        self.assertFalse(Student.objects.filter(student_id='155N1002/24').exists())
        self.assertTrue(Student.objects.filter(student_id='155N1000/24').exists())
    
    def test_project_committee_management(self):
        """Test project committee management"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        # Create committee members
        committee_member1 = Advisor.objects.create(
            name='Dr. Committee Member 1',
            academic_year='2024'
        )
        
        committee_member2 = Advisor.objects.create(
            name='Dr. Committee Member 2',
            academic_year='2024'
        )
        
        # Test setting committee members
        self.client.force_authenticate(user=self.admin_user)
        
        # Set main committee member
        main_committee_url = reverse('projects:projects-update-committee', kwargs={'pk': project.id})
        main_committee_data = {
            'committee_type': 'main',
            'advisor_id': committee_member1.id
        }
        
        response = self.client.post(main_committee_url, main_committee_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Set second committee member
        second_committee_data = {
            'committee_type': 'second',
            'advisor_id': committee_member2.id
        }
        
        response = self.client.post(main_committee_url, second_committee_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify committee members are set
        project.refresh_from_db()
        self.assertEqual(project.main_committee, committee_member1)
        self.assertEqual(project.second_committee, committee_member2)
    
    def test_project_transfer(self):
        """Test project transfer between advisors"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        # Create new advisor
        new_advisor = Advisor.objects.create(
            name='Dr. New Advisor',
            academic_year='2024'
        )
        
        # Test project transfer
        self.client.force_authenticate(user=self.admin_user)
        transfer_url = reverse('projects:projects-transfer', kwargs={'pk': project.id})
        transfer_data = {
            'new_advisor_id': new_advisor.id,
            'comment': 'Transferring due to workload'
        }
        
        response = self.client.post(transfer_url, transfer_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify project is transferred
        project.refresh_from_db()
        self.assertEqual(project.advisor, new_advisor)
        self.assertEqual(project.advisor_name, 'Dr. New Advisor')
    
    def test_statistics_endpoints(self):
        """Test statistics endpoints"""
        # Create some test data
        Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ 1',
            topic_eng='Test Project 1',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            status='Pending',
            academic_year='2024'
        )
        
        Project.objects.create(
            project_id='P24002',
            topic_lao='ໂຄງການທົດສອບ 2',
            topic_eng='Test Project 2',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            status='Approved',
            academic_year='2024'
        )
        
        # Test project statistics
        self.client.force_authenticate(user=self.admin_user)
        project_stats_url = reverse('projects:projects-statistics')
        response = self.client.get(project_stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_projects', response.data)
        self.assertIn('pending_projects', response.data)
        self.assertIn('approved_projects', response.data)
        
        # Test user statistics
        user_stats_url = reverse('users:users-statistics')
        response = self.client.get(user_stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', response.data)
        self.assertIn('total_students', response.data)
        self.assertIn('total_advisors', response.data)
        
        # Test student statistics
        student_stats_url = reverse('users:students-statistics')
        response = self.client.get(student_stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_students', response.data)
        self.assertIn('approved_students', response.data)
        self.assertIn('pending_students', response.data)
        
        # Test advisor statistics
        advisor_stats_url = reverse('users:advisors-statistics')
        response = self.client.get(advisor_stats_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_advisors', response.data)
        self.assertIn('department_admins', response.data)
        self.assertIn('regular_advisors', response.data)
    
    def test_search_functionality(self):
        """Test search functionality"""
        # Create test projects
        Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ 1',
            topic_eng='Machine Learning Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        Project.objects.create(
            project_id='P24002',
            topic_lao='ໂຄງການທົດສອບ 2',
            topic_eng='Database Management Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        # Test project search
        self.client.force_authenticate(user=self.admin_user)
        search_url = reverse('projects:projects-search')
        
        # Search by topic
        response = self.client.get(search_url, {'query': 'Machine Learning'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['topic_eng'], 'Machine Learning Project')
        
        # Search by status
        response = self.client.get(search_url, {'status': 'Pending'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
        # Search by advisor
        response = self.client.get(search_url, {'advisor': 'Dr. John Advisor'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_pagination(self):
        """Test pagination functionality"""
        # Create multiple projects
        for i in range(25):
            Project.objects.create(
                project_id=f'P240{i:02d}',
                topic_lao=f'ໂຄງການທົດສອບ {i}',
                topic_eng=f'Test Project {i}',
                advisor_name='Dr. John Advisor',
                advisor=self.advisor,
                academic_year='2024'
            )
        
        # Test pagination
        self.client.force_authenticate(user=self.admin_user)
        projects_url = reverse('projects:projects-list')
        
        # Get first page
        response = self.client.get(projects_url, {'page': 1, 'page_size': 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)
        self.assertEqual(response.data['count'], 25)
        self.assertIsNotNone(response.data['next'])
        self.assertIsNone(response.data['previous'])
        
        # Get second page
        response = self.client.get(projects_url, {'page': 2, 'page_size': 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIsNotNone(response.data['next'])
        self.assertIsNotNone(response.data['previous'])
        
        # Get last page
        response = self.client.get(projects_url, {'page': 3, 'page_size': 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 5)
        self.assertIsNone(response.data['next'])
        self.assertIsNotNone(response.data['previous'])
    
    def test_error_handling(self):
        """Test error handling"""
        # Test invalid project ID
        self.client.force_authenticate(user=self.admin_user)
        invalid_url = reverse('projects:projects-detail', kwargs={'pk': 99999})
        response = self.client.get(invalid_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Test invalid student ID
        invalid_student_url = reverse('users:students-detail', kwargs={'pk': 99999})
        response = self.client.get(invalid_student_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Test invalid advisor ID
        invalid_advisor_url = reverse('users:advisors-detail', kwargs={'pk': 99999})
        response = self.client.get(invalid_advisor_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_data_validation(self):
        """Test data validation"""
        # Test invalid student creation
        self.client.force_authenticate(user=self.admin_user)
        students_url = reverse('users:students-list')
        invalid_data = {
            'student_id': 'invalid-id',
            'name': '',
            'surname': '',
            'gender': 'Invalid',
            'major': 99999,
            'classroom': 99999,
            'academic_year': '2024'
        }
        
        response = self.client.post(students_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('student_id', response.data)
        self.assertIn('name', response.data)
        self.assertIn('surname', response.data)
        self.assertIn('gender', response.data)
        self.assertIn('major', response.data)
        self.assertIn('classroom', response.data)
        
        # Test invalid project creation
        projects_url = reverse('projects:projects-list')
        invalid_project_data = {
            'topic_lao': '',
            'topic_eng': '',
            'advisor_name': '',
            'advisor': 99999,
            'student_ids': [],
            'academic_year': '2024'
        }
        
        response = self.client.post(projects_url, invalid_project_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('topic_lao', response.data)
        self.assertIn('topic_eng', response.data)
        self.assertIn('advisor_name', response.data)
        self.assertIn('advisor', response.data)
        self.assertIn('student_ids', response.data)
