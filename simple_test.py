#!/usr/bin/env python
"""
ทดสอบง่ายๆ
"""

print("Hello World!")
print("Testing environment variables...")

# ทดสอบการอ่านไฟล์ .env แบบง่าย
try:
    with open('.env', 'r', encoding='utf-8') as f:
        content = f.read()
        print("✅ อ่านไฟล์ .env สำเร็จ!")
        
        # ตรวจสอบว่ามีตัวแปรที่ต้องการหรือไม่
        if 'SUPERUSER_USERNAME=myname' in content:
            print("✅ พบ SUPERUSER_USERNAME=myname")
        else:
            print("❌ ไม่พบ SUPERUSER_USERNAME=myname")
            
        if 'SUPERUSER_EMAIL=myname@eduinfo.online' in content:
            print("✅ พบ SUPERUSER_EMAIL=myname@eduinfo.online")
        else:
            print("❌ ไม่พบ SUPERUSER_EMAIL=myname@eduinfo.online")
            
except Exception as e:
    print(f"❌ เกิดข้อผิดพลาด: {e}")

print("การทดสอบเสร็จสิ้น!")
