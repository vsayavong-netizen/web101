#!/usr/bin/env python3
"""
Fix authentication 400 error
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.management import execute_from_command_line
from django.conf import settings

def fix_auth_issues():
    """Fix authentication issues"""
    print("🔧 Fixing authentication issues...")
    
    # Check if superuser exists
    User = get_user_model()
    
    try:
        # Try to get admin user
        admin_user = User.objects.get(username='admin')
        print(f"✅ Admin user exists: {admin_user.username}")
        
        # Check if user is active
        if not admin_user.is_active:
            admin_user.is_active = True
            admin_user.save()
            print("✅ Activated admin user")
        
        # Check if user has password
        if not admin_user.has_usable_password():
            admin_user.set_password('admin123')
            admin_user.save()
            print("✅ Set password for admin user")
        
        # Test authentication
        from django.contrib.auth import authenticate
        user = authenticate(username='admin', password='admin123')
        if user:
            print("✅ Authentication test passed")
        else:
            print("❌ Authentication test failed")
            
    except User.DoesNotExist:
        print("❌ Admin user does not exist")
        print("Creating admin user...")
        
        # Create admin user
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@eduinfo.online',
            password='admin123',
            first_name='Admin',
            last_name='User',
            role='admin',
            academic_year='2024-2025'
        )
        admin_user.is_active = True
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print("✅ Created admin user")
    
    # Check JWT settings
    print("\n🔍 Checking JWT settings...")
    try:
        from rest_framework_simplejwt.settings import api_settings
        print(f"✅ JWT settings loaded")
        print(f"   - ACCESS_TOKEN_LIFETIME: {api_settings.ACCESS_TOKEN_LIFETIME}")
        print(f"   - REFRESH_TOKEN_LIFETIME: {api_settings.REFRESH_TOKEN_LIFETIME}")
    except Exception as e:
        print(f"❌ JWT settings error: {e}")
    
    # Check CORS settings
    print("\n🔍 Checking CORS settings...")
    try:
        cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        print(f"✅ CORS allowed origins: {cors_origins}")
        
        cors_allow_all = getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)
        print(f"✅ CORS allow all origins: {cors_allow_all}")
    except Exception as e:
        print(f"❌ CORS settings error: {e}")
    
    print("\n🎯 Authentication fix completed!")

if __name__ == "__main__":
    fix_auth_issues()
