#!/usr/bin/env python3
"""
Simple Test for Backend API
ทดสอบการทำงานของ Backend API แบบง่าย
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

from accounts.models import User
from django.contrib.auth import get_user_model

class SimpleBackendTest:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.test_data = {
            'username': 'testuser',
            'password': 'testpass123',
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'Student'
        }
        
    def check_server(self):
        """ตรวจสอบว่า server ทำงานหรือไม่"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            # Django server ทำงานถ้าได้ response (แม้จะเป็น 401)
            return response.status_code in [200, 401, 404]
        except:
            return False
    
    def create_test_user(self):
        """สร้าง test user"""
        try:
            # ลบ user เก่าถ้ามี
            User.objects.filter(username=self.test_data['username']).delete()
            
            # สร้าง user ใหม่
            user = User.objects.create_user(
                username=self.test_data['username'],
                email=self.test_data['email'],
                password=self.test_data['password'],
                first_name=self.test_data['first_name'],
                last_name=self.test_data['last_name'],
                role=self.test_data['role']
            )
            print(f"Created test user: {user.username}")
            return True
        except Exception as e:
            print(f"Error creating test user: {e}")
            return False
    
    def test_login_api(self):
        """ทดสอบ Login API"""
        try:
            url = f"{self.base_url}/api/auth/login/"
            data = {
                'username': self.test_data['username'],
                'password': self.test_data['password']
            }
            
            response = requests.post(url, json=data, timeout=10)
            print(f"Login API Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print("Login successful!")
                print(f"Access token received: {len(result.get('access', ''))} characters")
                return True
            else:
                print(f"Login failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error testing login API: {e}")
            return False
    
    def test_protected_endpoint(self):
        """ทดสอบ protected endpoint"""
        try:
            # ต้อง login ก่อน
            login_url = f"{self.base_url}/api/auth/login/"
            login_data = {
                'username': self.test_data['username'],
                'password': self.test_data['password']
            }
            
            login_response = requests.post(login_url, json=login_data, timeout=10)
            if login_response.status_code != 200:
                print("Cannot login to test protected endpoint")
                return False
                
            token = login_response.json().get('access')
            headers = {'Authorization': f'Bearer {token}'}
            
            # ทดสอบ protected endpoint
            protected_url = f"{self.base_url}/api/auth/me/"
            response = requests.get(protected_url, headers=headers, timeout=10)
            print(f"Protected endpoint status: {response.status_code}")
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Error testing protected endpoint: {e}")
            return False
    
    def cleanup(self):
        """ลบ test user"""
        try:
            User.objects.filter(username=self.test_data['username']).delete()
            print("Cleaned up test user")
        except Exception as e:
            print(f"Error cleaning up: {e}")
    
    def run_all_tests(self):
        """รันการทดสอบทั้งหมด"""
        print("Starting Backend API Tests")
        print("=" * 50)
        
        # ตรวจสอบ server
        if not self.check_server():
            print("ERROR: Django server is not running")
            print("Please start server with: python manage.py runserver")
            return False
        
        print("Django server is running")
        
        # สร้าง test user
        if not self.create_test_user():
            print("ERROR: Cannot create test user")
            return False
        
        # ทดสอบ login API
        if not self.test_login_api():
            print("ERROR: Login API test failed")
            self.cleanup()
            return False
        
        # ทดสอบ protected endpoint
        if not self.test_protected_endpoint():
            print("ERROR: Protected endpoint test failed")
            self.cleanup()
            return False
        
        # ลบ test user
        self.cleanup()
        
        print("\n" + "=" * 50)
        print("All Backend API tests passed!")
        return True

def main():
    """Main function"""
    print("Simple Backend API Test")
    print("=" * 50)
    
    test_runner = SimpleBackendTest()
    success = test_runner.run_all_tests()
    
    if success:
        print("\nBackend tests completed successfully!")
        return 0
    else:
        print("\nBackend tests failed!")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
