#!/usr/bin/env python3
"""
Simple Working Test for Real Login from Frontend
Test real login from frontend to backend API (without complex models)
"""

import os
import sys
import django
import requests
import json
import time
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from rest_framework.test import APITestCase
from rest_framework import status
from accounts.models import User, UserSession

User = get_user_model()

class SimpleLoginTest:
    """Simple test class for login functionality"""
    
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.api_url = f"{self.base_url}/api/accounts"
        self.client = Client()
        self.test_user = None
        self.test_data = {
            'username': 'testuser',
            'password': 'testpass123',
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'Student'
        }
    
    def setup_test_user(self):
        """Create test user for testing"""
        print("Creating test user...")
        
        try:
            # Delete old user if exists
            User.objects.filter(username=self.test_data['username']).delete()
            
            # Create new user
            self.test_user = User.objects.create_user(
                username=self.test_data['username'],
                email=self.test_data['email'],
                password=self.test_data['password'],
                first_name=self.test_data['first_name'],
                last_name=self.test_data['last_name'],
                role=self.test_data['role'],
                is_active=True
            )
            
            print(f"Test user created successfully: {self.test_user.username}")
            return True
            
        except Exception as e:
            print(f"Error creating test user: {e}")
            return False
    
    def test_backend_login_api(self):
        """Test backend login API"""
        print("\nTesting Backend Login API...")
        
        # Test data
        login_data = {
            'username': self.test_data['username'],
            'password': self.test_data['password']
        }
        
        try:
            # Call login API
            response = self.client.post(
                f"{self.api_url}/login/",
                data=json.dumps(login_data),
                content_type='application/json'
            )
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Response Data: {data}")
                
                # Check required fields
                if 'access' in data and 'refresh' in data and 'user' in data:
                    print("Backend Login API working correctly")
                    return True
                else:
                    print("Missing required fields in response")
                    return False
            else:
                print(f"Backend Login API failed: {response.status_code}")
                if hasattr(response, 'json'):
                    print(f"Error: {response.json()}")
                return False
                
        except Exception as e:
            print(f"Error testing Backend API: {e}")
            return False
    
    def test_frontend_login_integration(self):
        """Test login through frontend integration"""
        print("\nTesting Frontend Login Integration...")
        
        # Simulate API call from frontend
        login_data = {
            'username': self.test_data['username'],
            'password': self.test_data['password']
        }
        
        try:
            # Call API directly (simulate frontend call)
            response = requests.post(
                f"{self.api_url}/login/",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            print(f"Frontend Integration Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("Frontend Login Integration working correctly")
                return True
            else:
                print(f"Frontend Login Integration failed: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"Connection error: {e}")
            return False
    
    def test_authenticated_request(self):
        """Test API call that requires authentication"""
        print("\nTesting Authenticated Request...")
        
        # Login to get token
        login_data = {
            'username': self.test_data['username'],
            'password': self.test_data['password']
        }
        
        try:
            response = self.client.post(
                f"{self.api_url}/login/",
                data=json.dumps(login_data),
                content_type='application/json'
            )
            
            if response.status_code == 200:
                data = response.json()
                access_token = data['access']
                
                # Test protected endpoint
                headers = {'Authorization': f'Bearer {access_token}'}
                protected_response = self.client.get(
                    f"{self.api_url}/me/",
                    headers=headers
                )
                
                print(f"Protected Request Status: {protected_response.status_code}")
                
                if protected_response.status_code == 200:
                    user_data = protected_response.json()
                    print(f"User Data: {user_data.get('username', 'N/A')}")
                    print("Authenticated Request working correctly")
                    return True
                else:
                    print("Authenticated Request failed")
                    return False
            else:
                print("Cannot login")
                return False
                
        except Exception as e:
            print(f"Error in authenticated request: {e}")
            return False
    
    def test_logout_functionality(self):
        """Test logout functionality"""
        print("\nTesting Logout Functionality...")
        
        try:
            # Login first
            login_data = {
                'username': self.test_data['username'],
                'password': self.test_data['password']
            }
            
            login_response = self.client.post(
                f"{self.api_url}/login/",
                data=json.dumps(login_data),
                content_type='application/json'
            )
            
            if login_response.status_code == 200:
                data = login_response.json()
                access_token = data['access']
                refresh_token = data['refresh']
                
                # Logout
                logout_data = {'refresh': refresh_token}
                logout_response = self.client.post(
                    f"{self.api_url}/logout/",
                    data=json.dumps(logout_data),
                    content_type='application/json',
                    headers={'Authorization': f'Bearer {access_token}'}
                )
                
                print(f"Logout Status: {logout_response.status_code}")
                
                if logout_response.status_code == 200:
                    print("Logout working correctly")
                    return True
                else:
                    print("Logout failed")
                    return False
            else:
                print("Cannot login")
                return False
                
        except Exception as e:
            print(f"Error in logout test: {e}")
            return False
    
    def cleanup(self):
        """Clean up test data"""
        print("\nCleaning up test data...")
        
        try:
            if self.test_user:
                # Delete user
                self.test_user.delete()
                print("Test data cleaned up successfully")
        except Exception as e:
            print(f"Error cleaning up: {e}")
    
    def run_all_tests(self):
        """Run all tests"""
        print("Starting Simple Login Test from Frontend")
        print("=" * 50)
        
        results = {
            'setup': False,
            'backend_api': False,
            'frontend_integration': False,
            'authenticated_request': False,
            'logout': False
        }
        
        try:
            # Setup
            results['setup'] = self.setup_test_user()
            
            if results['setup']:
                # Test Backend API
                results['backend_api'] = self.test_backend_login_api()
                
                # Test Frontend Integration
                results['frontend_integration'] = self.test_frontend_login_integration()
                
                # Test Authenticated Request
                results['authenticated_request'] = self.test_authenticated_request()
                
                # Test Logout
                results['logout'] = self.test_logout_functionality()
            
        except Exception as e:
            print(f"Error during testing: {e}")
        
        finally:
            # Cleanup
            self.cleanup()
        
        # Print test results
        print("\n" + "=" * 50)
        print("Test Results Summary")
        print("=" * 50)
        
        total_tests = len(results)
        passed_tests = sum(results.values())
        
        for test_name, result in results.items():
            status_icon = "PASS" if result else "FAIL"
            print(f"{status_icon} {test_name}: {'Passed' if result else 'Failed'}")
        
        print(f"\nTotal: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            print("All tests passed!")
            return True
        else:
            print("Some tests failed")
            return False

def main():
    """Main function to run the tests"""
    print("Simple Automated Test for Real Login from Frontend")
    print("=" * 60)
    
    # Check if Django server is running
    try:
        response = requests.get("http://localhost:8000", timeout=5)
        print("Django server is running")
    except requests.exceptions.RequestException:
        print("Django server is not running")
        print("Please start Django server with: python manage.py runserver")
        return False
    
    # Run tests
    test_runner = SimpleLoginTest()
    success = test_runner.run_all_tests()
    
    if success:
        print("\nTest completed - Login system working correctly!")
    else:
        print("\nTest completed - There are issues to fix")
    
    return success

if __name__ == "__main__":
    main()
