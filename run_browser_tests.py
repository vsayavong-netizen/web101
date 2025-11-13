#!/usr/bin/env python3
"""
🎯 สคริปต์สำหรับรัน Browser Tests อัตโนมัติด้วย Playwright
Auto-run Browser Tests Script
"""

import os
import sys
import subprocess
import time
from pathlib import Path

# สีสำหรับ output
class Colors:
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

def print_colored(message, color=Colors.NC):
    """พิมพ์ข้อความพร้อมสี"""
    print(f"{color}{message}{Colors.NC}")

def check_command_exists(command):
    """ตรวจสอบว่าคำสั่งมีอยู่หรือไม่"""
    try:
        subprocess.run([command, '--version'], 
                      capture_output=True, 
                      check=True, 
                      timeout=5)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return False

def check_backend_server(url="http://localhost:8000"):
    """ตรวจสอบว่า backend server ทำงานอยู่หรือไม่"""
    try:
        import urllib.request
        import urllib.error
        
        try:
            urllib.request.urlopen(f"{url}/health/", timeout=3)
            return True
        except urllib.error.URLError:
            try:
                urllib.request.urlopen(f"{url}/api/", timeout=3)
                return True
            except urllib.error.URLError:
                return False
    except Exception:
        return False

def run_command(command, cwd=None, check=True):
    """รันคำสั่งและแสดงผลลัพธ์"""
    print_colored(f"▶️  รันคำสั่ง: {' '.join(command)}", Colors.BLUE)
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            check=check,
            capture_output=False,
            text=True
        )
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print_colored(f"❌ คำสั่งล้มเหลว: {e}", Colors.RED)
        return False
    except FileNotFoundError:
        print_colored(f"❌ ไม่พบคำสั่ง: {command[0]}", Colors.RED)
        return False

def main():
    """ฟังก์ชันหลัก"""
    print_colored("🚀 เริ่มรัน Browser Tests อัตโนมัติ...", Colors.GREEN)
    print("=" * 50)
    print()
    
    # ตรวจสอบว่า frontend/e2e directory มีอยู่
    e2e_dir = Path("frontend/e2e")
    if not e2e_dir.exists():
        print_colored("❌ ไม่พบ frontend/e2e directory", Colors.RED)
        sys.exit(1)
    
    # ตรวจสอบว่า npm มีอยู่หรือไม่
    if not check_command_exists("npm"):
        print_colored("❌ ไม่พบ npm. กรุณาติดตั้ง Node.js", Colors.RED)
        sys.exit(1)
    
    # ตรวจสอบว่า npx มีอยู่หรือไม่
    if not check_command_exists("npx"):
        print_colored("❌ ไม่พบ npx", Colors.RED)
        sys.exit(1)
    
    os.chdir(e2e_dir)
    
    # ตรวจสอบว่า node_modules มีอยู่หรือไม่
    if not Path("node_modules").exists():
        print_colored("📦 กำลังติดตั้ง dependencies...", Colors.YELLOW)
        if not run_command(["npm", "install"]):
            print_colored("❌ การติดตั้ง dependencies ล้มเหลว", Colors.RED)
            sys.exit(1)
    
    # ตรวจสอบว่า Playwright browsers ติดตั้งแล้วหรือยัง
    playwright_dir = Path("node_modules/@playwright/test")
    if not playwright_dir.exists():
        print_colored("📦 กำลังติดตั้ง Playwright browsers...", Colors.YELLOW)
        if not run_command(["npx", "playwright", "install", "--with-deps", "chromium"]):
            print_colored("⚠️  การติดตั้ง Playwright browsers อาจมีปัญหา", Colors.YELLOW)
    
    print_colored("✅ Dependencies พร้อมแล้ว", Colors.GREEN)
    print()
    
    # ตรวจสอบว่า frontend server ทำงานอยู่หรือไม่
    print_colored("🔍 ตรวจสอบ Frontend Server...", Colors.BLUE)
    frontend_url = os.getenv("PLAYWRIGHT_TEST_BASE_URL", "http://localhost:5173")
    if check_backend_server(frontend_url):  # Reuse function to check any URL
        print_colored(f"✅ Frontend server ทำงานอยู่ที่ {frontend_url}", Colors.GREEN)
    else:
        print_colored(f"⚠️  Frontend server อาจไม่ทำงานที่ {frontend_url}", Colors.YELLOW)
        print_colored("   กรุณาเริ่ม frontend server ก่อน:", Colors.YELLOW)
        print_colored("   cd frontend && npm run dev", Colors.YELLOW)
        print_colored("   หรือกด Enter เพื่อรันเทสต์ต่อไป...", Colors.YELLOW)
        try:
            input()
        except (EOFError, KeyboardInterrupt):
            pass
    print()
    
    # ตรวจสอบว่า backend server ทำงานอยู่หรือไม่
    print_colored("🔍 ตรวจสอบ Backend Server...", Colors.BLUE)
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    if check_backend_server(backend_url):
        print_colored(f"✅ Backend server ทำงานอยู่ที่ {backend_url}", Colors.GREEN)
    else:
        print_colored(f"⚠️  Backend server อาจไม่ทำงานที่ {backend_url}", Colors.YELLOW)
        print_colored("   แต่จะรันเทสต์ต่อไป...", Colors.YELLOW)
    print()
    
    # ตั้งค่า environment variables
    base_url = os.getenv("PLAYWRIGHT_TEST_BASE_URL", "http://localhost:5173")
    os.environ["PLAYWRIGHT_TEST_BASE_URL"] = base_url
    
    print_colored("📋 การตั้งค่า:", Colors.BLUE)
    print(f"   - Base URL: {base_url}")
    print(f"   - Browser Mode: Headed (แสดง browser window)")
    print(f"   - Reporter: HTML, List")
    print()
    
    # รันเทสต์แบบ headed mode (แสดง browser)
    print_colored("🧪 เริ่มรัน Browser Tests...", Colors.GREEN)
    print("=" * 50)
    print()
    
    # รันเทสต์แบบ headed mode
    success = run_command([
        "npx", "playwright", "test",
        "--headed",  # แสดง browser window
        "--reporter=html,list"  # รายงานผลแบบ HTML และ List
    ], check=False)
    
    print()
    print("=" * 50)
    
    if success:
        print_colored("✅ ทุกเทสต์ผ่าน!", Colors.GREEN)
    else:
        print_colored("❌ มีเทสต์บางอันล้มเหลว", Colors.RED)
    
    print()
    print_colored("📊 เปิดดูรายงานผล:", Colors.BLUE)
    print("   cd frontend/e2e && npx playwright show-report")
    print()
    print_colored("🎯 สรุป:", Colors.BLUE)
    print("   - รันเทสต์ใน browser mode (headed)")
    print("   - ใช้ Chromium browser")
    print("   - รายงานผลอยู่ใน HTML format")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
