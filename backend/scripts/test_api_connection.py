"""
Test Script for Frontend-Backend API Connection
"""

import os
import sys
import django
from pathlib import Path

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


def test_api_connection():
    """Test API connection and authentication"""
    
    base_url = getattr(settings, 'API_BASE_URL', 'http://localhost:8000')
    
    print("=" * 60)
    print("API Connection Test")
    print("=" * 60)
    print(f"Base URL: {base_url}")
    print()
    
    # Test 1: Health Check
    print("Test 1: Health Check")
    try:
        response = requests.get(f"{base_url}/health/", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
    print()
    
    # Test 2: API Schema
    print("Test 2: API Schema")
    try:
        response = requests.get(f"{base_url}/api/schema/", timeout=5)
        if response.status_code == 200:
            print("✅ API schema accessible")
        else:
            print(f"❌ API schema failed: {response.status_code}")
    except Exception as e:
        print(f"❌ API schema error: {e}")
    print()
    
    # Test 3: Authentication
    print("Test 3: Authentication")
    try:
        # Create test user if not exists
        username = 'testuser'
        password = 'testpass123'
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': 'test@example.com',
                'role': 'Admin',
                'is_active': True
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            print(f"   Created test user: {username}")
        
        # Test login
        login_data = {
            'username': username,
            'password': password
        }
        
        response = requests.post(
            f"{base_url}/api/auth/login/",
            json=login_data,
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get('access')
            refresh_token = data.get('refresh')
            print("✅ Authentication successful")
            print(f"   Access token: {access_token[:20]}...")
            print(f"   Refresh token: {refresh_token[:20]}...")
            
            # Test 4: Authenticated Request
            print()
            print("Test 4: Authenticated Request")
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Test users endpoint
            response = requests.get(
                f"{base_url}/api/users/",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                print("✅ Authenticated request successful")
                data = response.json()
                if isinstance(data, dict) and 'results' in data:
                    print(f"   Found {data.get('count', 0)} users")
                elif isinstance(data, list):
                    print(f"   Found {len(data)} users")
            else:
                print(f"❌ Authenticated request failed: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
            
            # Test 5: Token Refresh
            print()
            print("Test 5: Token Refresh")
            refresh_data = {'refresh': refresh_token}
            response = requests.post(
                f"{base_url}/api/auth/token/refresh/",
                json=refresh_data,
                timeout=5
            )
            
            if response.status_code == 200:
                new_token = response.json().get('access')
                print("✅ Token refresh successful")
                print(f"   New token: {new_token[:20]}...")
            else:
                print(f"❌ Token refresh failed: {response.status_code}")
                
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        import traceback
        traceback.print_exc()
    print()
    
    # Test 6: CORS Configuration
    print("Test 6: CORS Configuration")
    try:
        response = requests.options(
            f"{base_url}/api/users/",
            headers={
                'Origin': 'http://localhost:5173',
                'Access-Control-Request-Method': 'GET'
            },
            timeout=5
        )
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        if any(cors_headers.values()):
            print("✅ CORS configured")
            for key, value in cors_headers.items():
                if value:
                    print(f"   {key}: {value}")
        else:
            print("⚠️  CORS headers not found (may be normal for OPTIONS)")
            
    except Exception as e:
        print(f"❌ CORS test error: {e}")
    print()
    
    # Test 7: Database Connection
    print("Test 7: Database Connection")
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                print("✅ Database connection successful")
                print(f"   Database: {settings.DATABASES['default']['ENGINE']}")
    except Exception as e:
        print(f"❌ Database connection error: {e}")
    print()
    
    print("=" * 60)
    print("Test Complete")
    print("=" * 60)


if __name__ == '__main__':
    test_api_connection()

