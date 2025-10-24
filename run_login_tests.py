#!/usr/bin/env python3
"""
Script สำหรับรันการทดสอบ Real Login จาก Frontend
สามารถรันได้ง่ายด้วยคำสั่งเดียว
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_server_running(url, timeout=5):
    """ตรวจสอบว่า server กำลังรันอยู่หรือไม่"""
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code == 200
    except:
        return False

def start_django_server():
    """เริ่ม Django server"""
    print("Starting Django server...")
    
    # เปลี่ยนไปยัง backend directory
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    # เริ่ม Django server ใน background
    try:
        process = subprocess.Popen([
            sys.executable, "manage.py", "runserver", "8000"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # รอให้ server เริ่มทำงาน
        print("Waiting for Django server to start...")
        time.sleep(5)
        
        # ตรวจสอบว่า server ทำงานหรือไม่
        if check_server_running("http://localhost:8000"):
            print("Django server started successfully")
            return process
        else:
            print("Django server failed to start")
            process.terminate()
            return None
            
    except Exception as e:
        print(f"Error starting Django server: {e}")
        return None

def start_frontend_server():
    """เริ่ม Frontend server"""
    print("🚀 กำลังเริ่ม Frontend server...")
    
    # เปลี่ยนไปยัง frontend directory
    frontend_dir = Path(__file__).parent / "frontend"
    os.chdir(frontend_dir)
    
    # เริ่ม frontend server ใน background
    try:
        process = subprocess.Popen([
            "npm", "start"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # รอให้ server เริ่มทำงาน
        print("⏳ รอให้ Frontend server เริ่มทำงาน...")
        time.sleep(10)
        
        # ตรวจสอบว่า server ทำงานหรือไม่
        if check_server_running("http://localhost:3000"):
            print("✅ Frontend server เริ่มทำงานสำเร็จ")
            return process
        else:
            print("❌ Frontend server ไม่สามารถเริ่มทำงานได้")
            process.terminate()
            return None
            
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการเริ่ม Frontend server: {e}")
        return None

def run_backend_tests():
    """รันการทดสอบ backend"""
    print("\nRunning Backend tests...")
    
    # เปลี่ยนไปยัง backend directory
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    try:
        # รัน test script
        result = subprocess.run([
            sys.executable, "test_real_login.py"
        ], capture_output=True, text=True)
        
        print("Backend Test Results:")
        print(result.stdout)
        
        if result.stderr:
            print("Backend Test Errors:")
            print(result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"Error running Backend tests: {e}")
        return False

def run_frontend_tests():
    """รันการทดสอบ frontend"""
    print("\n🧪 กำลังรันการทดสอบ Frontend...")
    
    # เปลี่ยนไปยัง frontend directory
    frontend_dir = Path(__file__).parent / "frontend"
    os.chdir(frontend_dir)
    
    try:
        # รัน test script ด้วย Node.js
        result = subprocess.run([
            "node", "test_login_integration.js"
        ], capture_output=True, text=True)
        
        print("📊 Frontend Test Results:")
        print(result.stdout)
        
        if result.stderr:
            print("❌ Frontend Test Errors:")
            print(result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการรัน Frontend tests: {e}")
        return False

def main():
    """Main function"""
    print("Automated Test for Real Login from Frontend")
    print("=" * 60)
    
    django_process = None
    frontend_process = None
    
    try:
        # ตรวจสอบว่า servers กำลังรันอยู่หรือไม่
        django_running = check_server_running("http://localhost:8000")
        frontend_running = check_server_running("http://localhost:3000")
        
        if not django_running:
            django_process = start_django_server()
            if not django_process:
                print("Cannot start Django server")
                return False
        else:
            print("Django server is already running")
        
        if not frontend_running:
            frontend_process = start_frontend_server()
            if not frontend_process:
                print("Cannot start Frontend server")
                return False
        else:
            print("Frontend server is already running")
        
        # รอให้ servers พร้อมใช้งาน
        print("Waiting for servers to be ready...")
        time.sleep(3)
        
        # รันการทดสอบ
        backend_success = run_backend_tests()
        frontend_success = run_frontend_tests()
        
        # สรุปผลการทดสอบ
        print("\n" + "=" * 60)
        print("📊 สรุปผลการทดสอบ")
        print("=" * 60)
        
        if backend_success:
            print("✅ Backend Tests: ผ่าน")
        else:
            print("❌ Backend Tests: ล้มเหลว")
        
        if frontend_success:
            print("✅ Frontend Tests: ผ่าน")
        else:
            print("❌ Frontend Tests: ล้มเหลว")
        
        if backend_success and frontend_success:
            print("\n🎉 การทดสอบทั้งหมดผ่าน! ระบบ login ทำงานถูกต้อง")
            return True
        else:
            print("\n⚠️ มีการทดสอบบางส่วนล้มเหลว")
            return False
            
    except KeyboardInterrupt:
        print("\n⏹️ การทดสอบถูกยกเลิกโดยผู้ใช้")
        return False
        
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาดในการทดสอบ: {e}")
        return False
        
    finally:
        # ปิด servers ที่เราเริ่มขึ้นมา
        if django_process:
            print("🛑 กำลังปิด Django server...")
            django_process.terminate()
            django_process.wait()
        
        if frontend_process:
            print("🛑 กำลังปิด Frontend server...")
            frontend_process.terminate()
            frontend_process.wait()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
