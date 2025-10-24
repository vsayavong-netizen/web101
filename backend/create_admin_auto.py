#!/usr/bin/env python
"""
Auto Create Admin Script
สร้าง Admin account อัตโนมัติสำหรับ Production

วิธีใช้:
python create_admin_auto.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Error setting up Django: {e}")
    sys.exit(1)

from django.contrib.auth import get_user_model

User = get_user_model()

def create_admin():
    """สร้าง Admin account อัตโนมัติ"""
    
    print("🚀 Starting Auto Admin Creation...")
    
    # ตรวจสอบว่ามี admin อยู่แล้วหรือไม่
    if User.objects.filter(username='admin').exists():
        print("✅ Admin account already exists!")
        admin = User.objects.get(username='admin')
        print(f"   Username: {admin.username}")
        print(f"   Email: {admin.email}")
        print(f"   Is Superuser: {admin.is_superuser}")
        return True
    
    # สร้าง admin account
    try:
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@eduinfo.online',
            password='admin123456'
        )
        print("\n✅ Admin account created successfully!")
        print("\n📋 Login Credentials:")
        print("   URL: https://eduinfo.online/admin/")
        print("   Username: admin")
        print("   Password: admin123456")
        print("\n⚠️  IMPORTANT: Change the password after first login!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error creating admin: {e}")
        return False

if __name__ == "__main__":
    try:
        success = create_admin()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

