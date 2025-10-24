#!/usr/bin/env python3
"""
Fix API endpoints 500 errors
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.contrib.auth import get_user_model
from django.db import connection

User = get_user_model()

def test_students_endpoint():
    """Test students endpoint"""
    try:
        from students.views import StudentListView
        from django.test import RequestFactory
        
        factory = RequestFactory()
        request = factory.get('/api/students/')
        request.user = User.objects.first()
        
        view = StudentListView()
        view.setup(request)
        
        # Test the view
        response = view.get(request)
        print(f"✅ Students endpoint test passed: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Students endpoint test failed: {e}")
        return False

def test_auth_endpoint():
    """Test auth endpoint"""
    try:
        from authentication.views import CustomTokenObtainPairView
        from django.test import RequestFactory
        
        factory = RequestFactory()
        request = factory.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'admin123'
        }, content_type='application/json')
        
        view = CustomTokenObtainPairView()
        view.setup(request)
        
        # Test the view
        response = view.post(request)
        print(f"✅ Auth endpoint test passed: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Auth endpoint test failed: {e}")
        return False

def check_imports():
    """Check if all required imports are working"""
    try:
        # Test students app imports
        from students import models, views, serializers
        print("✅ Students app imports working")
        
        # Test authentication app imports
        from authentication import views, serializers
        print("✅ Authentication app imports working")
        
        # Test accounts app imports
        from accounts import models, views, serializers
        print("✅ Accounts app imports working")
        
        return True
    except Exception as e:
        print(f"❌ Import check failed: {e}")
        return False

def check_models():
    """Check if models are working"""
    try:
        # Test User model
        user_count = User.objects.count()
        print(f"✅ User model working - {user_count} users")
        
        # Test Student model
        from students.models import Student
        student_count = Student.objects.count()
        print(f"✅ Student model working - {student_count} students")
        
        return True
    except Exception as e:
        print(f"❌ Model check failed: {e}")
        return False

def check_serializers():
    """Check if serializers are working"""
    try:
        from students.serializers import StudentSerializer
        from authentication.serializers import CustomTokenObtainPairSerializer
        
        # Test student serializer
        student_data = {
            'student_id': '155N0001/24',
            'first_name': 'Test',
            'last_name': 'Student',
            'email': 'test@example.com'
        }
        serializer = StudentSerializer(data=student_data)
        print("✅ Student serializer working")
        
        # Test auth serializer
        auth_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        auth_serializer = CustomTokenObtainPairSerializer(data=auth_data)
        print("✅ Auth serializer working")
        
        return True
    except Exception as e:
        print(f"❌ Serializer check failed: {e}")
        return False

def check_urls():
    """Check if URLs are properly configured"""
    try:
        from django.urls import reverse
        from django.test import Client
        
        client = Client()
        
        # Test URL resolution
        try:
            url = reverse('student-list')
            print(f"✅ Student list URL: {url}")
        except Exception as e:
            print(f"⚠️  Student list URL not found: {e}")
        
        try:
            url = reverse('token_obtain_pair')
            print(f"✅ Auth login URL: {url}")
        except Exception as e:
            print(f"⚠️  Auth login URL not found: {e}")
        
        return True
    except Exception as e:
        print(f"❌ URL check failed: {e}")
        return False

def run_collectstatic():
    """Run collectstatic command"""
    try:
        print("Running collectstatic...")
        execute_from_command_line(['manage.py', 'collectstatic', '--noinput'])
        print("✅ Collectstatic completed")
        return True
    except Exception as e:
        print(f"❌ Collectstatic failed: {e}")
        return False

def main():
    """Main function to fix API endpoints"""
    print("🔧 Fixing API endpoints 500 errors...")
    print("=" * 50)
    
    # Check imports
    if not check_imports():
        print("❌ Cannot proceed with import errors")
        return False
    
    # Check models
    if not check_models():
        print("❌ Cannot proceed with model errors")
        return False
    
    # Check serializers
    if not check_serializers():
        print("❌ Cannot proceed with serializer errors")
        return False
    
    # Check URLs
    check_urls()
    
    # Run collectstatic
    run_collectstatic()
    
    # Test endpoints
    test_students_endpoint()
    test_auth_endpoint()
    
    print("\n✅ API endpoints fix completed!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
