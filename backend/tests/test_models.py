"""
Model tests for the Final Project Management System
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from ..models import User, Student, Advisor, Project, ProjectGroup
from ..models.majors import Major
from ..models.classrooms import Classroom

User = get_user_model()


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


class StudentModelTestCase(TestCase):
    """
    Test cases for Student model
    """
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='studentpass123',
            role='student',
            academic_year='2024'
        )
        
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
        
        self.student = Student.objects.create(
            user=self.user,
            student_id='155N1000/24',
            name='John',
            surname='Student',
            major=self.major,
            classroom=self.classroom,
            academic_year='2024'
        )
    
    def test_student_creation(self):
        """Test student creation"""
        self.assertEqual(self.student.student_id, '155N1000/24')
        self.assertEqual(self.student.name, 'John')
        self.assertEqual(self.student.surname, 'Student')
        self.assertEqual(self.student.major, self.major)
        self.assertEqual(self.student.classroom, self.classroom)
        self.assertEqual(self.student.status, 'Pending')
    
    def test_student_full_name(self):
        """Test student full name"""
        self.assertEqual(self.student.full_name, 'John Student')
    
    def test_student_string_representation(self):
        """Test student string representation"""
        expected = f"{self.student.student_id} - {self.student.name} {self.student.surname}"
        self.assertEqual(str(self.student), expected)
    
    def test_student_can_register_project(self):
        """Test student project registration capability"""
        # Student should be able to register project initially
        self.assertTrue(self.student.can_register_project())
        
        # Create a project for the student
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. Advisor',
            academic_year='2024'
        )
        
        project_group = ProjectGroup.objects.create(
            project=project,
            academic_year='2024'
        )
        project_group.students.add(self.student)
        
        # Student should not be able to register another project
        self.assertFalse(self.student.can_register_project())
    
    def test_student_get_project_count(self):
        """Test student project count"""
        # Initially no projects
        self.assertEqual(self.student.get_project_count(), 0)
        
        # Create a project for the student
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. Advisor',
            academic_year='2024'
        )
        
        project_group = ProjectGroup.objects.create(
            project=project,
            academic_year='2024'
        )
        project_group.students.add(self.student)
        
        # Should have 1 project
        self.assertEqual(self.student.get_project_count(), 1)


class AdvisorModelTestCase(TestCase):
    """
    Test cases for Advisor model
    """
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='advisorpass123',
            role='advisor',
            academic_year='2024'
        )
        
        self.major = Major.objects.create(
            name='Business Administration',
            abbreviation='BA',
            academic_year='2024'
        )
        
        self.advisor = Advisor.objects.create(
            user=self.user,
            name='Dr. John Advisor',
            quota=3,
            main_committee_quota=3,
            second_committee_quota=3,
            third_committee_quota=3,
            academic_year='2024'
        )
    
    def test_advisor_creation(self):
        """Test advisor creation"""
        self.assertEqual(self.advisor.name, 'Dr. John Advisor')
        self.assertEqual(self.advisor.quota, 3)
        self.assertEqual(self.advisor.main_committee_quota, 3)
        self.assertEqual(self.advisor.second_committee_quota, 3)
        self.assertEqual(self.advisor.third_committee_quota, 3)
        self.assertFalse(self.advisor.is_department_admin)
    
    def test_advisor_string_representation(self):
        """Test advisor string representation"""
        expected = f"{self.advisor.name} ({self.advisor.get_role_display()})"
        self.assertEqual(str(self.advisor), expected)
    
    def test_advisor_get_current_project_count(self):
        """Test advisor current project count"""
        # Initially no projects
        self.assertEqual(self.advisor.get_current_project_count(), 0)
        
        # Create a project supervised by the advisor
        project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            status='Approved',
            academic_year='2024'
        )
        
        # Should have 1 project
        self.assertEqual(self.advisor.get_current_project_count(), 1)
    
    def test_advisor_can_supervise_more_projects(self):
        """Test advisor project supervision capability"""
        # Should be able to supervise more projects initially
        self.assertTrue(self.advisor.can_supervise_more_projects())
        
        # Create projects up to quota
        for i in range(3):
            Project.objects.create(
                project_id=f'P2400{i+1}',
                topic_lao=f'ໂຄງການທົດສອບ {i+1}',
                topic_eng=f'Test Project {i+1}',
                advisor_name='Dr. John Advisor',
                advisor=self.advisor,
                status='Approved',
                academic_year='2024'
            )
        
        # Should not be able to supervise more projects
        self.assertFalse(self.advisor.can_supervise_more_projects())
    
    def test_advisor_get_workload_summary(self):
        """Test advisor workload summary"""
        workload = self.advisor.get_workload_summary()
        
        self.assertIn('supervised_projects', workload)
        self.assertIn('main_committee', workload)
        self.assertIn('second_committee', workload)
        self.assertIn('third_committee', workload)
        self.assertIn('quota_remaining', workload)
        
        self.assertEqual(workload['supervised_projects'], 0)
        self.assertEqual(workload['quota_remaining'], 3)
    
    def test_advisor_is_overloaded(self):
        """Test advisor overload status"""
        # Should not be overloaded initially
        self.assertFalse(self.advisor.is_overloaded())
        
        # Create projects exceeding quota
        for i in range(4):  # Exceed quota of 3
            Project.objects.create(
                project_id=f'P2400{i+1}',
                topic_lao=f'ໂຄງການທົດສອບ {i+1}',
                topic_eng=f'Test Project {i+1}',
                advisor_name='Dr. John Advisor',
                advisor=self.advisor,
                status='Approved',
                academic_year='2024'
            )
        
        # Should be overloaded
        self.assertTrue(self.advisor.is_overloaded())


class ProjectModelTestCase(TestCase):
    """
    Test cases for Project model
    """
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='advisorpass123',
            role='advisor',
            academic_year='2024'
        )
        
        self.advisor = Advisor.objects.create(
            user=self.user,
            name='Dr. John Advisor',
            academic_year='2024'
        )
        
        self.project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
    
    def test_project_creation(self):
        """Test project creation"""
        self.assertEqual(self.project.project_id, 'P24001')
        self.assertEqual(self.project.topic_lao, 'ໂຄງການທົດສອບ')
        self.assertEqual(self.project.topic_eng, 'Test Project')
        self.assertEqual(self.project.advisor_name, 'Dr. John Advisor')
        self.assertEqual(self.project.advisor, self.advisor)
        self.assertEqual(self.project.status, 'Pending')
    
    def test_project_string_representation(self):
        """Test project string representation"""
        expected = f"{self.project.project_id} - {self.project.topic_eng}"
        self.assertEqual(str(self.project), expected)
    
    def test_project_is_scheduled(self):
        """Test project defense scheduling status"""
        # Should not be scheduled initially
        self.assertFalse(self.project.is_scheduled())
        
        # Set defense details
        self.project.defense_date = '2024-12-15'
        self.project.defense_time = '09:00:00'
        self.project.defense_room = 'Room A101'
        self.project.save()
        
        # Should be scheduled now
        self.assertTrue(self.project.is_scheduled())
    
    def test_project_can_be_edited_by_advisor(self):
        """Test project editing permissions for advisor"""
        # Advisor should be able to edit their own project
        self.assertTrue(self.project.can_be_edited_by(self.user))
        
        # Create another user
        other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='otherpass123',
            role='advisor',
            academic_year='2024'
        )
        
        # Other user should not be able to edit
        self.assertFalse(self.project.can_be_edited_by(other_user))
    
    def test_project_can_be_viewed_by_advisor(self):
        """Test project viewing permissions for advisor"""
        # Advisor should be able to view their own project
        self.assertTrue(self.project.can_be_viewed_by(self.user))
        
        # Create another user
        other_user = User.objects.create_user(
            username='other',
            email='other@example.com',
            password='otherpass123',
            role='advisor',
            academic_year='2024'
        )
        
        # Other user should not be able to view
        self.assertFalse(self.project.can_be_viewed_by(other_user))


class ProjectGroupModelTestCase(TestCase):
    """
    Test cases for ProjectGroup model
    """
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='advisorpass123',
            role='advisor',
            academic_year='2024'
        )
        
        self.advisor = Advisor.objects.create(
            user=self.user,
            name='Dr. John Advisor',
            academic_year='2024'
        )
        
        self.project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        self.project_group = ProjectGroup.objects.create(
            project=self.project,
            academic_year='2024'
        )
    
    def test_project_group_creation(self):
        """Test project group creation"""
        self.assertEqual(self.project_group.project, self.project)
        self.assertEqual(self.project_group.academic_year, '2024')
    
    def test_project_group_string_representation(self):
        """Test project group string representation"""
        expected = f"{self.project_group.project.project_id} - {self.project_group.get_student_names()}"
        self.assertEqual(str(self.project_group), expected)
    
    def test_project_group_get_student_count(self):
        """Test project group student count"""
        # Initially no students
        self.assertEqual(self.project_group.get_student_count(), 0)
    
    def test_project_group_can_add_more_students(self):
        """Test project group student addition capability"""
        # Should be able to add students initially
        self.assertTrue(self.project_group.can_add_more_students())
        
        # Add students up to limit
        for i in range(2):  # Max 2 students
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
                major=Major.objects.create(
                    name='Test Major',
                    abbreviation='TM',
                    academic_year='2024'
                ),
                classroom=Classroom.objects.create(
                    name=f'TM-4{i}',
                    major=Major.objects.get(name='Test Major'),
                    major_name='Test Major',
                    academic_year='2024'
                ),
                academic_year='2024'
            )
            
            self.project_group.students.add(student)
        
        # Should not be able to add more students
        self.assertFalse(self.project_group.can_add_more_students())


class MajorModelTestCase(TestCase):
    """
    Test cases for Major model
    """
    
    def setUp(self):
        """Set up test data"""
        self.major = Major.objects.create(
            name='Business Administration',
            abbreviation='BA',
            academic_year='2024'
        )
    
    def test_major_creation(self):
        """Test major creation"""
        self.assertEqual(self.major.name, 'Business Administration')
        self.assertEqual(self.major.abbreviation, 'BA')
        self.assertEqual(self.major.academic_year, '2024')
    
    def test_major_string_representation(self):
        """Test major string representation"""
        expected = f"{self.major.name} ({self.major.abbreviation})"
        self.assertEqual(str(self.major), expected)
    
    def test_major_get_student_count(self):
        """Test major student count"""
        # Initially no students
        self.assertEqual(self.major.get_student_count(), 0)
    
    def test_major_get_project_count(self):
        """Test major project count"""
        # Initially no projects
        self.assertEqual(self.major.get_project_count(), 0)
    
    def test_major_get_advisor_count(self):
        """Test major advisor count"""
        # Initially no advisors
        self.assertEqual(self.major.get_advisor_count(), 0)
    
    def test_major_get_statistics(self):
        """Test major statistics"""
        stats = self.major.get_statistics()
        
        self.assertIn('student_count', stats)
        self.assertIn('project_count', stats)
        self.assertIn('advisor_count', stats)
        self.assertIn('classroom_count', stats)
        
        self.assertEqual(stats['student_count'], 0)
        self.assertEqual(stats['project_count'], 0)
        self.assertEqual(stats['advisor_count'], 0)
        self.assertEqual(stats['classroom_count'], 0)
    
    def test_major_copy_to_new_year(self):
        """Test major copying to new academic year"""
        new_major = self.major.copy_to_new_year('2025')
        
        self.assertEqual(new_major.name, self.major.name)
        self.assertEqual(new_major.abbreviation, self.major.abbreviation)
        self.assertEqual(new_major.academic_year, '2025')


class ClassroomModelTestCase(TestCase):
    """
    Test cases for Classroom model
    """
    
    def setUp(self):
        """Set up test data"""
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
    
    def test_classroom_creation(self):
        """Test classroom creation"""
        self.assertEqual(self.classroom.name, 'BA-4A')
        self.assertEqual(self.classroom.major, self.major)
        self.assertEqual(self.classroom.major_name, 'Business Administration')
        self.assertEqual(self.classroom.academic_year, '2024')
    
    def test_classroom_string_representation(self):
        """Test classroom string representation"""
        expected = f"{self.classroom.name} - {self.classroom.major_name}"
        self.assertEqual(str(self.classroom), expected)
    
    def test_classroom_get_student_count(self):
        """Test classroom student count"""
        # Initially no students
        self.assertEqual(self.classroom.get_student_count(), 0)
    
    def test_classroom_get_project_count(self):
        """Test classroom project count"""
        # Initially no projects
        self.assertEqual(self.classroom.get_project_count(), 0)
    
    def test_classroom_get_statistics(self):
        """Test classroom statistics"""
        stats = self.classroom.get_statistics()
        
        self.assertIn('student_count', stats)
        self.assertIn('project_count', stats)
        self.assertIn('major', stats)
        
        self.assertEqual(stats['student_count'], 0)
        self.assertEqual(stats['project_count'], 0)
        self.assertEqual(stats['major'], 'Business Administration')
    
    def test_classroom_copy_to_new_year(self):
        """Test classroom copying to new academic year"""
        new_classroom = self.classroom.copy_to_new_year('2025')
        
        self.assertEqual(new_classroom.name, self.classroom.name)
        self.assertEqual(new_classroom.major, self.classroom.major)
        self.assertEqual(new_classroom.major_name, self.classroom.major_name)
        self.assertEqual(new_classroom.academic_year, '2025')