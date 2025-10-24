#!/usr/bin/env python3
"""
Basic Login Test - Test only core authentication without complex models
"""

import os
import sys
import django
import requests
import json

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from accounts.models import User

User = get_user_model()

def test_basic_login():
    """Test basic login functionality"""
    print("Testing Basic Login Functionality")
    print("=" * 40)
    
    client = Client()
    
    # Test data
    username = 'testuser'
    password = 'testpass123'
    email = 'test@example.com'
    
    try:
        # Clean up any existing test user
        User.objects.filter(username=username).delete()
        
        # Create test user
        print("Creating test user...")
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name='Test',
            last_name='User',
            role='Student',
            is_active=True
        )
        print(f"User created: {user.username}")
        
        # Test login API
        print("\nTesting login API...")
        login_data = {
            'username': username,
            'password': password
        }
        
        response = client.post(
            '/api/accounts/login/',
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Login successful!")
            print(f"Access token: {data.get('access', 'N/A')[:20]}...")
            print(f"User data: {data.get('user', {}).get('username', 'N/A')}")
            
            # Test authenticated request
            print("\nTesting authenticated request...")
            access_token = data['access']
            headers = {'Authorization': f'Bearer {access_token}'}
            
            me_response = client.get(
                '/api/accounts/me/',
                headers=headers
            )
            
            print(f"Authenticated request status: {me_response.status_code}")
            
            if me_response.status_code == 200:
                user_data = me_response.json()
                print(f"User info: {user_data.get('username', 'N/A')}")
                print("Authenticated request successful!")
                
                # Test logout
                print("\nTesting logout...")
                logout_data = {'refresh': data['refresh']}
                logout_response = client.post(
                    '/api/accounts/logout/',
                    data=json.dumps(logout_data),
                    content_type='application/json',
                    headers=headers
                )
                
                print(f"Logout status: {logout_response.status_code}")
                
                if logout_response.status_code == 200:
                    print("Logout successful!")
                    return True
                else:
                    print("Logout failed")
                    return False
            else:
                print("Authenticated request failed")
                return False
        else:
            print("Login failed")
            if hasattr(response, 'json'):
                print(f"Error: {response.json()}")
            return False
            
    except Exception as e:
        print(f"Error during test: {e}")
        return False
    
    finally:
        # Clean up
        try:
            User.objects.filter(username=username).delete()
            print("\nTest user cleaned up")
        except:
            pass

def main():
    """Main function"""
    print("Basic Login Test")
    print("=" * 50)
    
    # Check if Django server is running
    try:
        response = requests.get("http://localhost:8000", timeout=5)
        print("Django server is running")
    except requests.exceptions.RequestException:
        print("Django server is not running")
        print("Please start Django server with: python manage.py runserver")
        return False
    
    # Run test
    success = test_basic_login()
    
    if success:
        print("\n" + "=" * 50)
        print("SUCCESS: Basic login test passed!")
        print("The login system is working correctly.")
    else:
        print("\n" + "=" * 50)
        print("FAILED: Basic login test failed!")
        print("There are issues with the login system.")
    
    return success

if __name__ == "__main__":
    main()
