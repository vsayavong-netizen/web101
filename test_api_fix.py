#!/usr/bin/env python3
"""
Test script to verify API endpoints are working correctly
"""

import requests
import json
import sys

def test_api_endpoints():
    """Test API endpoints"""
    base_url = "https://eduinfo.online"
    
    print("🔍 Testing API endpoints...")
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print(f"   ❌ Health check failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    # Test 2: Students endpoint
    print("\n2. Testing students endpoint...")
    try:
        response = requests.get(f"{base_url}/api/students/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Students endpoint working")
        elif response.status_code == 401:
            print("   ⚠️  Students endpoint requires authentication (expected)")
        else:
            print(f"   ❌ Students endpoint failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Students endpoint error: {e}")
    
    # Test 3: Auth login endpoint
    print("\n3. Testing auth login endpoint...")
    try:
        login_data = {
            "username": "test",
            "password": "test"
        }
        response = requests.post(
            f"{base_url}/api/auth/login/", 
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Auth login endpoint working")
        elif response.status_code == 401:
            print("   ⚠️  Auth login endpoint working (invalid credentials)")
        else:
            print(f"   ❌ Auth login endpoint failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Auth login endpoint error: {e}")
    
    # Test 4: API documentation
    print("\n4. Testing API documentation...")
    try:
        response = requests.get(f"{base_url}/api/docs/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ API documentation accessible")
        else:
            print(f"   ❌ API documentation failed: {response.text}")
    except Exception as e:
        print(f"   ❌ API documentation error: {e}")
    
    print("\n🏁 API testing completed!")

if __name__ == "__main__":
    test_api_endpoints()
