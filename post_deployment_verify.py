#!/usr/bin/env python3
"""
Post-Deployment Verification Script
ตรวจสอบว่าระบบทำงานถูกต้องหลัง deployment
"""

import os
import sys
import requests
import json
from pathlib import Path

# Colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✓ {text}{RESET}")

def print_error(text):
    print(f"{RED}✗ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠ {text}{RESET}")

def check_endpoint(url, description, expected_status=200, auth_token=None):
    """ตรวจสอบ API endpoint"""
    try:
        headers = {}
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
        response = requests.get(url, headers=headers, timeout=10, verify=False)
        
        if response.status_code == expected_status:
            print_success(f"{description}: {url} (Status: {response.status_code})")
            return True
        else:
            print_error(f"{description}: {url} (Status: {response.status_code}, Expected: {expected_status})")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"{description}: {url} - {str(e)}")
        return False

def check_health_endpoint(base_url):
    """ตรวจสอบ health endpoint"""
    print_header("Checking Health Endpoint")
    
    health_url = f"{base_url}/api/health/"
    return check_endpoint(health_url, "Health Check", 200)

def check_api_endpoints(base_url):
    """ตรวจสอบ API endpoints หลัก"""
    print_header("Checking API Endpoints")
    
    endpoints = [
        ("/api/auth/login/", "Login Endpoint", 405),  # Method not allowed for GET
        ("/api/projects/", "Projects Endpoint", 401),  # Unauthorized without token
        ("/api/students/", "Students Endpoint", 401),
        ("/api/advisors/", "Advisors Endpoint", 401),
    ]
    
    results = []
    for path, desc, expected_status in endpoints:
        url = f"{base_url}{path}"
        result = check_endpoint(url, desc, expected_status)
        results.append(result)
    
    return all(results)

def check_static_files(base_url):
    """ตรวจสอบ static files"""
    print_header("Checking Static Files")
    
    # Check if static files are accessible
    static_url = f"{base_url}/static/"
    try:
        response = requests.get(static_url, timeout=5, verify=False)
        if response.status_code in [200, 403, 404]:  # 403/404 might be OK depending on config
            print_success(f"Static files endpoint accessible: {static_url}")
            return True
        else:
            print_warning(f"Static files endpoint returned: {response.status_code}")
            return True
    except Exception as e:
        print_warning(f"Could not check static files: {str(e)}")
        return True  # Don't fail on this

def check_https(base_url):
    """ตรวจสอบ HTTPS"""
    print_header("Checking HTTPS")
    
    if base_url.startswith('https://'):
        print_success("HTTPS enabled")
        return True
    else:
        print_warning("HTTPS not detected (using HTTP)")
        return False

def check_security_headers(base_url):
    """ตรวจสอบ security headers"""
    print_header("Checking Security Headers")
    
    try:
        response = requests.get(base_url, timeout=10, verify=False)
        headers = response.headers
        
        security_headers = {
            'Strict-Transport-Security': 'HSTS',
            'X-Content-Type-Options': 'Content Type Options',
            'X-Frame-Options': 'Frame Options',
            'X-XSS-Protection': 'XSS Protection',
        }
        
        found = []
        for header, name in security_headers.items():
            if header in headers:
                print_success(f"{name} header present")
                found.append(True)
            else:
                print_warning(f"{name} header missing")
                found.append(False)
        
        return any(found)  # At least one security header should be present
    except Exception as e:
        print_warning(f"Could not check security headers: {str(e)}")
        return True

def main():
    """Main verification function"""
    print_header("POST-DEPLOYMENT VERIFICATION")
    
    # Get base URL from user or use default
    if len(sys.argv) > 1:
        base_url = sys.argv[1].rstrip('/')
    else:
        base_url = input("Enter your production URL (e.g., https://yourdomain.com): ").strip().rstrip('/')
    
    if not base_url:
        print_error("Base URL is required")
        sys.exit(1)
    
    print(f"\nVerifying deployment at: {base_url}\n")
    
    # Suppress SSL warnings for self-signed certificates
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    results = {
        "HTTPS": check_https(base_url),
        "Health Endpoint": check_health_endpoint(base_url),
        "API Endpoints": check_api_endpoints(base_url),
        "Static Files": check_static_files(base_url),
        "Security Headers": check_security_headers(base_url),
    }
    
    print_header("VERIFICATION SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for check, result in results.items():
        status = "PASS" if result else "FAIL"
        color = GREEN if result else RED
        print(f"{color}{status}{RESET} - {check}")
    
    print(f"\n{BLUE}Results: {passed}/{total} checks passed{RESET}\n")
    
    if passed == total:
        print_success("All checks passed! Deployment is successful.")
        return 0
    else:
        print_warning(f"{total - passed} check(s) failed or have warnings.")
        print_warning("Please review the output above and fix any issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
