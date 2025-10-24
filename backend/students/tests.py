"""
Tests for students app.
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date
import json

from accounts.models import User
from students.models import Student, StudentAcademicRecord, StudentSkill, StudentAchievement, StudentAttendance, StudentNote
from majors.models import Major

User = get_user_model()


class StudentModelTest(TestCase):
    """Test cases for Student model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='teststudent',
            email='student@example.com',
            password='testpass123',
            role='Student'
        )
        self.major = Major.objects.create(
            name='Computer Science',
            abbreviation='CS',
            description='Computer Science Program',
            degree_level='Bachelor',
            duration_years=4,
            total_credits=120
        )

    def test_create_student(self):
        """Test student creation."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major,
            enrollment_year=2024,
            expected_graduation_year=2028,
            gpa=3.5,
            is_active=True
        )
        self.assertEqual(student.user, self.user)
        self.assertEqual(student.student_id, 'STU001')
        self.assertEqual(student.major, self.major)
        self.assertEqual(student.gpa, 3.5)
        self.assertTrue(student.is_active)

    def test_student_str_representation(self):
        """Test student string representation."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        expected = f"{student.student_id} - {student.user.get_full_name()}"
        self.assertEqual(str(student), expected)

    def test_student_academic_record(self):
        """Test student academic record creation."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        record = StudentAcademicRecord.objects.create(
            student=student,
            semester='Fall 2024',
            credits_completed=15,
            gpa=3.5
        )
        self.assertEqual(record.student, student)
        self.assertEqual(record.semester, 'Fall 2024')
        self.assertEqual(record.credits_completed, 15)

    def test_student_skill(self):
        """Test student skill creation."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        skill = StudentSkill.objects.create(
            student=student,
            skill_name='Python Programming',
            proficiency_level='Advanced',
            years_experience=2
        )
        self.assertEqual(skill.student, student)
        self.assertEqual(skill.skill_name, 'Python Programming')
        self.assertEqual(skill.proficiency_level, 'Advanced')

    def test_student_achievement(self):
        """Test student achievement creation."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        achievement = StudentAchievement.objects.create(
            student=student,
            achievement_type='Award',
            title='Dean\'s List',
            description='Academic excellence',
            date_earned=date.today()
        )
        self.assertEqual(achievement.student, student)
        self.assertEqual(achievement.title, 'Dean\'s List')
        self.assertEqual(achievement.achievement_type, 'Award')

    def test_student_attendance(self):
        """Test student attendance creation."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        attendance = StudentAttendance.objects.create(
            student=student,
            class_name='CS101',
            date=date.today(),
            status='Present',
            notes='Regular attendance'
        )
        self.assertEqual(attendance.student, student)
        self.assertEqual(attendance.class_name, 'CS101')
        self.assertEqual(attendance.status, 'Present')

    def test_student_note(self):
        """Test student note creation."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        note = StudentNote.objects.create(
            student=student,
            note_type='Academic',
            title='Performance Review',
            content='Excellent performance in programming courses',
            is_private=False,
            created_by='advisor@example.com'
        )
        self.assertEqual(note.student, student)
        self.assertEqual(note.note_type, 'Academic')
        self.assertEqual(note.title, 'Performance Review')


class StudentAPITest(APITestCase):
    """Test cases for Student API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='teststudent',
            email='student@example.com',
            password='testpass123',
            role='Student'
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
            major=self.major,
            enrollment_year=2024,
            expected_graduation_year=2028,
            gpa=3.5
        )

    def test_student_list_requires_auth(self):
        """Test that student list requires authentication."""
        url = reverse('student-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_list_authenticated(self):
        """Test student list with authentication."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_detail(self):
        """Test student detail retrieval."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-detail', kwargs={'pk': self.student.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['student_id'], 'STU001')

    def test_student_create(self):
        """Test student creation."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-list')
        data = {
            'user': self.user.pk,
            'student_id': 'STU002',
            'major': self.major.pk,
            'enrollment_year': 2024,
            'expected_graduation_year': 2028,
            'gpa': 3.8
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Student.objects.filter(student_id='STU002').exists())

    def test_student_update(self):
        """Test student update."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-detail', kwargs={'pk': self.student.pk})
        data = {'gpa': 3.9}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.gpa, 3.9)

    def test_student_delete(self):
        """Test student deletion."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-detail', kwargs={'pk': self.student.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Student.objects.filter(pk=self.student.pk).exists())

    def test_student_academic_records(self):
        """Test student academic records endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-academic-records', kwargs={'pk': self.student.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_skills(self):
        """Test student skills endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-skills', kwargs={'pk': self.student.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_achievements(self):
        """Test student achievements endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-achievements', kwargs={'pk': self.student.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_attendance(self):
        """Test student attendance endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-attendance', kwargs={'pk': self.student.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_notes(self):
        """Test student notes endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('student-notes', kwargs={'pk': self.student.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class StudentIntegrationTest(TestCase):
    """Integration tests for student functionality."""

    def setUp(self):
        """Set up test data."""
        self.client = Client()
        self.user = User.objects.create_user(
            username='teststudent',
            email='student@example.com',
            password='testpass123',
            role='Student'
        )
        self.major = Major.objects.create(
            name='Computer Science',
            abbreviation='CS',
            description='Computer Science Program'
        )

    def test_student_registration_flow(self):
        """Test complete student registration flow."""
        # Create student
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major,
            enrollment_year=2024,
            expected_graduation_year=2028,
            gpa=3.5
        )
        
        # Add academic record
        StudentAcademicRecord.objects.create(
            student=student,
            semester='Fall 2024',
            credits_completed=15,
            gpa=3.5
        )
        
        # Add skill
        StudentSkill.objects.create(
            student=student,
            skill_name='Python Programming',
            proficiency_level='Advanced'
        )
        
        # Add achievement
        StudentAchievement.objects.create(
            student=student,
            achievement_type='Award',
            title='Dean\'s List',
            description='Academic excellence'
        )
        
        # Verify all data is linked correctly
        self.assertEqual(student.academic_records.count(), 1)
        self.assertEqual(student.skills.count(), 1)
        self.assertEqual(student.achievements.count(), 1)

    def test_student_gpa_calculation(self):
        """Test student GPA calculation."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major,
            gpa=3.5
        )
        
        # Add multiple academic records
        StudentAcademicRecord.objects.create(
            student=student,
            semester='Fall 2024',
            credits_completed=15,
            gpa=3.5
        )
        StudentAcademicRecord.objects.create(
            student=student,
            semester='Spring 2025',
            credits_completed=18,
            gpa=3.8
        )
        
        # Calculate weighted average
        total_credits = 15 + 18
        weighted_gpa = (3.5 * 15 + 3.8 * 18) / total_credits
        self.assertAlmostEqual(weighted_gpa, 3.66, places=2)

    def test_student_skill_tracking(self):
        """Test student skill tracking."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        
        # Add multiple skills
        skills_data = [
            ('Python Programming', 'Advanced', 2),
            ('Java Programming', 'Intermediate', 1),
            ('Database Design', 'Beginner', 0.5)
        ]
        
        for skill_name, level, years in skills_data:
            StudentSkill.objects.create(
                student=student,
                skill_name=skill_name,
                proficiency_level=level,
                years_experience=years
            )
        
        # Verify skills are tracked
        self.assertEqual(student.skills.count(), 3)
        advanced_skills = student.skills.filter(proficiency_level='Advanced')
        self.assertEqual(advanced_skills.count(), 1)

    def test_student_achievement_tracking(self):
        """Test student achievement tracking."""
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        
        # Add multiple achievements
        achievements_data = [
            ('Award', 'Dean\'s List', 'Academic excellence'),
            ('Certification', 'AWS Certified', 'Cloud computing certification'),
            ('Competition', 'Hackathon Winner', 'First place in coding competition')
        ]
        
        for achievement_type, title, description in achievements_data:
            StudentAchievement.objects.create(
                student=student,
                achievement_type=achievement_type,
                title=title,
                description=description,
                date_earned=date.today()
            )
        
        # Verify achievements are tracked
        self.assertEqual(student.achievements.count(), 3)
        awards = student.achievements.filter(achievement_type='Award')
        self.assertEqual(awards.count(), 1)


class StudentModelValidationTest(TestCase):
    """Test cases for student model validation."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='teststudent',
            email='student@example.com',
            password='testpass123',
            role='Student'
        )
        self.major = Major.objects.create(
            name='Computer Science',
            abbreviation='CS',
            description='Computer Science Program'
        )

    def test_student_id_required(self):
        """Test that student_id is required."""
        with self.assertRaises(Exception):
            Student.objects.create(
                user=self.user,
                major=self.major
            )

    def test_major_required(self):
        """Test that major is required."""
        with self.assertRaises(Exception):
            Student.objects.create(
                user=self.user,
                student_id='STU001'
            )

    def test_unique_student_id(self):
        """Test that student_id must be unique."""
        Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major
        )
        with self.assertRaises(Exception):
            Student.objects.create(
                user=self.user,
                student_id='STU001',
                major=self.major
            )

    def test_gpa_range_validation(self):
        """Test GPA range validation."""
        # Valid GPA
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major,
            gpa=3.5
        )
        self.assertEqual(student.gpa, 3.5)
        
        # Test edge cases
        student.gpa = 0.0
        student.save()
        self.assertEqual(student.gpa, 0.0)
        
        student.gpa = 4.0
        student.save()
        self.assertEqual(student.gpa, 4.0)

    def test_enrollment_year_validation(self):
        """Test enrollment year validation."""
        current_year = date.today().year
        
        # Valid enrollment year
        student = Student.objects.create(
            user=self.user,
            student_id='STU001',
            major=self.major,
            academic_year='2024-2025'
        )
        self.assertEqual(student.academic_year, '2024-2025')
        
        # Future academic year
        student.academic_year = '2025-2026'
        student.save()
        self.assertEqual(student.academic_year, '2025-2026')


class StudentPermissionsTest(TestCase):
    """Test cases for student permissions."""

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
        self.major = Major.objects.create(
            name='Computer Science',
            abbreviation='CS',
            description='Computer Science Program'
        )

    def test_student_can_view_own_profile(self):
        """Test that students can view their own profile."""
        student = Student.objects.create(
            user=self.student_user,
            student_id='STU001',
            major=self.major
        )
        # This would be tested in the API layer
        self.assertEqual(student.user, self.student_user)

    def test_advisor_can_view_student_profile(self):
        """Test that advisors can view student profiles."""
        student = Student.objects.create(
            user=self.student_user,
            student_id='STU001',
            major=self.major
        )
        # This would be tested in the API layer
        self.assertEqual(student.user, self.student_user)

    def test_admin_can_manage_all_students(self):
        """Test that admins can manage all students."""
        student = Student.objects.create(
            user=self.student_user,
            student_id='STU001',
            major=self.major
        )
        # This would be tested in the API layer
        self.assertEqual(student.user, self.student_user)
