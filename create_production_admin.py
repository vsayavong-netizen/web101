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

def create_production_admin():
    """สร้าง admin user สำหรับ production"""
    print("🔧 กำลังสร้าง admin user สำหรับ production...")
    
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
        print("   Username: admin")
        print("   Password: admin123")
        print("   Email: admin@eduinfo.online")
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
    
    # สร้าง Profile สำหรับ admin
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
    
    # สร้าง test users เพิ่มเติม
    test_users = [
        {
            'username': 'testadmin',
            'email': 'testadmin@eduinfo.online',
            'first_name': 'Test',
            'last_name': 'Admin',
            'password': 'test123',
            'role': 'Admin'
        },
        {
            'username': 'testadvisor',
            'email': 'testadvisor@eduinfo.online',
            'first_name': 'Test',
            'last_name': 'Advisor',
            'password': 'test123',
            'role': 'Advisor'
        },
        {
            'username': 'teststudent',
            'email': 'teststudent@eduinfo.online',
            'first_name': 'Test',
            'last_name': 'Student',
            'password': 'test123',
            'role': 'Student'
        }
    ]
    
    print("\n🔧 กำลังสร้าง test users...")
    for user_data in test_users:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'is_active': True,
                'is_staff': user_data['role'] == 'Admin',
                'is_superuser': user_data['role'] == 'Admin'
            }
        )
        
        if created:
            user.set_password(user_data['password'])
            user.save()
            
            # สร้าง Profile
            Profile.objects.create(
                user=user,
                role=user_data['role'],
                phone='+66-2-000-0000',
                address='Test Address',
                is_active=True
            )
            
            print(f"✅ สร้าง {user_data['role']} user: {user_data['username']}")
        else:
            print(f"ℹ️  {user_data['role']} user มีอยู่แล้ว: {user_data['username']}")
    
    print("\n🎉 สร้าง users เสร็จสิ้น!")
    print("\n📋 Test Credentials:")
    print("   Admin: admin / admin123")
    print("   Test Admin: testadmin / test123")
    print("   Test Advisor: testadvisor / test123")
    print("   Test Student: teststudent / test123")

def check_existing_users():
    """ตรวจสอบ users ที่มีอยู่ในระบบ"""
    print("🔍 ตรวจสอบ users ที่มีอยู่ในระบบ...")
    
    users = User.objects.all()
    if users.exists():
        print(f"📊 พบ {users.count()} users ในระบบ:")
        for user in users:
            print(f"   - {user.username} ({user.email}) - Active: {user.is_active}")
    else:
        print("❌ ไม่พบ users ในระบบ")

if __name__ == "__main__":
    print("=" * 60)
    print("PRODUCTION ADMIN USER CREATION SCRIPT")
    print("=" * 60)
    
    # ตรวจสอบ users ที่มีอยู่
    check_existing_users()
    
    print("\n" + "=" * 60)
    
    # สร้าง admin user
    create_production_admin()
    
    print("\n" + "=" * 60)
    print("✅ Script ทำงานเสร็จสิ้น!")
    print("=" * 60)
