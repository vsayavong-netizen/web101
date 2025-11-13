#!/usr/bin/env python3
"""
Pre-Deployment Validation Script
ตรวจสอบความพร้อมของระบบก่อน deployment
"""

import os
import sys
import subprocess
from pathlib import Path

# Colors for output
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

def check_file_exists(filepath, description):
    """ตรวจสอบว่าไฟล์มีอยู่หรือไม่"""
    if os.path.exists(filepath):
        print_success(f"{description}: {filepath}")
        return True
    else:
        print_error(f"{description}: {filepath} - NOT FOUND")
        return False

def check_env_file():
    """ตรวจสอบไฟล์ .env"""
    print_header("Checking Environment Files")
    
    env_production = Path("backend/.env.production")
    env_file = Path("backend/.env")
    
    if env_production.exists():
        print_success(f".env.production exists")
        
        # Check if .env exists or needs to be created
        if not env_file.exists():
            print_warning(".env file not found. You need to copy .env.production to .env")
            print_warning("Run: cp backend/.env.production backend/.env")
            return False
        else:
            print_success(".env file exists")
            return True
    else:
        print_error(".env.production not found")
        return False

def check_database_config():
    """ตรวจสอบการตั้งค่า database"""
    print_header("Checking Database Configuration")
    
    env_file = Path("backend/.env")
    if not env_file.exists():
        print_error("Cannot check database config - .env file not found")
        return False
    
    # Read .env file
    with open(env_file, 'r') as f:
        content = f.read()
    
    checks = {
        "DB_ENGINE": "django.db.backends.postgresql" in content,
        "DB_NAME": "DB_NAME=" in content and "your_database" not in content,
        "DB_USER": "DB_USER=" in content and "your_db_user" not in content,
        "DB_PASSWORD": "DB_PASSWORD=" in content and "your_strong_password" not in content,
    }
    
    all_passed = True
    for key, passed in checks.items():
        if passed:
            print_success(f"{key} configured")
        else:
            print_error(f"{key} not properly configured")
            all_passed = False
    
    return all_passed

def check_security_settings():
    """ตรวจสอบการตั้งค่า security"""
    print_header("Checking Security Settings")
    
    env_file = Path("backend/.env")
    if not env_file.exists():
        print_error("Cannot check security settings - .env file not found")
        return False
    
    with open(env_file, 'r') as f:
        content = f.read()
    
    checks = {
        "DEBUG=False": "DEBUG=False" in content,
        "SECURE_SSL_REDIRECT=True": "SECURE_SSL_REDIRECT=True" in content,
        "SESSION_COOKIE_SECURE=True": "SESSION_COOKIE_SECURE=True" in content,
        "CSRF_COOKIE_SECURE=True": "CSRF_COOKIE_SECURE=True" in content,
    }
    
    all_passed = True
    for key, passed in checks.items():
        if passed:
            print_success(f"{key}")
        else:
            print_error(f"{key} not set")
            all_passed = False
    
    return all_passed

def check_dependencies():
    """ตรวจสอบ dependencies"""
    print_header("Checking Dependencies")
    
    requirements_file = Path("backend/requirements.txt")
    if not requirements_file.exists():
        print_error("requirements.txt not found")
        return False
    
    print_success("requirements.txt exists")
    
    # Check if virtual environment is recommended
    if not os.environ.get('VIRTUAL_ENV'):
        print_warning("Virtual environment not detected. Recommended to use venv")
    
    return True

def check_migrations():
    """ตรวจสอบ migrations"""
    print_header("Checking Migrations")
    
    migrations_dir = Path("backend")
    apps = ["accounts", "projects", "students", "advisors", "milestones"]
    
    all_passed = True
    for app in apps:
        app_migrations = migrations_dir / app / "migrations"
        if app_migrations.exists():
            migration_files = list(app_migrations.glob("*.py"))
            if len(migration_files) > 1:  # More than __init__.py
                print_success(f"{app} migrations exist")
            else:
                print_warning(f"{app} has no migrations")
        else:
            print_warning(f"{app} migrations directory not found")
    
    return all_passed

def check_static_files():
    """ตรวจสอบ static files configuration"""
    print_header("Checking Static Files Configuration")
    
    env_file = Path("backend/.env")
    if not env_file.exists():
        print_error("Cannot check static files - .env file not found")
        return False
    
    with open(env_file, 'r') as f:
        content = f.read()
    
    if "STATIC_ROOT=" in content:
        print_success("STATIC_ROOT configured")
    else:
        print_warning("STATIC_ROOT not configured")
    
    if "MEDIA_ROOT=" in content:
        print_success("MEDIA_ROOT configured")
    else:
        print_warning("MEDIA_ROOT not configured")
    
    return True

def check_frontend_build():
    """ตรวจสอบ frontend build"""
    print_header("Checking Frontend")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print_error("frontend directory not found")
        return False
    
    print_success("frontend directory exists")
    
    # Check if dist directory exists (after build)
    dist_dir = frontend_dir / "dist"
    if dist_dir.exists():
        print_success("Frontend build (dist) exists")
    else:
        print_warning("Frontend build (dist) not found. Run: cd frontend && npm run build")
    
    return True

def main():
    """Main validation function"""
    print_header("PRE-DEPLOYMENT VALIDATION")
    print("This script will check if your system is ready for production deployment.\n")
    
    results = {
        "Environment Files": check_env_file(),
        "Database Configuration": check_database_config(),
        "Security Settings": check_security_settings(),
        "Dependencies": check_dependencies(),
        "Migrations": check_migrations(),
        "Static Files": check_static_files(),
        "Frontend": check_frontend_build(),
    }
    
    print_header("VALIDATION SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for check, result in results.items():
        status = "PASS" if result else "FAIL"
        color = GREEN if result else RED
        print(f"{color}{status}{RESET} - {check}")
    
    print(f"\n{BLUE}Results: {passed}/{total} checks passed{RESET}\n")
    
    if passed == total:
        print_success("All checks passed! System is ready for deployment.")
        return 0
    else:
        print_error(f"{total - passed} check(s) failed. Please fix the issues before deployment.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
