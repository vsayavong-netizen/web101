#!/usr/bin/env python3
"""
Test script to verify production deployment
Tests MIME types, asset loading, and overall functionality
"""

import requests
import sys
from urllib.parse import urljoin

def test_mime_types(base_url):
    """Test that static files are served with correct MIME types"""
    print("Testing MIME Types...")
    
    # Test CSS file
    css_url = urljoin(base_url, "/static/assets/index-CmzFPlXl.css")
    try:
        response = requests.head(css_url, timeout=10)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            if 'text/css' in content_type:
                print("OK CSS file: Correct MIME type (text/css)")
            else:
                print(f"ERROR CSS file: Wrong MIME type ({content_type})")
                return False
        else:
            print(f"ERROR CSS file: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR CSS file: Error - {e}")
        return False
    
    # Test JavaScript file
    js_url = urljoin(base_url, "/static/assets/index-DvwsR5qq.js")
    try:
        response = requests.head(js_url, timeout=10)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            if 'text/javascript' in content_type or 'application/javascript' in content_type:
                print("OK JS file: Correct MIME type (text/javascript)")
            else:
                print(f"ERROR JS file: Wrong MIME type ({content_type})")
                return False
        else:
            print(f"ERROR JS file: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR JS file: Error - {e}")
        return False
    
    return True

def test_asset_loading(base_url):
    """Test that all required assets are accessible"""
    print("\nTESTING Testing Asset Loading...")
    
    assets = [
        "/static/assets/index-CmzFPlXl.css",
        "/static/assets/index-DvwsR5qq.js",
        "/static/assets/vendor-Dvwkxfce.js",
        "/static/assets/ui-BN57xHbl.js"
    ]
    
    all_loaded = True
    for asset in assets:
        url = urljoin(base_url, asset)
        try:
            response = requests.head(url, timeout=10)
            if response.status_code == 200:
                print(f"OK {asset}: Loaded successfully")
            else:
                print(f"ERROR {asset}: HTTP {response.status_code}")
                all_loaded = False
        except Exception as e:
            print(f"ERROR {asset}: Error - {e}")
            all_loaded = False
    
    return all_loaded

def test_main_page(base_url):
    """Test that the main page loads correctly"""
    print("\nTESTING Testing Main Page...")
    
    try:
        response = requests.get(base_url, timeout=10)
        if response.status_code == 200:
            print("OK Main page: Loaded successfully")
            
            # Check if HTML contains references to our assets
            content = response.text
            if "index-CmzFPlXl.css" in content:
                print("OK Main page: Contains CSS reference")
            else:
                print("ERROR Main page: Missing CSS reference")
                return False
                
            if "index-DvwsR5qq.js" in content:
                print("OK Main page: Contains JS reference")
            else:
                print("ERROR Main page: Missing JS reference")
                return False
                
            return True
        else:
            print(f"ERROR Main page: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"ERROR Main page: Error - {e}")
        return False

def test_security_headers(base_url):
    """Test that security headers are present"""
    print("\nTESTING Testing Security Headers...")
    
    try:
        response = requests.head(base_url, timeout=10)
        headers = response.headers
        
        security_headers = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection'
        ]
        
        for header in security_headers:
            if header in headers:
                print(f"OK {header}: Present")
            else:
                print(f"WARNING  {header}: Missing (optional)")
        
        return True
    except Exception as e:
        print(f"ERROR Security headers: Error - {e}")
        return False

def main():
    """Main test function"""
    print("Production Deployment Test")
    print("=" * 50)
    
    # Get base URL from command line or use default
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:8000"
    
    print(f"Testing URL: {base_url}")
    print()
    
    # Run all tests
    tests = [
        test_mime_types,
        test_asset_loading,
        test_main_page,
        test_security_headers
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test(base_url):
                passed += 1
        except Exception as e:
            print(f"ERROR Test failed with error: {e}")
    
    print("\n" + "=" * 50)
    print(f"RESULTS Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("SUCCESS All tests passed! Deployment is successful!")
        return 0
    else:
        print("WARNING  Some tests failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
