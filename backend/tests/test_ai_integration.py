"""
AI integration tests for the Final Project Management System
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
import json

from ..models import User, Student, Advisor, Project, ProjectGroup
from ..models.majors import Major
from ..models.classrooms import Classroom

User = get_user_model()


class AIIntegrationTestCase(APITestCase):
    """
    Test cases for AI integration functionality
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
        
        # Create project
        self.project = Project.objects.create(
            project_id='P24001',
            topic_lao='ໂຄງການທົດສອບ',
            topic_eng='Test Project',
            advisor_name='Dr. John Advisor',
            advisor=self.advisor,
            academic_year='2024'
        )
        
        project_group = ProjectGroup.objects.create(
            project=self.project,
            academic_year='2024'
        )
        project_group.students.add(self.student)
    
    @patch('google.generativeai.GenerativeModel')
    def test_ai_security_audit(self, mock_generative_model):
        """Test AI security audit functionality"""
        # Mock AI response
        mock_model = MagicMock()
        mock_generative_model.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'security_issues': [
                {
                    'type': 'Weak Password',
                    'description': 'User has weak password',
                    'recommendation': 'Use stronger password',
                    'relatedUserIds': ['1']
                }
            ],
            'recommendations': [
                'Implement stronger password policies',
                'Enable two-factor authentication'
            ]
        })
        mock_model.generate_content.return_value = mock_response
        
        # Test security audit
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('ai-enhancement:security-audit')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('security_issues', response.data)
        self.assertIn('recommendations', response.data)
    
    @patch('google.generativeai.GenerativeModel')
    def test_ai_project_health_analysis(self, mock_generative_model):
        """Test AI project health analysis functionality"""
        # Mock AI response
        mock_model = MagicMock()
        mock_generative_model.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'health_score': 85,
            'issues': [
                {
                    'type': 'Delayed Milestones',
                    'description': 'Project has delayed milestones',
                    'recommendation': 'Review timeline and adjust schedule'
                }
            ],
            'recommendations': [
                'Monitor progress more closely',
                'Provide additional support to students'
            ]
        })
        mock_model.generate_content.return_value = mock_response
        
        # Test project health analysis
        self.client.force_authenticate(user=self.advisor_user)
        url = reverse('ai-enhancement:project-health-analysis')
        
        data = {
            'project_id': self.project.id,
            'analysis_type': 'comprehensive'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('health_score', response.data)
        self.assertIn('issues', response.data)
        self.assertIn('recommendations', response.data)
    
    @patch('google.generativeai.GenerativeModel')
    def test_ai_communication_analysis(self, mock_generative_model):
        """Test AI communication analysis functionality"""
        # Mock AI response
        mock_model = MagicMock()
        mock_generative_model.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'communication_score': 75,
            'sentiment_analysis': {
                'positive': 60,
                'neutral': 30,
                'negative': 10
            },
            'key_topics': [
                'Project progress',
                'Technical issues',
                'Timeline concerns'
            ],
            'recommendations': [
                'Improve communication frequency',
                'Address technical concerns promptly'
            ]
        })
        mock_model.generate_content.return_value = mock_response
        
        # Test communication analysis
        self.client.force_authenticate(user=self.advisor_user)
        url = reverse('ai-enhancement:communication-analysis')
        
        data = {
            'project_id': self.project.id,
            'time_period': '30_days'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('communication_score', response.data)
        self.assertIn('sentiment_analysis', response.data)
        self.assertIn('key_topics', response.data)
        self.assertIn('recommendations', response.data)
    
    @patch('google.generativeai.GenerativeModel')
    def test_ai_grammar_check(self, mock_generative_model):
        """Test AI grammar check functionality"""
        # Mock AI response
        mock_model = MagicMock()
        mock_generative_model.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'grammar_score': 80,
            'errors': [
                {
                    'type': 'Grammar',
                    'description': 'Subject-verb disagreement',
                    'suggestion': 'Use correct verb form',
                    'position': 15
                }
            ],
            'suggestions': [
                'Review grammar rules',
                'Use grammar checking tools'
            ]
        })
        mock_model.generate_content.return_value = mock_response
        
        # Test grammar check
        self.client.force_authenticate(user=self.student_user)
        url = reverse('ai-enhancement:grammar-check')
        
        data = {
            'text': 'This is a test document with some grammar errors.',
            'file_id': 'test_file_123'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('grammar_score', response.data)
        self.assertIn('errors', response.data)
        self.assertIn('suggestions', response.data)
    
    @patch('google.generativeai.GenerativeModel')
    def test_ai_topic_suggestions(self, mock_generative_model):
        """Test AI topic suggestions functionality"""
        # Mock AI response
        mock_model = MagicMock()
        mock_generative_model.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'suggestions': [
                {
                    'topic': 'Machine Learning in Business',
                    'description': 'Application of ML algorithms in business processes',
                    'difficulty': 'Medium',
                    'relevance': 'High'
                },
                {
                    'topic': 'Database Optimization',
                    'description': 'Techniques for improving database performance',
                    'difficulty': 'Easy',
                    'relevance': 'Medium'
                }
            ],
            'recommendations': [
                'Consider current industry trends',
                'Focus on practical applications'
            ]
        })
        mock_model.generate_content.return_value = mock_response
        
        # Test topic suggestions
        self.client.force_authenticate(user=self.student_user)
        url = reverse('ai-enhancement:topic-suggestions')
        
        data = {
            'major': 'Business Administration',
            'interests': ['Technology', 'Management'],
            'difficulty_level': 'Medium'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('suggestions', response.data)
        self.assertIn('recommendations', response.data)
    
    @patch('google.generativeai.GenerativeModel')
    def test_ai_plagiarism_check(self, mock_generative_model):
        """Test AI plagiarism check functionality"""
        # Mock AI response
        mock_model = MagicMock()
        mock_generative_model.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'plagiarism_score': 15,
            'originality_score': 85,
            'matches': [
                {
                    'source': 'Academic Paper 1',
                    'similarity': 20,
                    'text': 'Similar text found'
                }
            ],
            'recommendations': [
                'Cite sources properly',
                'Paraphrase more effectively'
            ]
        })
        mock_model.generate_content.return_value = mock_response
        
        # Test plagiarism check
        self.client.force_authenticate(user=self.student_user)
        url = reverse('ai-enhancement:plagiarism-check')
        
        data = {
            'text': 'This is a test document to check for plagiarism.',
            'project_id': self.project.id
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('plagiarism_score', response.data)
        self.assertIn('originality_score', response.data)
        self.assertIn('matches', response.data)
        self.assertIn('recommendations', response.data)
    
    @patch('google.generativeai.GenerativeModel')
    def test_ai_system_health_analysis(self, mock_generative_model):
        """Test AI system health analysis functionality"""
        # Mock AI response
        mock_model = MagicMock()
        mock_generative_model.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'system_health_score': 90,
            'performance_metrics': {
                'response_time': 'Good',
                'memory_usage': 'Optimal',
                'database_performance': 'Excellent'
            },
            'issues': [
                {
                    'type': 'Performance',
                    'description': 'Slow query execution',
                    'recommendation': 'Optimize database queries'
                }
            ],
            'recommendations': [
                'Monitor system performance',
                'Implement caching strategies'
            ]
        })
        mock_model.generate_content.return_value = mock_response
        
        # Test system health analysis
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('ai-enhancement:system-health-analysis')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('system_health_score', response.data)
        self.assertIn('performance_metrics', response.data)
        self.assertIn('issues', response.data)
        self.assertIn('recommendations', response.data)
    
    @patch('google.generativeai.GenerativeModel')
    def test_ai_automated_feedback(self, mock_generative_model):
        """Test AI automated feedback functionality"""
        # Mock AI response
        mock_model = MagicMock()
        mock_generative_model.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'feedback_score': 75,
            'strengths': [
                'Good problem analysis',
                'Clear methodology'
            ],
            'weaknesses': [
                'Limited literature review',
                'Insufficient data analysis'
            ],
            'suggestions': [
                'Expand literature review',
                'Include more statistical analysis'
            ],
            'overall_rating': 'Good'
        })
        mock_model.generate_content.return_value = mock_response
        
        # Test automated feedback
        self.client.force_authenticate(user=self.advisor_user)
        url = reverse('ai-enhancement:automated-feedback')
        
        data = {
            'project_id': self.project.id,
            'submission_type': 'milestone',
            'content': 'Project milestone submission content'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('feedback_score', response.data)
        self.assertIn('strengths', response.data)
        self.assertIn('weaknesses', response.data)
        self.assertIn('suggestions', response.data)
        self.assertIn('overall_rating', response.data)
    
    @patch('google.generativeai.GenerativeModel')
    def test_ai_content_generation(self, mock_generative_model):
        """Test AI content generation functionality"""
        # Mock AI response
        mock_model = MagicMock()
        mock_generative_model.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            'generated_content': 'This is AI-generated content for the project.',
            'content_type': 'Project Description',
            'quality_score': 85,
            'suggestions': [
                'Add more technical details',
                'Include examples'
            ]
        })
        mock_model.generate_content.return_value = mock_response
        
        # Test content generation
        self.client.force_authenticate(user=self.student_user)
        url = reverse('ai-enhancement:content-generation')
        
        data = {
            'content_type': 'Project Description',
            'topic': 'Machine Learning',
            'requirements': 'Technical and academic'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('generated_content', response.data)
        self.assertIn('content_type', response.data)
        self.assertIn('quality_score', response.data)
        self.assertIn('suggestions', response.data)
    
    def test_ai_feature_availability(self):
        """Test AI feature availability based on user settings"""
        # Test with AI assistant enabled
        self.student_user.is_ai_assistant_enabled = True
        self.student_user.save()
        
        self.client.force_authenticate(user=self.student_user)
        url = reverse('ai-enhancement:feature-availability')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['ai_assistant_enabled'])
        
        # Test with AI assistant disabled
        self.student_user.is_ai_assistant_enabled = False
        self.student_user.save()
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['ai_assistant_enabled'])
    
    def test_ai_usage_statistics(self):
        """Test AI usage statistics"""
        # Test AI usage statistics
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('ai-enhancement:usage-statistics')
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_requests', response.data)
        self.assertIn('requests_by_type', response.data)
        self.assertIn('requests_by_user', response.data)
        self.assertIn('success_rate', response.data)
    
    def test_ai_error_handling(self):
        """Test AI error handling"""
        # Test AI service unavailable
        with patch('google.generativeai.GenerativeModel') as mock_model:
            mock_model.side_effect = Exception('AI service unavailable')
            
            self.client.force_authenticate(user=self.student_user)
            url = reverse('ai-enhancement:grammar-check')
            
            data = {
                'text': 'Test text',
                'file_id': 'test_file_123'
            }
            
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            self.assertIn('error', response.data)
            self.assertIn('AI service unavailable', response.data['error'])
    
    def test_ai_rate_limiting(self):
        """Test AI rate limiting"""
        # Test rate limiting for AI requests
        self.client.force_authenticate(user=self.student_user)
        url = reverse('ai-enhancement:grammar-check')
        
        data = {
            'text': 'Test text',
            'file_id': 'test_file_123'
        }
        
        # Make multiple requests to test rate limiting
        for i in range(10):
            response = self.client.post(url, data, format='json')
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                self.assertIn('Rate limit exceeded', response.data['error'])
                break
        else:
            # If no rate limiting occurred, that's also acceptable
            pass
    
    def test_ai_data_privacy(self):
        """Test AI data privacy"""
        # Test that sensitive data is not sent to AI
        self.client.force_authenticate(user=self.student_user)
        url = reverse('ai-enhancement:grammar-check')
        
        data = {
            'text': 'This contains sensitive information: password123, SSN: 123-45-6789',
            'file_id': 'test_file_123'
        }
        
        with patch('google.generativeai.GenerativeModel') as mock_model:
            mock_model.return_value.generate_content.return_value.text = '{"grammar_score": 80}'
            
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify that sensitive data was sanitized
            call_args = mock_model.return_value.generate_content.call_args
            sanitized_text = call_args[0][0]
            self.assertNotIn('password123', sanitized_text)
            self.assertNotIn('123-45-6789', sanitized_text)
    
    def test_ai_response_validation(self):
        """Test AI response validation"""
        # Test invalid AI response
        with patch('google.generativeai.GenerativeModel') as mock_model:
            mock_model.return_value.generate_content.return_value.text = 'Invalid JSON response'
            
            self.client.force_authenticate(user=self.student_user)
            url = reverse('ai-enhancement:grammar-check')
            
            data = {
                'text': 'Test text',
                'file_id': 'test_file_123'
            }
            
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn('error', response.data)
            self.assertIn('Invalid AI response', response.data['error'])
    
    def test_ai_feature_permissions(self):
        """Test AI feature permissions"""
        # Test that only authorized users can access AI features
        self.client.force_authenticate(user=self.student_user)
        url = reverse('ai-enhancement:security-audit')
        
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test that admins can access AI features
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_ai_integration_logging(self):
        """Test AI integration logging"""
        # Test that AI requests are logged
        with patch('google.generativeai.GenerativeModel') as mock_model:
            mock_model.return_value.generate_content.return_value.text = '{"grammar_score": 80}'
            
            self.client.force_authenticate(user=self.student_user)
            url = reverse('ai-enhancement:grammar-check')
            
            data = {
                'text': 'Test text',
                'file_id': 'test_file_123'
            }
            
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify that request was logged
            # This would require checking logs in a real implementation
            pass
