"""
Project management tests for the Final Project Management System
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from ..models import Project, ProjectGroup, Student, Advisor
from ..models.majors import Major
from ..models.classrooms import Classroom

User = get_user_model()


class ProjectTestCase(APITestCase):
    """
    Test cases for project management functionality
    """
    
    def setUp(self):
        """Set up test data"""
        # Create users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpass123',
            role='admin',
            academic_year='2024'
        )
        
        self.advisor_user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='advisorpass123',
            role='advisor',
            academic_year='2024'
        )
        
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
    
    def test_create_project(self):
        """Test project creation"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-list')
        data = {
            'topic_lao': 'ໂຄງການທົດສອບ',
            'topic_eng': 'Test Project',
            'advisor_name': 'Dr. John Advisor',
            'advisor': self.advisor.id,
            'comment': 'Test comment',
            'student_ids': ['155N1000/24'],
            'academic_year': '2024'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Project.objects.filter(topic_eng='Test Project').exists())
    
    def test_create_project_without_students(self):
        """Test project creation without students"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-list')
        data = {
            'topic_lao': 'ໂຄງການທົດສອບ',
            'topic_eng': 'Test Project',
            'advisor_name': 'Dr. John Advisor',
            'advisor': self.advisor.id,
            'comment': 'Test comment',
            'student_ids': [],
            'academic_year': '2024'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('At least one student is required', str(response.data))
    
    def test_create_project_advisor_quota_exceeded(self):
        """Test project creation when advisor quota is exceeded"""
        # Set advisor quota to 0
        self.advisor.quota = 0
        self.advisor.save()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-list')
        data = {
            'topic_lao': 'ໂຄງການທົດສອບ',
            'topic_eng': 'Test Project',
            'advisor_name': 'Dr. John Advisor',
            'advisor': self.advisor.id,
            'comment': 'Test comment',
            'student_ids': ['155N1000/24'],
            'academic_year': '2024'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Advisor has reached their quota limit', str(response.data))
    
    def test_get_project_list(self):
        """Test getting project list"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        project_group = ProjectGroup.objects.create(
            project=project,
            academic_year='2024'
        )
        project_group.students.add(self.student)
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_get_project_detail(self):
        """Test getting project detail"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        project_group = ProjectGroup.objects.create(
            project=project,
            academic_year='2024'
        )
        project_group.students.add(self.student)
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-detail', kwargs={'pk': project.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['topic_eng'], 'Test Project')
    
    def test_update_project_status(self):
        """Test updating project status"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-update-status', kwargs={'pk': project.id})
        data = {
            'status': 'Approved',
            'comment': 'Project approved'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        project.refresh_from_db()
        self.assertEqual(project.status, 'Approved')
    
    def test_update_project_committee(self):
        """Test updating project committee"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        # Create another advisor for committee
        committee_advisor = Advisor.objects.create(
            name='Dr. Committee Member',
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-update-committee', kwargs={'pk': project.id})
        data = {
            'committee_type': 'main',
            'advisor_id': committee_advisor.id
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        project.refresh_from_db()
        self.assertEqual(project.main_committee, committee_advisor)
    
    def test_schedule_defense(self):
        """Test scheduling project defense"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-schedule-defense', kwargs={'pk': project.id})
        data = {
            'defense_date': '2024-12-15',
            'defense_time': '09:00:00',
            'defense_room': 'Room A101'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        project.refresh_from_db()
        self.assertEqual(project.defense_date.strftime('%Y-%m-%d'), '2024-12-15')
        self.assertEqual(project.defense_time.strftime('%H:%M:%S'), '09:00:00')
        self.assertEqual(project.defense_room, 'Room A101')
    
    def test_transfer_project(self):
        """Test transferring project to another advisor"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        # Create another advisor
        new_advisor = Advisor.objects.create(
            name='Dr. New Advisor',
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-transfer', kwargs={'pk': project.id})
        data = {
            'new_advisor_id': new_advisor.id,
            'comment': 'Transferring due to workload'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        project.refresh_from_db()
        self.assertEqual(project.advisor, new_advisor)
        self.assertEqual(project.advisor_name, 'Dr. New Advisor')
    
    def test_get_project_milestones(self):
        """Test getting project milestones"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-milestones', kwargs={'pk': project.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_get_project_log_entries(self):
        """Test getting project log entries"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-log-entries', kwargs={'pk': project.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
    
    def test_add_project_log_entry(self):
        """Test adding log entry to project"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-add-log-entry', kwargs={'pk': project.id})
        data = {
            'type': 'message',
            'message': 'Test log entry'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('Log entry added successfully', response.data['message'])
    
    def test_bulk_update_projects(self):
        """Test bulk updating projects"""
        # Create projects
        project1 = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ 1',
            topic_eng='Test Project 1',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        project2 = Project.objects.create(
            project_id='P24002',
            topic_lao='ໂຄງການທົດສອບ 2',
            topic_eng='Test Project 2',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-bulk-update')
        data = {
            'project_ids': ['P24001', 'P24002'],
            'updates': {
                'status': 'Approved'
            }
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        project1.refresh_from_db()
        project2.refresh_from_db()
        self.assertEqual(project1.status, 'Approved')
        self.assertEqual(project2.status, 'Approved')
    
    def test_get_project_statistics(self):
        """Test getting project statistics"""
        # Create projects with different statuses
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
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-statistics')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_projects', response.data)
        self.assertIn('pending_projects', response.data)
        self.assertIn('approved_projects', response.data)
    
    def test_search_projects(self):
        """Test searching projects"""
        # Create a project
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-search')
        params = {
            'query': 'Test Project',
            'status': 'Pending'
        }
        
        response = self.client.get(url, params)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
    
    def test_student_can_only_see_own_projects(self):
        """Test that students can only see their own projects"""
        # Create a project for the student
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        project_group = ProjectGroup.objects.create(
            project=project,
            academic_year='2024'
        )
        project_group.students.add(self.student)
        
        # Create another project not for this student
        other_project = Project.objects.create(
            project_id='P24002',
            topic_lao='ໂຄງການທົດສອບ 2',
            topic_eng='Other Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('projects:projects-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['topic_eng'], 'Test Project')
    
    def test_advisor_can_see_their_projects(self):
        """Test that advisors can see their supervised projects"""
        # Create a project supervised by the advisor
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.advisor_user)
        url = reverse('projects:projects-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['topic_eng'], 'Test Project')
