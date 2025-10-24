#!/usr/bin/env python3
"""
Direct API Test - Test login API directly without User model
"""

import requests
import json

def test_direct_api():
    """Test login API directly"""
    print("Testing Direct API Login")
    print("=" * 40)
    
    # Test data
    username = 'admin'
    password = 'admin123'
    
    try:
        # Test login API
        print("Testing login API...")
        login_data = {
            'username': username,
            'password': password
        }
        
        response = requests.post(
            'http://localhost:8000/api/auth/login/',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
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
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            me_response = requests.get(
                'http://localhost:8000/api/auth/me/',
                headers=headers,
                timeout=10
            )
            
            print(f"Authenticated request status: {me_response.status_code}")
            
            if me_response.status_code == 200:
                user_data = me_response.json()
                print(f"User info: {user_data.get('username', 'N/A')}")
                print("Authenticated request successful!")
                
                # Test logout
                print("\nTesting logout...")
                logout_data = {'refresh': data['refresh']}
                logout_response = requests.post(
                    'http://localhost:8000/api/auth/logout/',
                    json=logout_data,
                    headers=headers,
                    timeout=10
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
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error during test: {e}")
        return False

def main():
    """Main function"""
    print("Direct API Login Test")
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
    success = test_direct_api()
    
    if success:
        print("\n" + "=" * 50)
        print("SUCCESS: Direct API login test passed!")
        print("The login system is working correctly.")
    else:
        print("\n" + "=" * 50)
        print("FAILED: Direct API login test failed!")
        print("There are issues with the login system.")
    
    return success

if __name__ == "__main__":
    main()
