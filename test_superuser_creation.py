#!/usr/bin/env python
"""
ทดสอบการสร้าง superuser โดยใช้ข้อมูลจาก .env file
"""

import os
import sys
import django

# ตั้งค่า Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def test_superuser_creation():
    """ทดสอบการสร้าง superuser"""
    print("🧪 ทดสอบการสร้าง superuser...")
    print("=" * 60)
    
    # ข้อมูลจาก .env file (hardcoded สำหรับการทดสอบ)
    superuser_username = 'myname'
    superuser_email = 'myname@eduinfo.online'
    superuser_password = 'mynamekasi'
    superuser_first_name = 'Myname'
    superuser_last_name = 'Kasi'
    
    print(f"📋 ข้อมูล Superuser:")
    print(f"   Username: {superuser_username}")
    print(f"   Email: {superuser_email}")
    print(f"   First Name: {superuser_first_name}")
    print(f"   Last Name: {superuser_last_name}")
    print(f"   Password: {'*' * len(superuser_password)}")
    print()
    
    try:
        # ตรวจสอบ superuser ที่มีอยู่
        existing_superusers = User.objects.filter(is_superuser=True)
        print(f"📊 พบ superuser ที่มีอยู่: {existing_superusers.count()} users")
        
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
        print(f"   Active: {admin_user.is_active}")
        print(f"   Staff: {admin_user.is_staff}")
        print(f"   Superuser: {admin_user.is_superuser}")
        
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
        print("\n📋 ข้อมูลการเข้าสู่ระบบ:")
        print(f"   Username: {superuser_username}")
        print(f"   Password: {superuser_password}")
        
        return True
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("SUPERUSER CREATION TEST")
    print("=" * 60)
    
    success = test_superuser_creation()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ การทดสอบสำเร็จ!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ การทดสอบล้มเหลว!")
        print("=" * 60)
        sys.exit(1)
