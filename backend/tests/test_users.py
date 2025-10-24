"""
User management tests for the Final Project Management System
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from ..models import User, Student, Advisor
from ..models.majors import Major
from ..models.classrooms import Classroom

User = get_user_model()


class UserManagementTestCase(APITestCase):
    """
    Test cases for user management functionality
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
        
        # Create department admin
        self.dept_admin_user = User.objects.create_user(
            username='deptadmin',
            email='deptadmin@example.com',
            password='deptadminpass123',
            role='dept_admin',
            academic_year='2024'
        )
        
        # Create advisor
        self.advisor_user = User.objects.create_user(
            username='advisor',
            email='advisor@example.com',
            password='advisorpass123',
            role='advisor',
            academic_year='2024'
        )
        
        # Create student
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
        
        # Create advisor profile
        self.advisor = Advisor.objects.create(
            user=self.advisor_user,
            name='Dr. John Advisor',
            academic_year='2024'
        )
        
        # Create student profile
        self.student = Student.objects.create(
            user=self.student_user,
            student_id='155N1000/24',
            name='John',
            surname='Student',
            major=self.major,
            classroom=self.classroom,
            academic_year='2024'
        )
    
    def test_create_student(self):
        """Test student creation"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-list')
        data = {
            'student_id': '155N1001/24',
            'name': 'Jane',
            'surname': 'Doe',
            'gender': 'Female',
            'major': self.major.id,
            'classroom': self.classroom.id,
            'tel': '020-555-1234',
            'email': 'jane@example.com',
            'status': 'Approved',
            'academic_year': '2024'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Student.objects.filter(student_id='155N1001/24').exists())
    
    def test_create_student_duplicate_id(self):
        """Test student creation with duplicate ID"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-list')
        data = {
            'student_id': '155N1000/24',  # Same as existing student
            'name': 'Jane',
            'surname': 'Doe',
            'gender': 'Female',
            'major': self.major.id,
            'classroom': self.classroom.id,
            'tel': '020-555-1234',
            'email': 'jane@example.com',
            'status': 'Approved',
            'academic_year': '2024'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Student ID already exists', str(response.data))
    
    def test_get_student_list(self):
        """Test getting student list"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['student_id'], '155N1000/24')
    
    def test_get_student_detail(self):
        """Test getting student detail"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-detail', kwargs={'pk': self.student.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student_id'], '155N1000/24')
    
    def test_update_student(self):
        """Test updating student"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-detail', kwargs={'pk': self.student.id})
        data = {
            'name': 'John Updated',
            'tel': '020-555-9999'
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.student.refresh_from_db()
        self.assertEqual(self.student.name, 'John Updated')
        self.assertEqual(self.student.tel, '020-555-9999')
    
    def test_approve_student(self):
        """Test approving student"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-approve', kwargs={'pk': self.student.id})
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.student.refresh_from_db()
        self.assertEqual(self.student.status, 'Approved')
    
    def test_bulk_update_students(self):
        """Test bulk updating students"""
        # Create another student
        student2 = Student.objects.create(
            user=User.objects.create_user(
                username='student2',
                email='student2@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            ),
            student_id='155N1002/24',
            name='Jane',
            surname='Doe',
            major=self.major,
            classroom=self.classroom,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-bulk-update')
        data = {
            'student_ids': ['155N1000/24', '155N1002/24'],
            'updates': {
                'status': 'Approved'
            }
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.student.refresh_from_db()
        student2.refresh_from_db()
        self.assertEqual(self.student.status, 'Approved')
        self.assertEqual(student2.status, 'Approved')
    
    def test_bulk_delete_students(self):
        """Test bulk deleting students"""
        # Create another student
        student2 = Student.objects.create(
            user=User.objects.create_user(
                username='student2',
                email='student2@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            ),
            student_id='155N1002/24',
            name='Jane',
            surname='Doe',
            major=self.major,
            classroom=self.classroom,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-bulk-delete')
        data = {
            'student_ids': ['155N1000/24', '155N1002/24']
        }
        
        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertFalse(Student.objects.filter(student_id='155N1000/24').exists())
        self.assertFalse(Student.objects.filter(student_id='155N1002/24').exists())
    
    def test_get_student_statistics(self):
        """Test getting student statistics"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-statistics')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_students', response.data)
        self.assertIn('approved_students', response.data)
        self.assertIn('pending_students', response.data)
    
    def test_create_advisor(self):
        """Test advisor creation"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:advisors-list')
        data = {
            'name': 'Dr. Jane Advisor',
            'quota': 5,
            'main_committee_quota': 3,
            'second_committee_quota': 3,
            'third_committee_quota': 3,
            'is_department_admin': False,
            'specialized_majors': [self.major.id],
            'academic_year': '2024'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Advisor.objects.filter(name='Dr. Jane Advisor').exists())
    
    def test_get_advisor_list(self):
        """Test getting advisor list"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:advisors-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Dr. John Advisor')
    
    def test_get_advisor_workload(self):
        """Test getting advisor workload"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:advisors-workload', kwargs={'pk': self.advisor.id})
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('supervised_projects', response.data)
        self.assertIn('quota_remaining', response.data)
    
    def test_set_advisor_department_admin(self):
        """Test setting advisor as department admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:advisors-set-department-admin', kwargs={'pk': self.advisor.id})
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.advisor.refresh_from_db()
        self.assertTrue(self.advisor.is_department_admin)
    
    def test_remove_advisor_department_admin(self):
        """Test removing department admin status"""
        self.advisor.is_department_admin = True
        self.advisor.save()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:advisors-remove-department-admin', kwargs={'pk': self.advisor.id})
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.advisor.refresh_from_db()
        self.assertFalse(self.advisor.is_department_admin)
    
    def test_bulk_update_advisors(self):
        """Test bulk updating advisors"""
        # Create another advisor
        advisor2 = Advisor.objects.create(
            name='Dr. Jane Advisor',
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:advisors-bulk-update')
        data = {
            'advisor_ids': [self.advisor.id, advisor2.id],
            'updates': {
                'quota': 10
            }
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.advisor.refresh_from_db()
        advisor2.refresh_from_db()
        self.assertEqual(self.advisor.quota, 10)
        self.assertEqual(advisor2.quota, 10)
    
    def test_get_advisor_statistics(self):
        """Test getting advisor statistics"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:advisors-statistics')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_advisors', response.data)
        self.assertIn('department_admins', response.data)
        self.assertIn('regular_advisors', response.data)
    
    def test_get_user_list(self):
        """Test getting user list"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:users-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 4)  # 4 users created in setUp
    
    def test_activate_user(self):
        """Test activating user"""
        self.student_user.is_active = False
        self.student_user.save()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:users-activate', kwargs={'pk': self.student_user.id})
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.student_user.refresh_from_db()
        self.assertTrue(self.student_user.is_active)
    
    def test_deactivate_user(self):
        """Test deactivating user"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:users-deactivate', kwargs={'pk': self.student_user.id})
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.student_user.refresh_from_db()
        self.assertFalse(self.student_user.is_active)
    
    def test_force_password_change(self):
        """Test forcing password change"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:users-force-password-change', kwargs={'pk': self.student_user.id})
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.student_user.refresh_from_db()
        self.assertTrue(self.student_user.must_change_password)
    
    def test_get_user_statistics(self):
        """Test getting user statistics"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:users-statistics')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_users', response.data)
        self.assertIn('total_students', response.data)
        self.assertIn('total_advisors', response.data)
        self.assertIn('total_admins', response.data)
    
    def test_department_admin_can_only_see_their_students(self):
        """Test that department admins can only see students in their departments"""
        # Set advisor as department admin with specialized major
        self.advisor.is_department_admin = True
        self.advisor.specialized_majors.add(self.major)
        self.advisor.save()
        
        # Create another major and student
        other_major = Major.objects.create(
            name='Computer Science',
            abbreviation='CS',
            academic_year='2024'
        )
        
        other_classroom = Classroom.objects.create(
            name='CS-4A',
            major=other_major,
            major_name='Computer Science',
            academic_year='2024'
        )
        
        other_student = Student.objects.create(
            user=User.objects.create_user(
                username='otherstudent',
                email='otherstudent@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            ),
            student_id='155N1003/24',
            name='Other',
            surname='Student',
            major=other_major,
            classroom=other_classroom,
            academic_year='2024'
        )
        
        self.client.force_authenticate(user=self.dept_admin_user)
        url = reverse('users:students-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see students in their managed majors
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['student_id'], '155N1000/24')
    
    def test_student_cannot_access_user_management(self):
        """Test that students cannot access user management"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('users:students-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_advisor_cannot_access_user_management(self):
        """Test that advisors cannot access user management"""
        self.client.force_authenticate(user=self.advisor_user)
        url = reverse('users:students-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
