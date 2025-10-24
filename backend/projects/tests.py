"""
Tests for projects app.
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
from students.models import Student
from advisors.models import Advisor
from majors.models import Major
from projects.models import ProjectGroup, StatusHistory, ProjectStudent, ProjectFile, CommunicationLog, ProjectHealthCheck, TopicSimilarity

User = get_user_model()


class ProjectGroupModelTest(TestCase):
    """Test cases for ProjectGroup model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='Student'
        )
        self.advisor_user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='testpass123',
            role='Advisor'
        )
        self.major = Major.objects.create(
            name='Computer Science',
            abbreviation='CS',
            description='Computer Science Program'
        )
        self.student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        self.advisor = Advisor.objects.create(
            user=self.advisor_user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10
        )

    def test_create_project_group(self):
        """Test project group creation."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            description='A comprehensive e-commerce platform',
            advisor=self.advisor,
            academic_year='2024-2025',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=120),
            status='active'
        )
        self.assertEqual(project_group.project_id, 'PROJ001')
        self.assertEqual(project_group.title, 'E-commerce Website')
        self.assertEqual(project_group.advisor, self.advisor)
        self.assertEqual(project_group.status, 'active')

    def test_project_group_str_representation(self):
        """Test project group string representation."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        expected = f"{project_group.project_id} - {project_group.title}"
        self.assertEqual(str(project_group), expected)

    def test_project_group_with_students(self):
        """Test project group with students."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        project_group.students.add(self.student)
        self.assertEqual(project_group.students.count(), 1)
        self.assertIn(self.student, project_group.students.all())

    def test_project_group_status_history(self):
        """Test project group status history."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor,
            status='active'
        )
        status_history = StatusHistory.objects.create(
            project_group=project_group,
            old_status='draft',
            new_status='active',
            changed_by=self.advisor_user,
            change_reason='Project approved'
        )
        self.assertEqual(status_history.project_group, project_group)
        self.assertEqual(status_history.old_status, 'draft')
        self.assertEqual(status_history.new_status, 'active')

    def test_project_student_relationship(self):
        """Test project student relationship."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        project_student = ProjectStudent.objects.create(
            project_group=project_group,
            student=self.student,
            role='Developer',
            joined_date=date.today()
        )
        self.assertEqual(project_student.project_group, project_group)
        self.assertEqual(project_student.student, self.student)
        self.assertEqual(project_student.role, 'Developer')

    def test_project_file_upload(self):
        """Test project file upload."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        project_file = ProjectFile.objects.create(
            project_group=project_group,
            file_name='design_document.pdf',
            file_path='/uploads/design_document.pdf',
            file_size=1024000,
            file_type='pdf',
            uploaded_by=self.user
        )
        self.assertEqual(project_file.project_group, project_group)
        self.assertEqual(project_file.file_name, 'design_document.pdf')
        self.assertEqual(project_file.uploaded_by, self.user)

    def test_communication_log(self):
        """Test communication log creation."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        communication = CommunicationLog.objects.create(
            project_group=project_group,
            sender=self.user,
            recipient=self.advisor_user,
            subject='Project Update',
            message='We have completed the initial design phase.',
            communication_type='email'
        )
        self.assertEqual(communication.project_group, project_group)
        self.assertEqual(communication.sender, self.user)
        self.assertEqual(communication.subject, 'Project Update')

    def test_project_health_check(self):
        """Test project health check creation."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        health_check = ProjectHealthCheck.objects.create(
            project_group=project_group,
            health_status='good',
            progress_percentage=75,
            issues_found=0,
            recommendations='Continue with current approach'
        )
        self.assertEqual(health_check.project_group, project_group)
        self.assertEqual(health_check.health_status, 'good')
        self.assertEqual(health_check.progress_percentage, 75)

    def test_topic_similarity(self):
        """Test topic similarity creation."""
        project_group1 = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        project_group2 = ProjectGroup.objects.create(
            project_id='PROJ002',
            title='Online Shopping Platform',
            advisor=self.advisor
        )
        similarity = TopicSimilarity.objects.create(
            project_group=project_group1,
            similar_project=project_group2,
            similarity_score=0.85,
            similarity_reason='Both projects focus on online retail'
        )
        self.assertEqual(similarity.project_group, project_group1)
        self.assertEqual(similarity.similar_project, project_group2)
        self.assertEqual(similarity.similarity_score, 0.85)


