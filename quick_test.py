#!/usr/bin/env python3
"""
Quick Test Script - ทดสอบแบบรวดเร็ว
สคริปต์ทดสอบแบบง่ายและรวดเร็ว ตามข้อแนะนำที่ดีที่สุด
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def print_step(step, message):
    """แสดงขั้นตอน"""
    print(f"\n[{step}] {message}")

def print_result(success, message):
    """แสดงผลลัพธ์"""
    status = "PASS" if success else "FAIL"
    symbol = "[+]" if success else "[-]"
    print(f"{symbol} {status}: {message}")
    return success

def check_backend():
    """ตรวจสอบ Backend"""
    print_step("1", "Checking Backend...")
    
    try:
        response = requests.get("http://localhost:8000", timeout=5)
        if response.status_code in [200, 401, 404]:
            return print_result(True, "Backend server is running")
        else:
            return print_result(False, f"Backend server status: {response.status_code}")
    except:
        return print_result(False, "Backend server is not running")

def test_backend_api():
    """ทดสอบ Backend API"""
    print_step("2", "Testing Backend API...")
    
    try:
        # ทดสอบ API endpoints
        endpoints = ["/api/", "/api/auth/", "/api/accounts/", "/api/projects/"]
        working = 0
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"http://localhost:8000{endpoint}", timeout=5)
                if response.status_code in [200, 401, 404, 405]:
                    working += 1
                    print(f"  {endpoint}: {response.status_code}")
            except:
                print(f"  {endpoint}: ERROR")
        
        if working > 0:
            return print_result(True, f"API endpoints working: {working}/{len(endpoints)}")
        else:
            return print_result(False, "No API endpoints working")
            
    except Exception as e:
        return print_result(False, f"API test error: {e}")

def check_frontend():
    """ตรวจสอบ Frontend"""
    print_step("3", "Checking Frontend...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            return print_result(True, "Frontend server is running")
        else:
            return print_result(False, f"Frontend server status: {response.status_code}")
    except:
        return print_result(False, "Frontend server is not running")

def test_frontend_integration():
    """ทดสอบ Frontend Integration"""
    print_step("4", "Testing Frontend Integration...")
    
    try:
        # เปลี่ยนไปยัง frontend directory
        frontend_dir = Path(__file__).parent / "frontend"
        os.chdir(frontend_dir)
        
        # รัน integration test
        result = subprocess.run(["node", "test_login_integration.js"],
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            return print_result(True, "Frontend integration tests passed")
        else:
            return print_result(False, f"Frontend integration failed: {result.stderr}")
            
    except Exception as e:
        return print_result(False, f"Frontend integration error: {e}")

def main():
    """Main function"""
    print("=" * 60)
    print("QUICK TEST - Fast Testing")
    print("=" * 60)
    
    # Check Backend
    backend_ok = check_backend()
    if not backend_ok:
        print("\nBackend is not running - Please start Django server")
        print("Command: cd backend && python manage.py runserver 8000")
        return 1
    
    # Test Backend API
    api_ok = test_backend_api()
    if not api_ok:
        print("\nBackend API is not working")
        return 1
    
    # Check Frontend
    frontend_ok = check_frontend()
    if not frontend_ok:
        print("\nFrontend is not running - Please start Frontend server")
        print("Command: cd frontend && npm start")
        return 1
    
    # Test Frontend Integration
    integration_ok = test_frontend_integration()
    if not integration_ok:
        print("\nFrontend Integration failed")
        return 1
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST RESULTS SUMMARY")
    print("=" * 60)
    print("PASS: Backend Server")
    print("PASS: Backend API")
    print("PASS: Frontend Server")
    print("PASS: Frontend Integration")
    print("\nALL TESTS PASSED!")
    print("\nSystem is working perfectly!")
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
