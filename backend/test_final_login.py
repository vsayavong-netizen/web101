#!/usr/bin/env python3
"""
Final Comprehensive Test for Real Login from Frontend
Test real login from frontend to backend API with all features
"""

import requests
import json
import time

def test_server_connection():
    """Test if Django server is running"""
    print("Testing server connection...")
    try:
        response = requests.get("http://localhost:8000", timeout=5)
        if response.status_code in [200, 401, 403]:  # Any response means server is running
            print("PASS: Django server is running")
            return True
        else:
            print("FAIL: Django server returned error")
            return False
    except requests.exceptions.RequestException:
        print("FAIL: Django server is not running")
        print("Please start Django server with: python manage.py runserver")
        return False

def test_login_api():
    """Test login API"""
    print("\nTesting Login API...")
    
    # Test data - using admin user
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/auth/login/',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("PASS: Login successful!")
            print(f"  Access token: {data.get('access', 'N/A')[:20]}...")
            print(f"  User: {data.get('user', {}).get('username', 'N/A')}")
            return data
        else:
            print(f"FAIL: Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"FAIL: Login error: {e}")
        return None

def test_authenticated_request(access_token):
    """Test authenticated request"""
    print("\nTesting Authenticated Request...")
    
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            'http://localhost:8000/api/auth/me/',
            headers=headers,
            timeout=10
        )
        
        print(f"Authenticated request status: {response.status_code}")
        
        if response.status_code == 200:
            user_data = response.json()
            print("PASS: Authenticated request successful!")
            print(f"  User info: {user_data.get('username', 'N/A')}")
            return True
        else:
            print(f"FAIL: Authenticated request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"FAIL: Authenticated request error: {e}")
        return False

def test_logout(refresh_token, access_token):
    """Test logout functionality"""
    print("\nTesting Logout...")
    
    try:
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        logout_data = {'refresh': refresh_token}
        response = requests.post(
            'http://localhost:8000/api/auth/logout/',
            json=logout_data,
            headers=headers,
            timeout=10
        )
        
        print(f"Logout status: {response.status_code}")
        
        if response.status_code == 200:
            print("PASS: Logout successful!")
            return True
        else:
            print(f"FAIL: Logout failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"FAIL: Logout error: {e}")
        return False

def test_frontend_integration():
    """Test frontend integration simulation"""
    print("\nTesting Frontend Integration...")
    
    # Simulate frontend API client
    class FrontendAPIClient:
        def __init__(self, base_url):
            self.base_url = base_url
            self.token = None
        
        def login(self, username, password):
            response = requests.post(
                f"{self.base_url}/api/auth/login/",
                json={'username': username, 'password': password},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data['access']
                return data
            else:
                raise Exception(f"Login failed: {response.text}")
        
        def get_user_info(self):
            if not self.token:
                raise Exception("Not logged in")
            
            response = requests.get(
                f"{self.base_url}/api/auth/me/",
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Get user info failed: {response.text}")
        
        def logout(self, refresh_token):
            response = requests.post(
                f"{self.base_url}/api/auth/logout/",
                json={'refresh': refresh_token},
                headers={'Authorization': f'Bearer {self.token}'},
                timeout=10
            )
            
            if response.status_code == 200:
                self.token = None
                return True
            else:
                raise Exception(f"Logout failed: {response.text}")
    
    try:
        # Test frontend integration
        client = FrontendAPIClient("http://localhost:8000")
        
        # Login
        login_result = client.login('admin', 'admin123')
        print("PASS: Frontend login successful!")
        
        # Get user info
        user_info = client.get_user_info()
        print(f"PASS: Frontend user info: {user_info.get('username', 'N/A')}")
        
        # Logout
        client.logout(login_result['refresh'])
        print("PASS: Frontend logout successful!")
        
        return True
        
    except Exception as e:
        print(f"FAIL: Frontend integration error: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("FINAL COMPREHENSIVE LOGIN TEST")
    print("=" * 60)
    
    results = {
        'server_connection': False,
        'login_api': False,
        'authenticated_request': False,
        'logout': False,
        'frontend_integration': False
    }
    
    # Test 1: Server connection
    results['server_connection'] = test_server_connection()
    
    if not results['server_connection']:
        print("\nFAIL: Cannot proceed without server connection")
        return False
    
    # Test 2: Login API
    login_data = test_login_api()
    results['login_api'] = login_data is not None
    
    if not results['login_api']:
        print("\nFAIL: Cannot proceed without successful login")
        return False
    
    # Test 3: Authenticated request
    results['authenticated_request'] = test_authenticated_request(login_data['access'])
    
    # Test 4: Logout
    results['logout'] = test_logout(login_data['refresh'], login_data['access'])
    
    # Test 5: Frontend integration
    results['frontend_integration'] = test_frontend_integration()
    
    # Print results
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    for test_name, result in results.items():
        status = "PASS" if result else "FAIL"
        print(f"{status} {test_name.replace('_', ' ').title()}")
    
    print(f"\nTotal: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\nSUCCESS: ALL TESTS PASSED!")
        print("The login system is working correctly from frontend to backend.")
        return True
    else:
        print(f"\nWARNING: {total_tests - passed_tests} tests failed")
        print("There are issues that need to be fixed.")
        return False

def main():
    """Main function"""
    print("Automated Test for Real Login from Frontend")
    print("Testing complete login flow from frontend to backend")
    print("=" * 60)
    
    success = run_all_tests()
    
    if success:
        print("\nSUCCESS: Login system is fully functional!")
    else:
        print("\nFAILED: Login system has issues to fix")
    
    return success

if __name__ == "__main__":
    main()
