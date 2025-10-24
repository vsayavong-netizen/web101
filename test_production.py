#!/usr/bin/env python3
"""
Test script to verify production deployment is working correctly.
Tests the live website at https://eduinfo.online
"""

import requests
import sys
from urllib.parse import urljoin
import time

def test_production_site():
    """
    Test the production website for asset loading and MIME types.
    """
    base_url = "https://eduinfo.online"
    
    print("Testing Production Website")
    print("=" * 50)
    print(f"Testing URL: {base_url}")
    print()
    
    # Test main page
    print("1. Testing main page...")
    try:
        response = requests.get(base_url, timeout=10)
        if response.status_code == 200:
            print("   OK Main page loads successfully")
            
            # Check if HTML contains correct asset paths
            content = response.text
            if "/static/assets/" in content:
                print("   OK HTML contains correct /static/assets/ paths")
            else:
                print("   WARNING HTML may still contain /assets/ paths")
        else:
            print(f"   ERROR Main page failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"   ERROR Main page error: {e}")
        return False
    
    # Test CSS file
    print("\n2. Testing CSS file...")
    css_url = urljoin(base_url, "/static/assets/index-CmzFPlXl.css")
    try:
        response = requests.head(css_url, timeout=10)
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            if 'text/css' in content_type:
                print("   OK CSS file loads with correct MIME type (text/css)")
            else:
                print(f"   ERROR CSS file has wrong MIME type: {content_type}")
                return False
        else:
            print(f"   ERROR CSS file failed: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"   ERROR CSS file error: {e}")
        return False
    
    # Test JavaScript files
    js_files = [
        "index-DvwsR5qq.js",
        "vendor-Dvwkxfce.js", 
        "ui-BN57xHbl.js"
    ]
    
    print("\n3. Testing JavaScript files...")
    for js_file in js_files:
        js_url = urljoin(base_url, f"/static/assets/{js_file}")
        try:
            response = requests.head(js_url, timeout=10)
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                if 'javascript' in content_type:
                    print(f"   OK {js_file}: Correct MIME type")
                else:
                    print(f"   WARNING {js_file}: MIME type {content_type}")
            else:
                print(f"   ERROR {js_file}: HTTP {response.status_code}")
                return False
        except Exception as e:
            print(f"   ERROR {js_file}: Error {e}")
            return False
    
    print("\n" + "=" * 50)
    print("OK All tests passed! Production deployment is working correctly.")
    return True

def main():
    """
    Main function to run production tests.
    """
    print("Production Deployment Test")
    print("Waiting for deployment to complete...")
    print("(This may take 2-3 minutes)")
    print()
    
    # Wait a bit for deployment
    time.sleep(30)
    
    # Run tests with retries
    max_retries = 3
    for attempt in range(max_retries):
        print(f"Attempt {attempt + 1}/{max_retries}")
        if test_production_site():
            return 0
        else:
            if attempt < max_retries - 1:
                print("\nRetrying in 30 seconds...")
                time.sleep(30)
    
    print("\n" + "=" * 50)
    print("ERROR Some tests failed. Please check the deployment.")
    return 1

if __name__ == "__main__":
    sys.exit(main())
