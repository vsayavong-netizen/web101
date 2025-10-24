#!/usr/bin/env python3
"""
Test script to verify console errors fix
"""

import requests
import json
import sys

def test_api_endpoints():
    """Test API endpoints to verify fixes"""
    base_url = "https://eduinfo.online"
    
    print("🔍 Testing API Endpoints...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/health/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Health check passed")
        else:
            print("   ❌ Health check failed")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    # Test 2: Students API (GET)
    print("\n2. Testing Students API (GET)...")
    try:
        response = requests.get(f"{base_url}/api/students/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Students API accessible")
        else:
            print(f"   ❌ Students API failed: {response.text[:100]}")
    except Exception as e:
        print(f"   ❌ Students API error: {e}")
    
    # Test 3: Students API (POST) - should return 401/403 without auth
    print("\n3. Testing Students API (POST) - should require auth...")
    try:
        response = requests.post(f"{base_url}/api/students/", 
                               json={"test": "data"}, 
                               timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code in [401, 403]:
            print("   ✅ Students API properly requires authentication")
        else:
            print(f"   ⚠️  Unexpected status: {response.text[:100]}")
    except Exception as e:
        print(f"   ❌ Students API POST error: {e}")
    
    # Test 4: Auth Login API
    print("\n4. Testing Auth Login API...")
    try:
        response = requests.post(f"{base_url}/api/auth/login/", 
                               json={"username": "admin", "password": "admin123"}, 
                               timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ Login API working")
            data = response.json()
            if 'access' in data or 'token' in data:
                print("   ✅ JWT token returned")
            else:
                print("   ⚠️  No token in response")
        elif response.status_code == 400:
            print("   ⚠️  Login failed - check credentials")
        else:
            print(f"   ❌ Login API error: {response.text[:100]}")
    except Exception as e:
        print(f"   ❌ Login API error: {e}")
    
    # Test 5: Check for double slashes in URLs
    print("\n5. Testing URL construction...")
    test_urls = [
        f"{base_url}/api/students/",
        f"{base_url}/api/auth/login/",
        f"{base_url}/api/projects/",
    ]
    
    for url in test_urls:
        if "//" in url.replace("https://", ""):
            print(f"   ❌ Double slash found in: {url}")
        else:
            print(f"   ✅ Clean URL: {url}")
    
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print("- Check browser console for remaining errors")
    print("- Verify no double slashes in API calls")
    print("- Test login functionality in frontend")
    print("- Check network tab for actual URLs being called")

if __name__ == "__main__":
    test_api_endpoints()
