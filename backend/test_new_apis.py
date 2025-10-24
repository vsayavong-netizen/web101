"""
Test script for new APIs
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.test import Client

def test_new_api_endpoints():
    """Test new API endpoints"""
    client = Client()
    
    print("=" * 60)
    print("Testing New API Endpoints")
    print("=" * 60)
    
    # Test File Management APIs
    print("\n1. File Management APIs")
    print("-" * 40)
    endpoints = [
        '/api/files/',
        '/api/files/statistics/',
    ]
    for endpoint in endpoints:
        try:
            response = client.get(endpoint)
            status = "OK" if response.status_code in [200, 401, 404] else "FAIL"
            print(f"{status} {endpoint:30} (Status: {response.status_code})")
        except Exception as e:
            print(f"FAIL {endpoint:30} (Error: {str(e)[:40]})")
    
    # Test Communication APIs
    print("\n2. Communication APIs")
    print("-" * 40)
    endpoints = [
        '/api/communication/channels/',
        '/api/communication/statistics/',
    ]
    for endpoint in endpoints:
        try:
            response = client.get(endpoint)
            status = "OK" if response.status_code in [200, 401, 404] else "FAIL"
            print(f"{status} {endpoint:30} (Status: {response.status_code})")
        except Exception as e:
            print(f"FAIL {endpoint:30} (Error: {str(e)[:40]})")
    
    # Test AI Enhancement APIs
    print("\n3. AI Enhancement APIs")
    print("-" * 40)
    endpoints = [
        '/api/ai-enhancement/plagiarism/',
        '/api/ai-enhancement/grammar/',
        '/api/ai-enhancement/topics/',
        '/api/ai-enhancement/statistics/',
    ]
    for endpoint in endpoints:
        try:
            response = client.get(endpoint)
            status = "OK" if response.status_code in [200, 401, 404] else "FAIL"
            print(f"{status} {endpoint:30} (Status: {response.status_code})")
        except Exception as e:
            print(f"FAIL {endpoint:30} (Error: {str(e)[:40]})")
    
    # Test Defense Management APIs
    print("\n4. Defense Management APIs")
    print("-" * 40)
    endpoints = [
        '/api/defense/schedules/',
        '/api/defense/sessions/',
        '/api/defense/rooms/',
        '/api/defense/statistics/',
    ]
    for endpoint in endpoints:
        try:
            response = client.get(endpoint)
            status = "OK" if response.status_code in [200, 401, 404] else "FAIL"
            print(f"{status} {endpoint:30} (Status: {response.status_code})")
        except Exception as e:
            print(f"FAIL {endpoint:30} (Error: {str(e)[:40]})")
    
    print("\n" + "=" * 60)
    print("Testing Complete!")
    print("=" * 60)

if __name__ == '__main__':
    test_new_api_endpoints()

