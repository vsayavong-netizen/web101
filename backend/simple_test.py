#!/usr/bin/env python
"""
Simple API test script
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
import json

User = get_user_model()

def test_simple():
    """Simple API test"""
    print("Simple API Test")
    print("=" * 40)
    
    client = Client()
    
    # Test basic endpoints
    endpoints = [
        '/api/auth/',
        '/api/projects/',
        '/api/majors/',
        '/api/classrooms/',
        '/api/milestones/',
        '/api/scoring/',
        '/api/notifications/',
        '/api/ai/',
        '/api/analytics/',
        '/api/settings/',
        '/api/reports/',
        '/api/committees/',
    ]
    
    print("\nTesting API Endpoints:")
    print("-" * 30)
    
    for endpoint in endpoints:
        try:
            response = client.get(endpoint)
            status = "OK" if response.status_code in [200, 301, 302, 401, 404] else "FAIL"
            print(f"{status} {endpoint:25} Status: {response.status_code}")
        except Exception as e:
            print(f"FAIL {endpoint:25} Error: {str(e)[:30]}")
    
    # Test creating a user
    print("\nTesting User Creation:")
    print("-" * 30)
    
    try:
        user, created = User.objects.get_or_create(
            username='testuser2',
            defaults={
                'email': 'test2@example.com',
                'first_name': 'Test',
                'last_name': 'User2',
                'role': 'Admin'
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            print("OK User created successfully")
        else:
            print("OK User already exists")
    except Exception as e:
        print(f"FAIL User creation error: {e}")
    
    # Test database models
    print("\nTesting Database Models:")
    print("-" * 30)
    
    try:
        from majors.models import Major
        major_count = Major.objects.count()
        print(f"OK Major model accessible, count: {major_count}")
    except Exception as e:
        print(f"FAIL Major model error: {e}")
    
    try:
        from classrooms.models import Classroom
        classroom_count = Classroom.objects.count()
        print(f"OK Classroom model accessible, count: {classroom_count}")
    except Exception as e:
        print(f"FAIL Classroom model error: {e}")
    
    try:
        from milestones.models import MilestoneTemplate
        template_count = MilestoneTemplate.objects.count()
        print(f"OK MilestoneTemplate model accessible, count: {template_count}")
    except Exception as e:
        print(f"FAIL MilestoneTemplate model error: {e}")
    
    try:
        from scoring.models import ScoringCriteria
        criteria_count = ScoringCriteria.objects.count()
        print(f"OK ScoringCriteria model accessible, count: {criteria_count}")
    except Exception as e:
        print(f"FAIL ScoringCriteria model error: {e}")
    
    print("\n" + "=" * 40)
    print("Simple API Test Complete!")

if __name__ == '__main__':
    test_simple()
