#!/usr/bin/env python
"""
Script สำหรับสร้าง superuser ใน production database
ใช้ Django management command และอ่านค่าจาก .env file
"""

import os
import sys
import django
from django.core.management import execute_from_command_line
from decouple import config

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser_production():
    """สร้าง superuser สำหรับ production จาก .env file"""
    print("🔧 กำลังสร้าง superuser สำหรับ production จาก .env file...")
    print("=" * 60)
    
    # อ่านค่าจาก environment variables
    superuser_username = config('SUPERUSER_USERNAME', default='admin')
    superuser_email = config('SUPERUSER_EMAIL', default='admin@eduinfo.online')
    superuser_password = config('SUPERUSER_PASSWORD', default='admin123')
    superuser_first_name = config('SUPERUSER_FIRST_NAME', default='System')
    superuser_last_name = config('SUPERUSER_LAST_NAME', default='Administrator')
    
    print(f"📋 การตั้งค่า Superuser จาก .env:")
    print(f"   Username: {superuser_username}")
    print(f"   Email: {superuser_email}")
    print(f"   First Name: {superuser_first_name}")
    print(f"   Last Name: {superuser_last_name}")
    print(f"   Password: {'*' * len(superuser_password)}")
    print()
    
    # ตรวจสอบว่ามี superuser อยู่แล้วหรือไม่
    existing_superusers = User.objects.filter(is_superuser=True)
    if existing_superusers.exists():
        print(f"📊 พบ superuser ที่มีอยู่แล้ว: {existing_superusers.count()} users")
        for user in existing_superusers:
            print(f"   - {user.username} ({user.email}) - Active: {user.is_active}")
        print()
    
    # สร้าง superuser ใหม่
    print("📝 สร้าง superuser ใหม่...")
    print(f"   Username: {superuser_username}")
    print(f"   Email: {superuser_email}")
    print(f"   Password: {'*' * len(superuser_password)}")
    print()
    
    try:
        # สร้าง superuser
        admin_user, created = User.objects.get_or_create(
            username=superuser_username,
            defaults={
                'email': superuser_email,
                'first_name': superuser_first_name,
                'last_name': superuser_last_name,
                'is_active': True,
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            admin_user.set_password(superuser_password)
            admin_user.save()
            print("✅ สร้าง superuser สำเร็จ!")
        else:
            # อัปเดต superuser ที่มีอยู่
            admin_user.email = superuser_email
            admin_user.first_name = superuser_first_name
            admin_user.last_name = superuser_last_name
            admin_user.set_password(superuser_password)
            admin_user.is_active = True
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
            print("✅ อัปเดต superuser สำเร็จ!")
        
        print(f"   Username: {admin_user.username}")
        print(f"   Email: {admin_user.email}")
        print(f"   First Name: {admin_user.first_name}")
        print(f"   Last Name: {admin_user.last_name}")
        print(f"   Password: {'*' * len(superuser_password)}")
        print(f"   Active: {admin_user.is_active}")
        print(f"   Staff: {admin_user.is_staff}")
        print(f"   Superuser: {admin_user.is_superuser}")
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return False
    
    # ทดสอบ login
    print("\n🧪 ทดสอบ login...")
    from django.contrib.auth import authenticate
    test_user = authenticate(username=superuser_username, password=superuser_password)
    if test_user:
        print("✅ ทดสอบ login สำเร็จ!")
        print(f"   User: {test_user.username}")
        print(f"   Active: {test_user.is_active}")
        print(f"   Staff: {test_user.is_staff}")
        print(f"   Superuser: {test_user.is_superuser}")
    else:
        print("❌ ทดสอบ login ล้มเหลว!")
        return False
    
    print("\n🎉 การสร้าง superuser เสร็จสิ้น!")
    print("\n📋 Test Credentials:")
    print(f"   Username: {superuser_username}")
    print(f"   Password: {superuser_password}")
    print("   URL: https://eduinfo.online/api/auth/login/")
    
    return True

def check_existing_users():
    """ตรวจสอบ users ที่มีอยู่ในระบบ"""
    print("🔍 ตรวจสอบ users ที่มีอยู่ในระบบ...")
    
    users = User.objects.all()
    if users.exists():
        print(f"📊 พบ {users.count()} users ในระบบ:")
        for user in users:
            print(f"   - {user.username} ({user.email}) - Active: {user.is_active}")
            print(f"     Staff: {user.is_staff} | Superuser: {user.is_superuser}")
    else:
        print("❌ ไม่พบ users ในระบบ")

if __name__ == "__main__":
    print("=" * 60)
    print("PRODUCTION SUPERUSER CREATION SCRIPT")
    print("=" * 60)
    
    # ตรวจสอบ users ที่มีอยู่
    check_existing_users()
    
    print("\n" + "=" * 60)
    
    # สร้าง superuser
    success = create_superuser_production()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ Script ทำงานเสร็จสิ้น!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ Script ล้มเหลว!")
        print("=" * 60)
        sys.exit(1)
