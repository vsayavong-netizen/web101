#!/usr/bin/env python3
"""
Interactive Environment Setup Script
ช่วยตั้งค่า .env file สำหรับ production
"""

import os
import sys
import secrets
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

def generate_secret_key():
    """Generate Django SECRET_KEY"""
    try:
        # Try Django's method first
        import django
        from django.core.management.utils import get_random_secret_key
        return get_random_secret_key()
    except:
        # Fallback to secrets module
        return secrets.token_urlsafe(50)

def read_env_file(env_path):
    """Read .env file"""
    if not env_path.exists():
        return None
    
    env_vars = {}
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    return env_vars

def write_env_file(env_path, env_vars):
    """Write .env file"""
    # Read original file to preserve comments
    original_lines = []
    if env_path.exists():
        with open(env_path, 'r') as f:
            original_lines = f.readlines()
    
    # Create new content
    new_lines = []
    for line in original_lines:
        stripped = line.strip()
        if stripped and not stripped.startswith('#') and '=' in stripped:
            key = stripped.split('=', 1)[0].strip()
            if key in env_vars:
                new_lines.append(f"{key}={env_vars[key]}\n")
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    
    # Write back
    with open(env_path, 'w') as f:
        f.writelines(new_lines)

def main():
    """Main setup function"""
    print_header("ENVIRONMENT SETUP WIZARD")
    print("This script will help you configure your .env file for production.\n")
    
    env_path = Path("backend/.env")
    
    if not env_path.exists():
        print_error(f".env file not found at {env_path}")
        print_warning("Please run: cp backend/.env.production backend/.env")
        return 1
    
    # Read current values
    env_vars = read_env_file(env_path)
    if not env_vars:
        print_error("Could not read .env file")
        return 1
    
    print("Current configuration will be shown. Press Enter to keep current value.\n")
    
    # 1. SECRET_KEY
    print_header("1. SECRET_KEY")
    current_key = env_vars.get('SECRET_KEY', '')
    if 'CHANGE-THIS' in current_key or not current_key:
        new_key = generate_secret_key()
        print(f"Generated new SECRET_KEY: {new_key[:20]}...")
        confirm = input("Use this key? (Y/n): ").strip().lower()
        if confirm != 'n':
            env_vars['SECRET_KEY'] = new_key
            print_success("SECRET_KEY updated")
        else:
            custom_key = input("Enter your SECRET_KEY: ").strip()
            if custom_key:
                env_vars['SECRET_KEY'] = custom_key
                print_success("SECRET_KEY updated")
    else:
        print(f"Current SECRET_KEY: {current_key[:20]}...")
        change = input("Change SECRET_KEY? (y/N): ").strip().lower()
        if change == 'y':
            new_key = generate_secret_key()
            print(f"Generated new SECRET_KEY: {new_key[:20]}...")
            env_vars['SECRET_KEY'] = new_key
            print_success("SECRET_KEY updated")
    
    # 2. ALLOWED_HOSTS
    print_header("2. ALLOWED_HOSTS")
    current_hosts = env_vars.get('ALLOWED_HOSTS', '')
    print(f"Current: {current_hosts}")
    if 'yourdomain.com' in current_hosts:
        new_hosts = input("Enter your domain(s) (comma-separated): ").strip()
        if new_hosts:
            env_vars['ALLOWED_HOSTS'] = new_hosts
            print_success("ALLOWED_HOSTS updated")
    else:
        change = input("Change ALLOWED_HOSTS? (y/N): ").strip().lower()
        if change == 'y':
            new_hosts = input("Enter your domain(s) (comma-separated): ").strip()
            if new_hosts:
                env_vars['ALLOWED_HOSTS'] = new_hosts
    
    # 3. Database Configuration
    print_header("3. Database Configuration")
    print("Current database settings:")
    print(f"  DB_NAME: {env_vars.get('DB_NAME', '')}")
    print(f"  DB_USER: {env_vars.get('DB_USER', '')}")
    print(f"  DB_PASSWORD: {env_vars.get('DB_PASSWORD', '')}")
    
    if 'your_db_user' in env_vars.get('DB_USER', ''):
        print_warning("Database configuration needs to be updated!")
        update_db = input("Update database configuration now? (Y/n): ").strip().lower()
        if update_db != 'n':
            db_name = input(f"Database name [{env_vars.get('DB_NAME', 'final_project_management')}]: ").strip()
            if db_name:
                env_vars['DB_NAME'] = db_name
            
            db_user = input(f"Database user [{env_vars.get('DB_USER', 'your_db_user')}]: ").strip()
            if db_user:
                env_vars['DB_USER'] = db_user
            
            db_password = input("Database password: ").strip()
            if db_password:
                env_vars['DB_PASSWORD'] = db_password
            
            print_success("Database configuration updated")
    
    # 4. CORS Origins
    print_header("4. CORS & CSRF Origins")
    current_cors = env_vars.get('CORS_ALLOWED_ORIGINS', '')
    print(f"Current CORS_ALLOWED_ORIGINS: {current_cors}")
    
    if 'yourdomain.com' in current_cors:
        new_cors = input("Enter CORS allowed origins (comma-separated, with https://): ").strip()
        if new_cors:
            env_vars['CORS_ALLOWED_ORIGINS'] = new_cors
            env_vars['CSRF_TRUSTED_ORIGINS'] = new_cors
            print_success("CORS and CSRF origins updated")
    
    # 5. Static & Media Paths
    print_header("5. Static & Media Paths")
    current_static = env_vars.get('STATIC_ROOT', '')
    current_media = env_vars.get('MEDIA_ROOT', '')
    print(f"Current STATIC_ROOT: {current_static}")
    print(f"Current MEDIA_ROOT: {current_media}")
    
    if '/var/www/yourdomain' in current_static:
        print_warning("Static/Media paths need to be updated!")
        update_paths = input("Update paths? (Y/n): ").strip().lower()
        if update_paths != 'n':
            # Extract domain from ALLOWED_HOSTS if available
            domain = env_vars.get('ALLOWED_HOSTS', '').split(',')[0] if env_vars.get('ALLOWED_HOSTS') else 'yourdomain'
            default_static = f"/var/www/{domain}/static"
            default_media = f"/var/www/{domain}/media"
            
            static_path = input(f"STATIC_ROOT [{default_static}]: ").strip()
            if static_path:
                env_vars['STATIC_ROOT'] = static_path
            else:
                env_vars['STATIC_ROOT'] = default_static
            
            media_path = input(f"MEDIA_ROOT [{default_media}]: ").strip()
            if media_path:
                env_vars['MEDIA_ROOT'] = media_path
            else:
                env_vars['MEDIA_ROOT'] = default_media
            
            print_success("Paths updated")
    
    # Write updated values
    print_header("Saving Configuration")
    write_env_file(env_path, env_vars)
    print_success(f"Configuration saved to {env_path}")
    
    # Summary
    print_header("CONFIGURATION SUMMARY")
    print(f"SECRET_KEY: {env_vars.get('SECRET_KEY', '')[:20]}...")
    print(f"ALLOWED_HOSTS: {env_vars.get('ALLOWED_HOSTS', '')}")
    print(f"DB_NAME: {env_vars.get('DB_NAME', '')}")
    print(f"DB_USER: {env_vars.get('DB_USER', '')}")
    print(f"CORS_ALLOWED_ORIGINS: {env_vars.get('CORS_ALLOWED_ORIGINS', '')}")
    print(f"STATIC_ROOT: {env_vars.get('STATIC_ROOT', '')}")
    print(f"MEDIA_ROOT: {env_vars.get('MEDIA_ROOT', '')}")
    
    print_header("NEXT STEPS")
    print("1. Review the configuration above")
    print("2. Update any remaining values manually if needed")
    print("3. Run: python3 pre_deployment_check.py")
    print("4. Run: bash deploy_production_automated.sh")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