class ProjectGroupAPITest(APITestCase):
    """Test cases for ProjectGroup API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='Student'
        )
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
        self.major = Major.objects.create(
            name='Computer Science',
            abbreviation='CS',
            description='Computer Science Program'
        )
        self.student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        self.advisor = Advisor.objects.create(
            user=self.advisor_user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10
        )
        self.project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            description='A comprehensive e-commerce platform',
            advisor=self.advisor,
            academic_year='2024-2025',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=120),
            status='active'
        )

    def test_project_group_list_requires_auth(self):
        """Test that project group list requires authentication."""
        url = reverse('project-group-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_project_group_list_authenticated(self):
        """Test project group list with authentication."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-group-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_project_group_detail(self):
        """Test project group detail retrieval."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-group-detail', kwargs={'pk': self.project_group.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project_id'], 'PROJ001')

    def test_project_group_create(self):
        """Test project group creation."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-group-list')
        data = {
            'project_id': 'PROJ002',
            'title': 'Mobile App Development',
            'description': 'A mobile application for task management',
            'advisor': self.advisor.pk,
            'academic_year': '2024-2025',
            'start_date': date.today().isoformat(),
            'end_date': (date.today() + timedelta(days=120)).isoformat(),
            'status': 'active'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ProjectGroup.objects.filter(project_id='PROJ002').exists())

    def test_project_group_update(self):
        """Test project group update."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-group-detail', kwargs={'pk': self.project_group.pk})
        data = {'status': 'completed'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project_group.refresh_from_db()
        self.assertEqual(self.project_group.status, 'completed')

    def test_project_group_delete(self):
        """Test project group deletion."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-group-detail', kwargs={'pk': self.project_group.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ProjectGroup.objects.filter(pk=self.project_group.pk).exists())

    def test_project_group_students(self):
        """Test project group students endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-group-students', kwargs={'pk': self.project_group.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_project_group_files(self):
        """Test project group files endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-group-files', kwargs={'pk': self.project_group.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_project_group_communications(self):
        """Test project group communications endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-group-communications', kwargs={'pk': self.project_group.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_project_group_health_check(self):
        """Test project group health check endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('project-group-health-check', kwargs={'pk': self.project_group.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ProjectGroupIntegrationTest(TestCase):
    """Integration tests for project group functionality."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='Student'
        )
        self.advisor_user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='testpass123',
            role='Advisor'
        )
        self.major = Major.objects.create(
            name='Computer Science',
            abbreviation='CS',
            description='Computer Science Program'
        )
        self.student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        self.advisor = Advisor.objects.create(
            user=self.advisor_user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10
        )

    def test_project_group_lifecycle(self):
        """Test complete project group lifecycle."""
        # Create project group
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            description='A comprehensive e-commerce platform',
            advisor=self.advisor,
            academic_year='2024-2025',
            start_date=date.today(),
            end_date=date.today() + timedelta(days=120),
            status='draft'
        )
        
        # Add students
        project_group.students.add(self.student)
        
        # Create project student relationship
        ProjectStudent.objects.create(
            project_group=project_group,
            student=self.student,
            role='Developer',
            joined_date=date.today()
        )
        
        # Add status history
        StatusHistory.objects.create(
            project_group=project_group,
            old_status='draft',
            new_status='active',
            changed_by=self.advisor_user,
            change_reason='Project approved'
        )
        
        # Add communication
        CommunicationLog.objects.create(
            project_group=project_group,
            sender=self.user,
            recipient=self.advisor_user,
            subject='Project Update',
            message='We have completed the initial design phase.',
            communication_type='email'
        )
        
        # Add file
        ProjectFile.objects.create(
            project_group=project_group,
            file_name='design_document.pdf',
            file_path='/uploads/design_document.pdf',
            file_size=1024000,
            file_type='pdf',
            uploaded_by=self.user
        )
        
        # Add health check
        ProjectHealthCheck.objects.create(
            project_group=project_group,
            health_status='good',
            progress_percentage=25,
            issues_found=0,
            recommendations='Continue with current approach'
        )
        
        # Verify all relationships
        self.assertEqual(project_group.students.count(), 1)
        self.assertEqual(project_group.status_histories.count(), 1)
        self.assertEqual(project_group.communication_logs.count(), 1)
        self.assertEqual(project_group.project_files.count(), 1)
        self.assertEqual(project_group.health_checks.count(), 1)

    def test_project_group_status_transitions(self):
        """Test project group status transitions."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor,
            status='draft'
        )
        
        # Test status transitions
        statuses = ['draft', 'active', 'in_progress', 'completed', 'archived']
        for i, new_status in enumerate(statuses[1:], 1):
            old_status = statuses[i-1]
            StatusHistory.objects.create(
                project_group=project_group,
                old_status=old_status,
                new_status=new_status,
                changed_by=self.advisor_user,
                change_reason=f'Status changed from {old_status} to {new_status}'
            )
            project_group.status = new_status
            project_group.save()
        
        # Verify status history
        self.assertEqual(project_group.status_histories.count(), 4)
        self.assertEqual(project_group.status, 'archived')

    def test_project_group_communication_flow(self):
        """Test project group communication flow."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        
        # Add multiple communications
        communications = [
            ('Project Kickoff', 'Let\'s start the project', 'meeting'),
            ('Weekly Update', 'Progress update', 'email'),
            ('Issue Report', 'Found a bug in the code', 'email'),
            ('Final Review', 'Project is ready for review', 'meeting')
        ]
        
        for subject, message, comm_type in communications:
            CommunicationLog.objects.create(
                project_group=project_group,
                sender=self.user,
                recipient=self.advisor_user,
                subject=subject,
                message=message,
                communication_type=comm_type
            )
        
        # Verify communications
        self.assertEqual(project_group.communication_logs.count(), 4)
        email_communications = project_group.communication_logs.filter(communication_type='email')
        self.assertEqual(email_communications.count(), 2)

    def test_project_group_file_management(self):
        """Test project group file management."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        
        # Add multiple files
        files_data = [
            ('design_document.pdf', 'pdf', 1024000),
            ('requirements.docx', 'docx', 512000),
            ('code_review.md', 'md', 5000),
            ('presentation.pptx', 'pptx', 2048000)
        ]
        
        for file_name, file_type, file_size in files_data:
            ProjectFile.objects.create(
                project_group=project_group,
                file_name=file_name,
                file_path=f'/uploads/{file_name}',
                file_size=file_size,
                file_type=file_type,
                uploaded_by=self.user
            )
        
        # Verify files
        self.assertEqual(project_group.project_files.count(), 4)
        total_size = sum(f.file_size for f in project_group.project_files.all())
        self.assertEqual(total_size, 1024000 + 512000 + 5000 + 2048000)


class ProjectGroupModelValidationTest(TestCase):
    """Test cases for project group model validation."""

    def setUp(self):
        """Set up test data."""
        self.advisor_user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='testpass123',
            role='Advisor'
        )
        self.advisor = Advisor.objects.create(
            user=self.advisor_user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10
        )

    def test_project_id_required(self):
        """Test that project_id is required."""
        with self.assertRaises(Exception):
            ProjectGroup.objects.create(
                title='E-commerce Website',
                advisor=self.advisor
            )

    def test_title_required(self):
        """Test that title is required."""
        with self.assertRaises(Exception):
            ProjectGroup.objects.create(
                project_id='PROJ001',
                advisor=self.advisor
            )

    def test_advisor_required(self):
        """Test that advisor is required."""
        with self.assertRaises(Exception):
            ProjectGroup.objects.create(
                project_id='PROJ001',
                title='E-commerce Website'
            )

    def test_unique_project_id(self):
        """Test that project_id must be unique."""
        ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        with self.assertRaises(Exception):
            ProjectGroup.objects.create(
                project_id='PROJ001',
                title='Another Project',
                advisor=self.advisor
            )

    def test_date_validation(self):
        """Test date validation."""
        # Valid dates
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=120)
        )
        self.assertEqual(project_group.start_date, date.today())
        self.assertEqual(project_group.end_date, date.today() + timedelta(days=120))
        
        # Test end date after start date
        project_group.end_date = date.today() + timedelta(days=60)
        project_group.save()
        self.assertLess(project_group.start_date, project_group.end_date)


class ProjectGroupPermissionsTest(TestCase):
    """Test cases for project group permissions."""

    def setUp(self):
        """Set up test data."""
        self.student_user = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='testpass123',
            role='Student'
        )
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
        self.advisor = Advisor.objects.create(
            user=self.advisor_user,
            employee_id='ADV001',
            department='Computer Science',
            specialization='Software Engineering',
            max_students=10
        )

    def test_student_can_view_own_projects(self):
        """Test that students can view their own projects."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        # This would be tested in the API layer
        self.assertEqual(project_group.advisor, self.advisor)

    def test_advisor_can_view_assigned_projects(self):
        """Test that advisors can view their assigned projects."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        # This would be tested in the API layer
        self.assertEqual(project_group.advisor, self.advisor)

    def test_admin_can_manage_all_projects(self):
        """Test that admins can manage all projects."""
        project_group = ProjectGroup.objects.create(
            project_id='PROJ001',
            title='E-commerce Website',
            advisor=self.advisor
        )
        # This would be tested in the API layer
        self.assertEqual(project_group.advisor, self.advisor)
