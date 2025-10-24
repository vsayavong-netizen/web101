#!/usr/bin/env python
"""
Setup Script for Render Production Environment
สคริปต์สำหรับตั้งค่า Production Database บน Render

วิธีใช้:
1. เข้า Render Dashboard
2. ไปที่ Service > bm23-web > Shell
3. รันคำสั่ง: cd backend && python ../setup_render_production.py
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Error setting up Django: {e}")
    sys.exit(1)

from django.contrib.auth import get_user_model
from django.db import connection
from django.core.management import call_command

User = get_user_model()

def print_header(message):
    """พิมพ์หัวข้อที่สวยงาม"""
    print("\n" + "="*60)
    print(f"  {message}")
    print("="*60 + "\n")

def check_database_connection():
    """ตรวจสอบการเชื่อมต่อ Database"""
    print_header("🔍 ตรวจสอบการเชื่อมต่อ Database")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print("✅ Database connection: OK")
        
        # แสดงข้อมูล Database
        db_settings = connection.settings_dict
        print(f"📊 Database: {db_settings.get('NAME', 'Unknown')}")
        print(f"🏢 Engine: {db_settings.get('ENGINE', 'Unknown')}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def run_migrations():
    """รัน Database Migrations"""
    print_header("🔄 รัน Database Migrations")
    try:
        call_command('migrate', '--noinput', verbosity=1)
        print("✅ Migrations completed successfully!")
        return True
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

def create_superuser():
    """สร้าง Superuser Account"""
    print_header("👨‍💼 สร้าง Superuser Account")
    
    # ตรวจสอบว่ามี superuser อยู่แล้วหรือไม่
    if User.objects.filter(is_superuser=True).exists():
        superusers = User.objects.filter(is_superuser=True)
        print(f"ℹ️  พบ Superuser อยู่แล้ว {superusers.count()} คน:")
        for user in superusers:
            print(f"   - {user.username} ({user.email})")
        
        response = input("\n❓ ต้องการสร้าง superuser เพิ่มหรือไม่? (y/n): ").lower()
        if response != 'y':
            print("⏭️  ข้ามการสร้าง superuser")
            return True
    
    print("\n📝 กรอกข้อมูล Superuser:")
    print("   (กด Ctrl+C เพื่อยกเลิก)")
    
    try:
        username = input("Username: ").strip()
        email = input("Email: ").strip()
        password = input("Password: ").strip()
        
        if not username or not email or not password:
            print("❌ กรุณากรอกข้อมูลให้ครบถ้วน")
            return False
        
        # ตรวจสอบว่า username ซ้ำหรือไม่
        if User.objects.filter(username=username).exists():
            print(f"❌ Username '{username}' มีอยู่แล้ว")
            return False
        
        # สร้าง superuser
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print(f"\n✅ สร้าง Superuser สำเร็จ!")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        return True
        
    except KeyboardInterrupt:
        print("\n⚠️  ยกเลิกการสร้าง superuser")
        return False
    except Exception as e:
        print(f"❌ Error creating superuser: {e}")
        return False

def create_default_admin():
    """สร้าง Admin Account เริ่มต้น (ไม่ต้องกรอกข้อมูล)"""
    print_header("👨‍💼 สร้าง Admin Account เริ่มต้น")
    
    # ตรวจสอบว่ามี admin อยู่แล้วหรือไม่
    if User.objects.filter(username='admin').exists():
        print("ℹ️  พบ admin account อยู่แล้ว")
        return True
    
    try:
        # สร้าง default admin
        user = User.objects.create_superuser(
            username='admin',
            email='admin@eduinfo.online',
            password='admin123456'  # ⚠️ ควรเปลี่ยนรหัสผ่านหลังจาก login
        )
        print("✅ สร้าง Admin Account สำเร็จ!")
        print("\n📋 ข้อมูล Login:")
        print("   Username: admin")
        print("   Password: admin123456")
        print("\n⚠️  กรุณาเปลี่ยนรหัสผ่านหลังจาก login ครั้งแรก!")
        return True
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        return False

def show_statistics():
    """แสดงสถิติของระบบ"""
    print_header("📊 สถิติระบบ")
    
    try:
        total_users = User.objects.count()
        superusers = User.objects.filter(is_superuser=True).count()
        staff_users = User.objects.filter(is_staff=True).count()
        active_users = User.objects.filter(is_active=True).count()
        
        print(f"👥 ผู้ใช้ทั้งหมด: {total_users}")
        print(f"👨‍💼 Superusers: {superusers}")
        print(f"👔 Staff Users: {staff_users}")
        print(f"✅ Active Users: {active_users}")
        
    except Exception as e:
        print(f"❌ Error getting statistics: {e}")

def show_urls():
    """แสดง URLs ที่สำคัญ"""
    print_header("🌐 URLs สำคัญ")
    
    base_url = "https://eduinfo.online"
    
    print(f"🏠 Homepage: {base_url}")
    print(f"👨‍💼 Admin Panel: {base_url}/admin/")
    print(f"⚙️  API Root: {base_url}/api/")
    print(f"🔐 Auth API: {base_url}/api/auth/")
    print(f"📚 Projects API: {base_url}/api/projects/")
    print(f"👨‍🎓 Students API: {base_url}/api/students/")

def main():
    """Main function"""
    print("\n" + "🚀 "*20)
    print("  Setup Render Production Environment")
    print("  สคริปต์ตั้งค่า Production Database")
    print("🚀 "*20 + "\n")
    
    # 1. ตรวจสอบ Database
    if not check_database_connection():
        print("\n❌ ไม่สามารถเชื่อมต่อ Database ได้")
        print("💡 ตรวจสอบว่า DATABASE_URL ถูกต้องหรือไม่")
        sys.exit(1)
    
    # 2. รัน Migrations
    if not run_migrations():
        print("\n❌ Migration ล้มเหลว")
        sys.exit(1)
    
    # 3. เลือกวิธีสร้าง Admin
    print_header("📝 ตั้งค่า Admin Account")
    print("เลือกวิธีการ:")
    print("  1. สร้าง Admin Account เริ่มต้น (admin/admin123456)")
    print("  2. สร้าง Superuser ด้วยข้อมูลที่กำหนดเอง")
    print("  3. ข้าม (ถ้ามี Admin อยู่แล้ว)")
    
    choice = input("\nเลือก (1/2/3): ").strip()
    
    if choice == '1':
        create_default_admin()
    elif choice == '2':
        create_superuser()
    else:
        print("⏭️  ข้ามการสร้าง Admin")
    
    # 4. แสดงสถิติ
    show_statistics()
    
    # 5. แสดง URLs
    show_urls()
    
    # สรุป
    print_header("🎉 Setup เสร็จสิ้น!")
    print("✅ Database พร้อมใช้งาน")
    print("✅ Admin Account พร้อมใช้งาน")
    print("\n📝 ขั้นตอนถัดไป:")
    print("  1. เปิด https://eduinfo.online/admin/")
    print("  2. Login ด้วย Admin Account")
    print("  3. เปลี่ยนรหัสผ่าน (ถ้าใช้ default admin)")
    print("  4. เริ่มใช้งานระบบ")
    print("\n💡 Tips:")
    print("  - ตรวจสอบ Logs: Render Dashboard > Logs")
    print("  - ดู Shell: Render Dashboard > Shell")
    print("  - Restart Service: Render Dashboard > Manual Deploy > Clear build cache & deploy")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  ยกเลิกการ setup")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

