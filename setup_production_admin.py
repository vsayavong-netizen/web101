#!/usr/bin/env python
"""
Script สำหรับสร้าง admin user ใน production database
ใช้สำหรับแก้ไขปัญหา login ที่ไม่มี user ในระบบ
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

def setup_production_admin():
    """สร้าง admin user สำหรับ production"""
    print("🔧 กำลังตั้งค่า admin user สำหรับ production...")
    
    # สร้าง admin user
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@eduinfo.online',
            'first_name': 'System',
            'last_name': 'Administrator',
            'is_active': True,
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("✅ สร้าง admin user สำเร็จ!")
    else:
        # Reset password if user exists
        admin_user.set_password('admin123')
        admin_user.is_active = True
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print("✅ อัปเดต admin user สำเร็จ!")
    
    print("   Username: admin")
    print("   Password: admin123")
    print("   Email: admin@eduinfo.online")
    
    # สร้าง Profile สำหรับ admin
    try:
        profile, profile_created = Profile.objects.get_or_create(
            user=admin_user,
            defaults={
                'role': 'Admin',
                'phone': '+66-2-000-0000',
                'address': 'System Administration',
                'is_active': True
            }
        )
        
        if profile_created:
            print("✅ สร้าง admin profile สำเร็จ!")
        else:
            print("✅ Admin profile มีอยู่แล้ว!")
    except Exception as e:
        print(f"⚠️  ไม่สามารถสร้าง Profile: {e}")
    
    # ทดสอบ login
    from django.contrib.auth import authenticate
    test_user = authenticate(username='admin', password='admin123')
    if test_user:
        print("✅ ทดสอบ login สำเร็จ!")
        print(f"   User: {test_user.username}")
        print(f"   Active: {test_user.is_active}")
        print(f"   Staff: {test_user.is_staff}")
    else:
        print("❌ ทดสอบ login ล้มเหลว!")
    
    print("\n🎉 การตั้งค่าเสร็จสิ้น!")
    print("\n📋 Test Credentials:")
    print("   Username: admin")
    print("   Password: admin123")
    print("   URL: https://eduinfo.online/api/auth/login/")

if __name__ == "__main__":
    print("=" * 60)
    print("PRODUCTION ADMIN SETUP SCRIPT")
    print("=" * 60)
    
    # ตั้งค่า admin user
    setup_production_admin()
    
    print("\n" + "=" * 60)
    print("✅ Script ทำงานเสร็จสิ้น!")
    print("=" * 60)
