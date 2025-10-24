#!/usr/bin/env python
"""
Fix API issues: 404 double slash and 500 authentication errors
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings_production')

def fix_api_issues():
    """Fix common API issues"""
    
    print("🔧 Fixing API Issues")
    print("=" * 50)
    
    try:
        # Setup Django
        django.setup()
        
        # Check URL patterns
        print("🔍 Checking URL patterns...")
        from django.urls import reverse
        from django.test import Client
        
        client = Client()
        
        # Test health endpoint
        try:
            response = client.get('/health/')
            print(f"✅ Health endpoint: {response.status_code}")
        except Exception as e:
            print(f"❌ Health endpoint failed: {e}")
        
        # Test API endpoints
        api_endpoints = [
            '/api/students/',
            '/api/auth/login/',
            '/api/docs/',
        ]
        
        for endpoint in api_endpoints:
            try:
                response = client.get(endpoint)
                print(f"✅ {endpoint}: {response.status_code}")
            except Exception as e:
                print(f"❌ {endpoint} failed: {e}")
        
        # Check authentication
        print("\n🔍 Checking authentication...")
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Check if admin user exists
        admin_user = User.objects.filter(username='admin').first()
        if admin_user:
            print("✅ Admin user exists")
            print(f"   - Username: {admin_user.username}")
            print(f"   - Email: {admin_user.email}")
            print(f"   - Is staff: {admin_user.is_staff}")
            print(f"   - Is superuser: {admin_user.is_superuser}")
        else:
            print("❌ Admin user not found")
            print("   Creating admin user...")
            try:
                admin_user = User.objects.create_superuser(
                    username='admin',
                    email='admin@eduinfo.online',
                    password='admin123'
                )
                print("✅ Admin user created: admin/admin123")
            except Exception as e:
                print(f"❌ Failed to create admin user: {e}")
        
        # Test JWT authentication
        print("\n🔍 Testing JWT authentication...")
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            if admin_user:
                refresh = RefreshToken.for_user(admin_user)
                access_token = refresh.access_token
                print("✅ JWT token generation works")
                print(f"   - Access token: {str(access_token)[:50]}...")
        except Exception as e:
            print(f"❌ JWT authentication failed: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing API issues: {e}")
        return False

def create_api_test_script():
    """Create API test script"""
    
    test_script = """#!/usr/bin/env python
# API Test Script for Render
import requests
import json

BASE_URL = 'https://eduinfo.online'

def test_api():
    print("🧪 Testing API endpoints...")
    
    # Test health
    try:
        response = requests.get(f'{BASE_URL}/health/')
        print(f"Health: {response.status_code}")
    except Exception as e:
        print(f"Health failed: {e}")
    
    # Test login
    try:
        login_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        response = requests.post(f'{BASE_URL}/api/auth/login/', json=login_data)
        print(f"Login: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Access token: {data.get('access', 'N/A')[:50]}...")
    except Exception as e:
        print(f"Login failed: {e}")
    
    # Test students endpoint
    try:
        response = requests.get(f'{BASE_URL}/api/students/')
        print(f"Students: {response.status_code}")
    except Exception as e:
        print(f"Students failed: {e}")

if __name__ == '__main__':
    test_api()
"""
    
    with open(os.path.join(backend_dir, 'test_api.py'), 'w') as f:
        f.write(test_script)
    
    print("✅ Created test_api.py script")

if __name__ == '__main__':
    print("🔧 BM23 API Issues Fix Tool")
    print("=" * 50)
    
    # Fix API issues
    success = fix_api_issues()
    
    if success:
        # Create test script
        create_api_test_script()
        
        print("\n📋 Next steps:")
        print("1. Check Render logs for any remaining errors")
        print("2. Test endpoints manually:")
        print("   - https://eduinfo.online/health/")
        print("   - https://eduinfo.online/api/docs/")
        print("   - https://eduinfo.online/api/students/")
        print("3. Test login with: admin/admin123")
        print("\n🎉 API issues fix completed!")
    else:
        print("\n💥 Fix failed! Check the errors above.")
        sys.exit(1)
