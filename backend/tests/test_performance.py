"""
Performance tests for the Final Project Management System
"""

from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import override_settings
import time
import json

from ..models import User, Student, Advisor, Project, ProjectGroup
from ..models.majors import Major
from ..models.classrooms import Classroom

User = get_user_model()


class PerformanceTestCase(APITestCase):
    """
    Test cases for performance optimization
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
            name='Dr. John Advisor',
            academic_year='2024'
        )
    
    def test_database_query_optimization(self):
        """Test database query optimization"""
        # Create multiple students
        students = []
        for i in range(100):
            user = User.objects.create_user(
                username=f'student{i}',
                email=f'student{i}@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            )
            
            student = Student.objects.create(
                user=user,
                student_id=f'155N{i:03d}/24',
                name=f'Student{i}',
                surname='Test',
                major=self.major,
                classroom=self.classroom,
                academic_year='2024'
            )
            students.append(student)
        
        # Test query count for student list
        with self.assertNumQueries(3):  # Should use select_related and prefetch_related
            self.client.force_authenticate(user=self.admin_user)
            url = reverse('users:students-list')
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data['results']), 100)
    
    def test_pagination_performance(self):
        """Test pagination performance"""
        # Create multiple projects
        projects = []
        for i in range(1000):
            project = Project.objects.create(
                project_id=f'P24{i:03d}',
                topic_lao=f'ໂຄງການທົດສອບ {i}',
                topic_eng=f'Test Project {i}',
                advisor_name='Dr. John Advisor',
                advisor=self.advisor,
                academic_year='2024'
            )
            projects.append(project)
        
        # Test pagination performance
        start_time = time.time()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-list')
        
        # Test first page
        response = self.client.get(url, {'page': 1, 'page_size': 20})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 20)
        
        # Test last page
        response = self.client.get(url, {'page': 50, 'page_size': 20})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 20)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(execution_time, 5.0)  # 5 seconds max
    
    def test_search_performance(self):
        """Test search performance"""
        # Create multiple projects with different topics
        projects = []
        for i in range(500):
            project = Project.objects.create(
                project_id=f'P24{i:03d}',
                topic_lao=f'ໂຄງການທົດສອບ {i}',
                topic_eng=f'Test Project {i}',
                advisor_name='Dr. John Advisor',
                advisor=self.advisor,
                academic_year='2024'
            )
            projects.append(project)
        
        # Test search performance
        start_time = time.time()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-search')
        
        # Test search by topic
        response = self.client.get(url, {'query': 'Test Project 100'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)
        
        # Test search by status
        response = self.client.get(url, {'status': 'Pending'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 500)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(execution_time, 3.0)  # 3 seconds max
    
    def test_bulk_operations_performance(self):
        """Test bulk operations performance"""
        # Create multiple students
        students = []
        for i in range(100):
            user = User.objects.create_user(
                username=f'student{i}',
                email=f'student{i}@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            )
            
            student = Student.objects.create(
                user=user,
                student_id=f'155N{i:03d}/24',
                name=f'Student{i}',
                surname='Test',
                major=self.major,
                classroom=self.classroom,
                academic_year='2024'
            )
            students.append(student)
        
        # Test bulk update performance
        start_time = time.time()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-bulk-update')
        
        student_ids = [f'155N{i:03d}/24' for i in range(100)]
        data = {
            'student_ids': student_ids,
            'updates': {
                'status': 'Approved'
            }
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(execution_time, 2.0)  # 2 seconds max
        
        # Verify all students are updated
        for student in students:
            student.refresh_from_db()
            self.assertEqual(student.status, 'Approved')
    
    def test_statistics_performance(self):
        """Test statistics calculation performance"""
        # Create test data
        for i in range(100):
            user = User.objects.create_user(
                username=f'student{i}',
                email=f'student{i}@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            )
            
            Student.objects.create(
                user=user,
                student_id=f'155N{i:03d}/24',
                name=f'Student{i}',
                surname='Test',
                major=self.major,
                classroom=self.classroom,
                academic_year='2024'
            )
        
        for i in range(50):
            Project.objects.create(
                project_id=f'P24{i:03d}',
                topic_lao=f'ໂຄງການທົດສອບ {i}',
                topic_eng=f'Test Project {i}',
                advisor_name='Dr. John Advisor',
                advisor=self.advisor,
                academic_year='2024'
            )
        
        # Test statistics performance
        start_time = time.time()
        
        self.client.force_authenticate(user=self.admin_user)
        
        # Test user statistics
        url = reverse('users:users-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test student statistics
        url = reverse('users:students-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test project statistics
        url = reverse('projects:projects-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(execution_time, 2.0)  # 2 seconds max
    
    def test_memory_usage(self):
        """Test memory usage for large datasets"""
        # Create large dataset
        students = []
        for i in range(1000):
            user = User.objects.create_user(
                username=f'student{i}',
                email=f'student{i}@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            )
            
            student = Student.objects.create(
                user=user,
                student_id=f'155N{i:03d}/24',
                name=f'Student{i}',
                surname='Test',
                major=self.major,
                classroom=self.classroom,
                academic_year='2024'
            )
            students.append(student)
        
        # Test memory usage
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        memory_before = process.memory_info().rss / 1024 / 1024  # MB
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('users:students-list')
        
        # Get all students with pagination
        response = self.client.get(url, {'page_size': 100})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        memory_after = process.memory_info().rss / 1024 / 1024  # MB
        memory_used = memory_after - memory_before
        
        # Memory usage should be reasonable
        self.assertLess(memory_used, 100)  # 100 MB max
    
    def test_concurrent_requests(self):
        """Test concurrent request handling"""
        import threading
        import queue
        
        # Create test data
        for i in range(10):
            user = User.objects.create_user(
                username=f'student{i}',
                email=f'student{i}@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            )
            
            Student.objects.create(
                user=user,
                student_id=f'155N{i:03d}/24',
                name=f'Student{i}',
                surname='Test',
                major=self.major,
                classroom=self.classroom,
                academic_year='2024'
            )
        
        # Test concurrent requests
        results = queue.Queue()
        
        def make_request():
            self.client.force_authenticate(user=self.admin_user)
            url = reverse('users:students-list')
            response = self.client.get(url)
            results.put(response.status_code)
        
        # Create multiple threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check results
        status_codes = []
        while not results.empty():
            status_codes.append(results.get())
        
        # All requests should succeed
        self.assertEqual(len(status_codes), 10)
        for status_code in status_codes:
            self.assertEqual(status_code, status.HTTP_200_OK)
    
    def test_database_connection_pooling(self):
        """Test database connection pooling"""
        # Test multiple database operations
        start_time = time.time()
        
        for i in range(100):
            user = User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@example.com',
                password='userpass123',
                role='student',
                academic_year='2024'
            )
            
            # Test database connection reuse
            user.refresh_from_db()
            self.assertEqual(user.username, f'user{i}')
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(execution_time, 5.0)  # 5 seconds max
    
    def test_caching_performance(self):
        """Test caching performance"""
        # Create test data
        for i in range(100):
            Project.objects.create(
                project_id=f'P24{i:03d}',
                topic_lao=f'ໂຄງການທົດສອບ {i}',
                topic_eng=f'Test Project {i}',
                advisor_name='Dr. John Advisor',
                advisor=self.advisor,
                academic_year='2024'
            )
        
        # Test caching performance
        start_time = time.time()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-list')
        
        # Make multiple requests to test caching
        for i in range(10):
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(execution_time, 3.0)  # 3 seconds max
    
    def test_api_response_size(self):
        """Test API response size optimization"""
        # Create test data
        for i in range(100):
            Project.objects.create(
                project_id=f'P24{i:03d}',
                topic_lao=f'ໂຄງການທົດສອບ {i}',
                topic_eng=f'Test Project {i}',
                advisor_name='Dr. John Advisor',
                advisor=self.advisor,
                academic_year='2024'
            )
        
        # Test response size
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-list')
        
        response = self.client.get(url, {'page_size': 20})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check response size
        response_size = len(json.dumps(response.data))
        
        # Response size should be reasonable
        self.assertLess(response_size, 100000)  # 100 KB max
    
    def test_database_index_performance(self):
        """Test database index performance"""
        # Create test data with different academic years
        for year in ['2022', '2023', '2024']:
            for i in range(50):
                Project.objects.create(
                    project_id=f'P{year[-2:]}{i:03d}',
                    topic_lao=f'ໂຄງການທົດສອບ {i}',
                    topic_eng=f'Test Project {i}',
                    advisor_name='Dr. John Advisor',
                    advisor=self.advisor,
                    academic_year=year
                )
        
        # Test index performance
        start_time = time.time()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-list')
        
        # Test filtering by academic year (should use index)
        response = self.client.get(url, {'academic_year': '2024'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 50)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(execution_time, 1.0)  # 1 second max
    
    def test_orm_optimization(self):
        """Test ORM optimization"""
        # Create test data with relationships
        for i in range(50):
            user = User.objects.create_user(
                username=f'student{i}',
                email=f'student{i}@example.com',
                password='studentpass123',
                role='student',
                academic_year='2024'
            )
            
            student = Student.objects.create(
                user=user,
                student_id=f'155N{i:03d}/24',
                name=f'Student{i}',
                surname='Test',
                major=self.major,
                classroom=self.classroom,
                academic_year='2024'
            )
            
            project = Project.objects.create(
                project_id=f'P24{i:03d}',
                topic_lao=f'ໂຄງການທົດສອບ {i}',
                topic_eng=f'Test Project {i}',
                advisor_name='Dr. John Advisor',
                advisor=self.advisor,
                academic_year='2024'
            )
            
            project_group = ProjectGroup.objects.create(
                project=project,
                academic_year='2024'
            )
            project_group.students.add(student)
        
        # Test ORM optimization
        start_time = time.time()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('projects:projects-list')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Should complete within reasonable time
        self.assertLess(execution_time, 2.0)  # 2 seconds max
        
        # Check that relationships are properly loaded
        for project_data in response.data['results']:
            self.assertIn('student_names', project_data)
            self.assertIn('student_count', project_data)
            self.assertIn('committee_member_names', project_data)
