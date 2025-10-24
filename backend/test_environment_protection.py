#!/usr/bin/env python
"""
Test Environment Protection Middleware
Verify that sensitive files are properly protected
"""

import requests
import sys

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def test_endpoint(base_url, path, expected_status=403):
    """Test a single endpoint"""
    url = f"{base_url}{path}"
    try:
        response = requests.get(url, timeout=5)
        status = response.status_code
        
        if status == expected_status:
            print(f"{GREEN}✓{RESET} {path:40s} - Blocked (403)")
            return True
        elif status == 404:
            print(f"{YELLOW}⚠{RESET} {path:40s} - Not Found (404) - Should be 403!")
            return False
        else:
            print(f"{RED}✗{RESET} {path:40s} - Unexpected ({status})")
            return False
    except requests.exceptions.RequestException as e:
        print(f"{RED}✗{RESET} {path:40s} - Error: {str(e)[:30]}")
        return False


def main():
    """Main test function"""
    if len(sys.argv) < 2:
        print(f"{BLUE}Usage:{RESET} python test_environment_protection.py <base_url>")
        print(f"{BLUE}Example:{RESET} python test_environment_protection.py https://eduinfo.online")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}Environment Protection Middleware Test{RESET}")
    print(f"{BLUE}{'='*70}{RESET}")
    print(f"Testing: {base_url}\n")
    
    # Test cases
    test_cases = [
        # Environment files
        ("/.env", "Environment file"),
        ("/.env.local", "Local environment file"),
        ("/.env.production", "Production environment file"),
        
        # Version control
        ("/.git", "Git directory"),
        ("/.git/config", "Git config"),
        ("/.gitignore", "Git ignore file"),
        
        # Configuration files
        ("/settings.py", "Django settings"),
        ("/config.json", "Config file"),
        
        # Database files
        ("/db.sqlite3", "SQLite database"),
        
        # Backup files
        ("/backup.bak", "Backup file"),
        
        # SSH keys
        ("/id_rsa", "SSH private key"),
        ("/server.pem", "PEM certificate"),
        
        # Path traversal
        ("/../../../etc/passwd", "Path traversal"),
        ("/..%2F..%2F..%2Fetc%2Fpasswd", "Encoded path traversal"),
        
        # Malicious PHP files from logs
        ("/chosen.php", "Malicious PHP"),
        ("/alfa.php", "Malicious PHP"),
        ("/.env", "Environment file (duplicate test)"),
    ]
    
    print(f"{YELLOW}Testing Environment Protection:{RESET}\n")
    
    passed = 0
    failed = 0
    
    for path, description in test_cases:
        if test_endpoint(base_url, path):
            passed += 1
        else:
            failed += 1
    
    # Summary
    print(f"\n{BLUE}{'='*70}{RESET}")
    print(f"{BLUE}Test Summary:{RESET}")
    print(f"{BLUE}{'='*70}{RESET}")
    print(f"{GREEN}Passed:{RESET} {passed}/{len(test_cases)}")
    print(f"{RED}Failed:{RESET} {failed}/{len(test_cases)}")
    
    if failed == 0:
        print(f"\n{GREEN}✓ All tests passed! Environment protection is working correctly.{RESET}")
    else:
        print(f"\n{YELLOW}⚠ Some tests failed. Check middleware configuration.{RESET}")
    
    print(f"{BLUE}{'='*70}{RESET}\n")
    
    # Additional tests
    print(f"\n{YELLOW}Testing Rate Limiting:{RESET}")
    print("Making 35 rapid requests (limit is 30/min)...")
    
    blocked = 0
    for i in range(35):
        try:
            response = requests.get(f"{base_url}/api/", timeout=2)
            if response.status_code == 429:
                blocked += 1
        except:
            pass
    
    if blocked > 0:
        print(f"{GREEN}✓{RESET} Rate limiting is working ({blocked} requests blocked)")
    else:
        print(f"{YELLOW}⚠{RESET} Rate limiting may not be working (no 429 responses)")
    
    print(f"\n{BLUE}Test complete!{RESET}\n")


if __name__ == '__main__':
    main()

