#!/usr/bin/env python3
"""
Automated Test for Real Login from Frontend
ทดสอบการล็อกอินจริงจาก frontend กับ backend API
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

class RealLoginTest:
    """Test class for real login functionality"""
    
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.api_url = f"{self.base_url}/api/accounts"
        self.frontend_url = "http://localhost:3000"
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
        """สร้าง test user สำหรับทดสอบ"""
        print("กำลังสร้าง test user...")
        
        # ลบ user เก่าถ้ามี
        User.objects.filter(username=self.test_data['username']).delete()
        
        # สร้าง user ใหม่
        self.test_user = User.objects.create_user(
            username=self.test_data['username'],
            email=self.test_data['email'],
            password=self.test_data['password'],
            first_name=self.test_data['first_name'],
            last_name=self.test_data['last_name'],
            role=self.test_data['role'],
            is_active=True
        )
        
        print(f"สร้าง test user สำเร็จ: {self.test_user.username}")
        return self.test_user
    
    def test_backend_login_api(self):
        """ทดสอบ backend login API"""
        print("\n🧪 ทดสอบ Backend Login API...")
        
        # Test data
        login_data = {
            'username': self.test_data['username'],
            'password': self.test_data['password']
        }
        
        try:
            # เรียก login API
            response = self.client.post(
                f"{self.api_url}/login/",
                data=json.dumps(login_data),
                content_type='application/json'
            )
            
            print(f"📊 Response Status: {response.status_code}")
            print(f"📊 Response Data: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                assert 'access' in data, "ไม่มี access token"
                assert 'refresh' in data, "ไม่มี refresh token"
                assert 'user' in data, "ไม่มี user data"
                
                print("✅ Backend Login API ทำงานถูกต้อง")
                return data
            else:
                print(f"❌ Backend Login API ล้มเหลว: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาดในการทดสอบ Backend API: {e}")
            return None
    
    def test_frontend_login_integration(self):
        """ทดสอบการล็อกอินผ่าน frontend integration"""
        print("\n🧪 ทดสอบ Frontend Login Integration...")
        
        # จำลองการเรียก API จาก frontend
        login_data = {
            'username': self.test_data['username'],
            'password': self.test_data['password']
        }
        
        try:
            # เรียก API โดยตรง (จำลอง frontend call)
            response = requests.post(
                f"{self.api_url}/login/",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            print(f"📊 Frontend Integration Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Frontend Login Integration ทำงานถูกต้อง")
                return data
            else:
                print(f"❌ Frontend Login Integration ล้มเหลว: {response.text}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"❌ เกิดข้อผิดพลาดในการเชื่อมต่อ: {e}")
            return None
    
    def test_user_session_creation(self):
        """ทดสอบการสร้าง user session"""
        print("\n🧪 ทดสอบ User Session Creation...")
        
        # Login เพื่อสร้าง session
        login_data = {
            'username': self.test_data['username'],
            'password': self.test_data['password']
        }
        
        response = self.client.post(
            f"{self.api_url}/login/",
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            # ตรวจสอบว่า session ถูกสร้างหรือไม่
            sessions = UserSession.objects.filter(user=self.test_user, is_active=True)
            session_count = sessions.count()
            
            print(f"📊 Active Sessions: {session_count}")
            
            if session_count > 0:
                print("✅ User Session ถูกสร้างสำเร็จ")
                return True
            else:
                print("❌ User Session ไม่ถูกสร้าง")
                return False
        else:
            print("❌ ไม่สามารถ login ได้")
            return False
    
    def test_authenticated_request(self):
        """ทดสอบการเรียก API ที่ต้องการ authentication"""
        print("\n🧪 ทดสอบ Authenticated Request...")
        
        # Login เพื่อรับ token
        login_data = {
            'username': self.test_data['username'],
            'password': self.test_data['password']
        }
        
        response = self.client.post(
            f"{self.api_url}/login/",
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data['access']
            
            # ทดสอบเรียก protected endpoint
            headers = {'Authorization': f'Bearer {access_token}'}
            protected_response = self.client.get(
                f"{self.api_url}/me/",
                headers=headers
            )
            
            print(f"📊 Protected Request Status: {protected_response.status_code}")
            
            if protected_response.status_code == 200:
                user_data = protected_response.json()
                print(f"📊 User Data: {user_data.get('username', 'N/A')}")
                print("✅ Authenticated Request ทำงานถูกต้อง")
                return True
            else:
                print("❌ Authenticated Request ล้มเหลว")
                return False
        else:
            print("❌ ไม่สามารถ login ได้")
            return False
    
    def test_logout_functionality(self):
        """ทดสอบการ logout"""
        print("\n🧪 ทดสอบ Logout Functionality...")
        
        # Login ก่อน
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
            
            print(f"📊 Logout Status: {logout_response.status_code}")
            
            if logout_response.status_code == 200:
                print("✅ Logout ทำงานถูกต้อง")
                return True
            else:
                print("❌ Logout ล้มเหลว")
                return False
        else:
            print("❌ ไม่สามารถ login ได้")
            return False
    
    def cleanup(self):
        """ทำความสะอาด test data"""
        print("\n🧹 กำลังทำความสะอาด test data...")
        
        if self.test_user:
            # ลบ user sessions
            UserSession.objects.filter(user=self.test_user).delete()
            # ลบ user
            self.test_user.delete()
            print("✅ ทำความสะอาด test data สำเร็จ")
    
    def run_all_tests(self):
        """รันการทดสอบทั้งหมด"""
        print("🚀 เริ่มการทดสอบ Real Login จาก Frontend")
        print("=" * 50)
        
        results = {
            'setup': False,
            'backend_api': False,
            'frontend_integration': False,
            'session_creation': False,
            'authenticated_request': False,
            'logout': False
        }
        
        try:
            # Setup
            self.setup_test_user()
            results['setup'] = True
            
            # Test Backend API
            backend_result = self.test_backend_login_api()
            results['backend_api'] = backend_result is not None
            
            # Test Frontend Integration
            frontend_result = self.test_frontend_login_integration()
            results['frontend_integration'] = frontend_result is not None
            
            # Test Session Creation
            results['session_creation'] = self.test_user_session_creation()
            
            # Test Authenticated Request
            results['authenticated_request'] = self.test_authenticated_request()
            
            # Test Logout
            results['logout'] = self.test_logout_functionality()
            
        except Exception as e:
            print(f"❌ เกิดข้อผิดพลาดในการทดสอบ: {e}")
        
        finally:
            # Cleanup
            self.cleanup()
        
        # สรุปผลการทดสอบ
        print("\n" + "=" * 50)
        print("📊 สรุปผลการทดสอบ")
        print("=" * 50)
        
        total_tests = len(results)
        passed_tests = sum(results.values())
        
        for test_name, result in results.items():
            status_icon = "✅" if result else "❌"
            print(f"{status_icon} {test_name}: {'ผ่าน' if result else 'ล้มเหลว'}")
        
        print(f"\n📈 ผลรวม: {passed_tests}/{total_tests} การทดสอบผ่าน")
        
        if passed_tests == total_tests:
            print("🎉 การทดสอบทั้งหมดผ่าน!")
            return True
        else:
            print("⚠️ มีการทดสอบบางส่วนล้มเหลว")
            return False

def main():
    """Main function to run the tests"""
    print("Automated Test for Real Login from Frontend")
    print("=" * 60)
    
    # ตรวจสอบว่า Django server กำลังรันอยู่หรือไม่
    try:
        response = requests.get("http://localhost:8000", timeout=5)
        print("Django server is running")
    except requests.exceptions.RequestException:
        print("Django server is not running")
        print("Please start Django server with: python manage.py runserver")
        return False
    
    # รันการทดสอบ
    test_runner = RealLoginTest()
    success = test_runner.run_all_tests()
    
    if success:
        print("\n🎯 การทดสอบเสร็จสิ้น - ระบบ login ทำงานถูกต้อง!")
    else:
        print("\n⚠️ การทดสอบเสร็จสิ้น - มีปัญหาที่ต้องแก้ไข")
    
    return success

if __name__ == "__main__":
    main()
