#!/usr/bin/env python
"""
ทดสอบการอ่าน environment variables จาก .env file
"""

import os
import sys
from decouple import config

def test_env_variables():
    """ทดสอบการอ่าน environment variables"""
    print("🧪 ทดสอบการอ่าน environment variables จาก .env file...")
    print("=" * 60)
    
    try:
        # อ่านค่าจาก environment variables
        superuser_username = config('SUPERUSER_USERNAME', default='NOT_SET')
        superuser_email = config('SUPERUSER_EMAIL', default='NOT_SET')
        superuser_password = config('SUPERUSER_PASSWORD', default='NOT_SET')
        superuser_first_name = config('SUPERUSER_FIRST_NAME', default='NOT_SET')
        superuser_last_name = config('SUPERUSER_LAST_NAME', default='NOT_SET')
        
        print(f"📋 ผลลัพธ์การอ่าน Environment Variables:")
        print(f"   SUPERUSER_USERNAME: {superuser_username}")
        print(f"   SUPERUSER_EMAIL: {superuser_email}")
        print(f"   SUPERUSER_PASSWORD: {'*' * len(superuser_password) if superuser_password != 'NOT_SET' else 'NOT_SET'}")
        print(f"   SUPERUSER_FIRST_NAME: {superuser_first_name}")
        print(f"   SUPERUSER_LAST_NAME: {superuser_last_name}")
        
        # ตรวจสอบว่าอ่านได้ครบหรือไม่
        all_set = all([
            superuser_username != 'NOT_SET',
            superuser_email != 'NOT_SET',
            superuser_password != 'NOT_SET',
            superuser_first_name != 'NOT_SET',
            superuser_last_name != 'NOT_SET'
        ])
        
        if all_set:
            print("\n✅ อ่าน environment variables สำเร็จ!")
            print(f"   จะสร้าง superuser: {superuser_username} ({superuser_email})")
            return True
        else:
            print("\n❌ อ่าน environment variables ไม่ครบ!")
            return False
            
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาด: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("ENVIRONMENT VARIABLES TEST")
    print("=" * 60)
    
    success = test_env_variables()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ การทดสอบสำเร็จ!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ การทดสอบล้มเหลว!")
        print("=" * 60)
        sys.exit(1)
