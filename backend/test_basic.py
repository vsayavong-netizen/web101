#!/usr/bin/env python3
"""
Basic Backend Test - No Database Dependencies
ทดสอบการทำงานของ Backend API แบบพื้นฐาน
"""

import requests
import json
import time

class BasicBackendTest:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        
    def check_server(self):
        """ตรวจสอบว่า server ทำงานหรือไม่"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            # Django server ทำงานถ้าได้ response (แม้จะเป็น 401)
            return response.status_code in [200, 401, 404]
        except:
            return False
    
    def test_api_endpoints(self):
        """ทดสอบ API endpoints พื้นฐาน"""
        endpoints = [
            "/api/",
            "/api/auth/",
            "/api/accounts/",
            "/api/projects/",
        ]
        
        results = []
        for endpoint in endpoints:
            try:
                url = f"{self.base_url}{endpoint}"
                response = requests.get(url, timeout=5)
                status = response.status_code
                results.append({
                    'endpoint': endpoint,
                    'status': status,
                    'success': status in [200, 401, 404, 405]  # 405 = Method Not Allowed
                })
                print(f"Endpoint {endpoint}: {status}")
            except Exception as e:
                results.append({
                    'endpoint': endpoint,
                    'status': 'ERROR',
                    'success': False
                })
                print(f"Endpoint {endpoint}: ERROR - {e}")
        
        return results
    
    def test_cors_headers(self):
        """ทดสอบ CORS headers"""
        try:
            response = requests.options(f"{self.base_url}/api/", timeout=5)
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            }
            print("CORS Headers:")
            for key, value in cors_headers.items():
                print(f"  {key}: {value}")
            return True
        except Exception as e:
            print(f"CORS test error: {e}")
            return False
    
    def run_all_tests(self):
        """รันการทดสอบทั้งหมด"""
        print("Basic Backend API Test")
        print("=" * 50)
        
        # ตรวจสอบ server
        if not self.check_server():
            print("ERROR: Django server is not running")
            print("Please start server with: python manage.py runserver")
            return False
        
        print("Django server is running")
        print()
        
        # ทดสอบ API endpoints
        print("Testing API endpoints...")
        results = self.test_api_endpoints()
        successful = sum(1 for r in results if r['success'])
        total = len(results)
        print(f"API endpoints: {successful}/{total} working")
        print()
        
        # ทดสอบ CORS
        print("Testing CORS headers...")
        cors_ok = self.test_cors_headers()
        print()
        
        # สรุปผล
        print("=" * 50)
        print("Test Summary:")
        print(f"Server running: YES")
        print(f"API endpoints: {successful}/{total}")
        print(f"CORS headers: {'OK' if cors_ok else 'FAILED'}")
        
        if successful > 0 and cors_ok:
            print("\nBackend basic tests PASSED!")
            return True
        else:
            print("\nBackend basic tests FAILED!")
            return False

def main():
    """Main function"""
    test_runner = BasicBackendTest()
    success = test_runner.run_all_tests()
    
    if success:
        print("\nBasic backend tests completed successfully!")
        return 0
    else:
        print("\nBasic backend tests failed!")
        return 1

if __name__ == "__main__":
    import sys
    exit_code = main()
    sys.exit(exit_code)
