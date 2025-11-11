#!/usr/bin/env python
"""
Script to test API endpoints
"""
import os
import sys
import django
import requests
import json

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken

BASE_URL = "http://localhost:8000"

def get_auth_token(username="admin", password="admin123"):
    """Get JWT token for authentication"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login/",
            json={"username": username, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get('access')
        else:
            print(f"[ERROR] Login failed: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"[ERROR] Error getting token: {e}")
        return None

def test_endpoint(method, endpoint, token=None, data=None, description=""):
    """Test an API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if data:
        headers["Content-Type"] = "application/json"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            print(f"[ERROR] Unknown method: {method}")
            return False
        
        status = "[OK]" if 200 <= response.status_code < 300 else "[ERROR]"
        print(f"{status} {method} {endpoint} - {response.status_code}")
        
        if description:
            print(f"   Description: {description}")
        
        if response.status_code >= 400:
            print(f"   Response: {response.text[:200]}")
        
        return 200 <= response.status_code < 300
        
    except Exception as e:
        print(f"[ERROR] {method} {endpoint} - Exception: {e}")
        return False

def main():
    """Main test function"""
    print("=" * 60)
    print("API Endpoints Testing")
    print("=" * 60 + "\n")
    
    # Get authentication token
    print("1. Getting authentication token...")
    token = get_auth_token()
    if not token:
        print("[ERROR] Failed to get token. Exiting.")
        return False
    
    print(f"[OK] Token obtained: {token[:50]}...\n")
    
    # Test endpoints
    results = []
    
    print("2. Testing API Endpoints...\n")
    
    # Authentication endpoints
    print("=" * 60)
    print("Authentication Endpoints")
    print("=" * 60)
    results.append(("POST /api/auth/login/", test_endpoint("POST", "/api/auth/login/", data={"username": "admin", "password": "admin123"}, description="Login")))
    results.append(("GET /api/auth/profile/", test_endpoint("GET", "/api/auth/profile/", token=token, description="Get profile")))
    
    # User endpoints
    print("\n" + "=" * 60)
    print("User Endpoints")
    print("=" * 60)
    results.append(("GET /api/users/", test_endpoint("GET", "/api/users/", token=token, description="List users")))
    
    # Student endpoints
    print("\n" + "=" * 60)
    print("Student Endpoints")
    print("=" * 60)
    results.append(("GET /api/students/", test_endpoint("GET", "/api/students/", token=token, description="List students")))
    results.append(("GET /api/students/?academic_year=2024", test_endpoint("GET", "/api/students/?academic_year=2024", token=token, description="List students by year")))
    
    # Advisor endpoints
    print("\n" + "=" * 60)
    print("Advisor Endpoints")
    print("=" * 60)
    results.append(("GET /api/advisors/", test_endpoint("GET", "/api/advisors/", token=token, description="List advisors")))
    
    # Project endpoints
    print("\n" + "=" * 60)
    print("Project Endpoints")
    print("=" * 60)
    results.append(("GET /api/projects/", test_endpoint("GET", "/api/projects/", token=token, description="List projects")))
    results.append(("GET /api/projects/?academic_year=2024", test_endpoint("GET", "/api/projects/?academic_year=2024", token=token, description="List projects by year")))
    
    # Major endpoints
    print("\n" + "=" * 60)
    print("Major Endpoints")
    print("=" * 60)
    results.append(("GET /api/majors/", test_endpoint("GET", "/api/majors/", token=token, description="List majors")))
    
    # Classroom endpoints
    print("\n" + "=" * 60)
    print("Classroom Endpoints")
    print("=" * 60)
    results.append(("GET /api/classrooms/", test_endpoint("GET", "/api/classrooms/", token=token, description="List classrooms")))
    
    # Notification endpoints
    print("\n" + "=" * 60)
    print("Notification Endpoints")
    print("=" * 60)
    results.append(("GET /api/notifications/user/1/", test_endpoint("GET", "/api/notifications/user/1/", token=token, description="Get user notifications")))
    
    # Settings endpoints
    print("\n" + "=" * 60)
    print("Settings Endpoints")
    print("=" * 60)
    results.append(("GET /api/settings/academic-years/current/", test_endpoint("GET", "/api/settings/academic-years/current/", token=token, description="Get current academic year")))
    results.append(("GET /api/settings/academic-years/available/", test_endpoint("GET", "/api/settings/academic-years/available/", token=token, description="Get available academic years")))
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for endpoint, result in results:
        status = "[OK] PASS" if result else "[ERROR] FAIL"
        print(f"{status} - {endpoint}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[SUCCESS] All API endpoints are working correctly!")
        return True
    else:
        print(f"\n[WARNING] {total - passed} endpoint(s) failed. Please check above.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

