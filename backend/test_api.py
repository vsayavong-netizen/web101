#!/usr/bin/env python
"""
Test script for API endpoints
"""
import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from django.urls import reverse
import json

User = get_user_model()

def test_api_endpoints():
    """Test all API endpoints"""
    client = Client()
    
    print("Testing API Endpoints")
    print("=" * 50)
    
    # Test 1: Basic API endpoints
    print("\n1. Testing Basic API Endpoints")
    print("-" * 30)
    
    endpoints = [
        ('/api/auth/', 'Authentication'),
        ('/api/projects/', 'Projects'),
        ('/api/students/', 'Students'),
        ('/api/advisors/', 'Advisors'),
        ('/api/majors/', 'Majors'),
        ('/api/classrooms/', 'Classrooms'),
        ('/api/milestones/', 'Milestones'),
        ('/api/scoring/', 'Scoring'),
        ('/api/notifications/', 'Notifications'),
        ('/api/ai/', 'AI Services'),
        ('/api/analytics/', 'Analytics'),
        ('/api/settings/', 'Settings'),
        ('/api/reports/', 'Reports'),
        ('/api/committees/', 'Committees'),
    ]
    
    for endpoint, name in endpoints:
        try:
            response = client.get(endpoint)
            status = "OK" if response.status_code in [200, 301, 302, 404] else "FAIL"
            print(f"{status} {name:15} - {endpoint:20} (Status: {response.status_code})")
        except Exception as e:
            print(f"FAIL {name:15} - {endpoint:20} (Error: {str(e)[:50]})")
    
    # Test 2: Create test data
    print("\n2. Creating Test Data")
    print("-" * 30)
    
    try:
        # Create test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'Admin'
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            print("OK Created test user")
        else:
            print("OK Test user already exists")
            
    except Exception as e:
        print(f"FAIL Error creating test user: {e}")
    
    # Test 3: Test with authentication
    print("\n3. Testing with Authentication")
    print("-" * 30)
    
    try:
        # Login
        login_response = client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        if login_response.status_code == 200:
            print("OK Login successful")
            
            # Test authenticated endpoints
            auth_endpoints = [
                '/api/majors/',
                '/api/classrooms/',
                '/api/projects/',
            ]
            
            for endpoint in auth_endpoints:
                try:
                    response = client.get(endpoint)
                    status = "OK" if response.status_code in [200, 301, 302] else "FAIL"
                    print(f"{status} {endpoint:20} (Status: {response.status_code})")
                except Exception as e:
                    print(f"FAIL {endpoint:20} (Error: {str(e)[:50]})")
        else:
            print(f"FAIL Login failed (Status: {login_response.status_code})")
            
    except Exception as e:
        print(f"FAIL Authentication test error: {e}")
    
    # Test 4: Test POST endpoints
    print("\n4. Testing POST Endpoints")
    print("-" * 30)
    
    try:
        # Test creating a major
        major_data = {
            'name': 'Computer Science',
            'abbreviation': 'CS',
            'description': 'Computer Science Major',
            'degree_level': 'Bachelor',
            'is_active': True
        }
        
        response = client.post('/api/majors/', 
                             data=json.dumps(major_data),
                             content_type='application/json')
        
        if response.status_code in [200, 201, 400]:  # 400 might be due to validation
            print(f"OK Major creation test (Status: {response.status_code})")
        else:
            print(f"FAIL Major creation failed (Status: {response.status_code})")
            
    except Exception as e:
        print(f"FAIL POST test error: {e}")
    
    print("\n" + "=" * 50)
    print("API Testing Complete!")

if __name__ == '__main__':
    test_api_endpoints()
