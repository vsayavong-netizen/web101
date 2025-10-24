#!/usr/bin/env python3
"""
Simple API test script
"""

import requests
import json

def test_simple():
    """Simple API test"""
    base_url = "https://eduinfo.online"
    
    print("🔍 Testing API endpoints...")
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/health/", timeout=5)
        print(f"Health check: {response.status_code}")
    except Exception as e:
        print(f"Health check error: {e}")
    
    # Test 2: Students endpoint
    try:
        response = requests.get(f"{base_url}/api/students/", timeout=5)
        print(f"Students endpoint: {response.status_code}")
    except Exception as e:
        print(f"Students endpoint error: {e}")
    
    # Test 3: Auth endpoint
    try:
        response = requests.post(f"{base_url}/api/auth/login/", 
                              json={"username": "test", "password": "test"},
                              timeout=5)
        print(f"Auth endpoint: {response.status_code}")
    except Exception as e:
        print(f"Auth endpoint error: {e}")

if __name__ == "__main__":
    test_simple()
