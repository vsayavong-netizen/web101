#!/usr/bin/env python
"""
Script สำหรับตรวจสอบ users ที่มีอยู่ใน production database
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import User as CustomUser, Profile

User = get_user_model()

def check_production_users():
    """ตรวจสอบ users ที่มีอยู่ใน production database"""
    print("🔍 ตรวจสอบ users ใน production database...")
    print("=" * 60)
    
    # ตรวจสอบ Django User model
    django_users = User.objects.all()
    print(f"📊 Django Users: {django_users.count()} users")
    
    if django_users.exists():
        print("\n📋 Django Users List:")
        for user in django_users:
            print(f"   - Username: {user.username}")
            print(f"     Email: {user.email}")
            print(f"     Name: {user.first_name} {user.last_name}")
            print(f"     Active: {user.is_active}")
            print(f"     Staff: {user.is_staff}")
            print(f"     Superuser: {user.is_superuser}")
            print(f"     Last Login: {user.last_login}")
            print("     " + "-" * 40)
    else:
        print("❌ ไม่พบ Django users ในระบบ")
    
    # ตรวจสอบ Custom User model
    try:
        custom_users = CustomUser.objects.all()
        print(f"\n📊 Custom Users: {custom_users.count()} users")
        
        if custom_users.exists():
            print("\n📋 Custom Users List:")
            for user in custom_users:
                print(f"   - Username: {user.username}")
                print(f"     Email: {user.email}")
                print(f"     Role: {getattr(user, 'role', 'N/A')}")
                print(f"     Active: {user.is_active}")
                print("     " + "-" * 40)
        else:
            print("❌ ไม่พบ Custom users ในระบบ")
    except Exception as e:
        print(f"⚠️  ไม่สามารถเข้าถึง Custom User model: {e}")
    
    # ตรวจสอบ Profiles
    try:
        profiles = Profile.objects.all()
        print(f"\n📊 Profiles: {profiles.count()} profiles")
        
        if profiles.exists():
            print("\n📋 Profiles List:")
            for profile in profiles:
                print(f"   - User: {profile.user.username if hasattr(profile, 'user') else 'N/A'}")
                print(f"     Role: {getattr(profile, 'role', 'N/A')}")
                print(f"     Phone: {getattr(profile, 'phone', 'N/A')}")
                print(f"     Active: {getattr(profile, 'is_active', 'N/A')}")
                print("     " + "-" * 40)
        else:
            print("❌ ไม่พบ Profiles ในระบบ")
    except Exception as e:
        print(f"⚠️  ไม่สามารถเข้าถึง Profile model: {e}")
    
    print("\n" + "=" * 60)
    print("✅ การตรวจสอบเสร็จสิ้น!")

def test_login_credentials():
    """ทดสอบ login credentials"""
    print("\n🧪 ทดสอบ login credentials...")
    print("=" * 60)
    
    test_credentials = [
        ('admin', 'admin123'),
        ('admin', 'admin'),
        ('testadmin', 'test123'),
        ('testadvisor', 'test123'),
        ('teststudent', 'test123'),
    ]
    
    from django.contrib.auth import authenticate
    
    for username, password in test_credentials:
        user = authenticate(username=username, password=password)
        if user:
            print(f"✅ {username} / {password} - SUCCESS")
            print(f"   User: {user.username}")
            print(f"   Active: {user.is_active}")
            print(f"   Staff: {user.is_staff}")
        else:
            print(f"❌ {username} / {password} - FAILED")
        print("   " + "-" * 30)

if __name__ == "__main__":
    print("=" * 60)
    print("PRODUCTION USERS CHECKER")
    print("=" * 60)
    
    # ตรวจสอบ users
    check_production_users()
    
    # ทดสอบ credentials
    test_login_credentials()
    
    print("\n" + "=" * 60)
    print("✅ Script ทำงานเสร็จสิ้น!")
    print("=" * 60)
