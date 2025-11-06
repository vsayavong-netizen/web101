#!/usr/bin/env python
"""
Quick API test script
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_api():
    print("=== Testing API Endpoints ===\n")
    
    # Test health check
    print("1. Testing Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test root endpoint
    print("\n2. Testing Root Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/", headers={"Accept": "application/json"})
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Message: {data.get('message', 'N/A')}")
            print(f"   Endpoints: {list(data.get('endpoints', {}).keys())}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test login
    print("\n3. Testing Login API...")
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login/",
            json={"username": "admin", "password": "admin123"}
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            token = data.get('access', 'N/A')
            print(f"   Login successful! Token: {token[:20]}...")
            return token
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    return None

def test_authenticated_endpoints(token):
    if not token:
        print("\nSkipping authenticated endpoints (no token)")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testing Authenticated Endpoints ===\n")
    
    endpoints = [
        ("/api/students/", "Students"),
        ("/api/advisors/", "Advisors"),
        ("/api/majors/", "Majors"),
        ("/api/classrooms/", "Classrooms"),
        ("/api/projects/projects/", "Projects"),
    ]
    
    for endpoint, name in endpoints:
        print(f"Testing {name}...")
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"   Count: {len(data)} items")
                elif isinstance(data, dict) and 'results' in data:
                    print(f"   Count: {len(data['results'])} items")
                else:
                    print(f"   Response received")
            else:
                print(f"   Error: {response.text[:100]}")
        except Exception as e:
            print(f"   Error: {e}")

if __name__ == "__main__":
    token = test_api()
    test_authenticated_endpoints(token)
    print("\n=== API Testing Complete ===")
