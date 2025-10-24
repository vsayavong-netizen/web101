#!/usr/bin/env python3
"""
Separated Testing Script
สคริปต์ทดสอบแบบแยกส่วน - ตามข้อแนะนำที่ดีที่สุด
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

class SeparatedTestRunner:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.backend_dir = self.base_dir / "backend"
        self.frontend_dir = self.base_dir / "frontend"
        
    def print_header(self, title):
        """แสดงหัวข้อ"""
        print(f"\n{'='*60}")
        print(f"{title}")
        print(f"{'='*60}")
    
    def print_step(self, step, message):
        """แสดงขั้นตอน"""
        print(f"\n[{step}] {message}")
    
    def print_result(self, success, message):
        """แสดงผลลัพธ์"""
        status = "PASS" if success else "FAIL"
        symbol = "[+]" if success else "[-]"
        print(f"{symbol} {status}: {message}")
        return success
    
    def check_dependencies(self):
        """ตรวจสอบ dependencies"""
        self.print_step("1", "Checking dependencies...")
        
        # ตรวจสอบ Python
        try:
            result = subprocess.run([sys.executable, "--version"], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                self.print_result(True, f"Python: {result.stdout.strip()}")
            else:
                self.print_result(False, "Python not found")
                return False
        except:
            self.print_result(False, "Python not found")
            return False
        
        # ตรวจสอบ Node.js
        try:
            result = subprocess.run(["node", "--version"], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                self.print_result(True, f"Node.js: {result.stdout.strip()}")
            else:
                self.print_result(False, "Node.js not found")
                return False
        except:
            self.print_result(False, "Node.js not found")
            return False
        
        return True
    
    def setup_backend(self):
        """ตั้งค่า Backend"""
        self.print_step("2", "Setting up Backend...")
        
        # เปลี่ยนไปยัง backend directory
        os.chdir(self.backend_dir)
        
        # ตรวจสอบ requirements.txt
        if not (self.backend_dir / "requirements.txt").exists():
            self.print_result(False, "requirements.txt not found")
            return False
        
        # ติดตั้ง dependencies
        try:
            result = subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                self.print_result(True, "Dependencies installed")
            else:
                self.print_result(False, f"Dependencies installation failed: {result.stderr}")
                return False
        except Exception as e:
            self.print_result(False, f"Dependencies installation error: {e}")
            return False
        
        # รัน migrations
        try:
            result = subprocess.run([sys.executable, "manage.py", "makemigrations"],
                                  capture_output=True, text=True)
            result = subprocess.run([sys.executable, "manage.py", "migrate"],
                                  capture_output=True, text=True)
            if result.returncode == 0:
                self.print_result(True, "Database migrations completed")
            else:
                self.print_result(False, f"Migration failed: {result.stderr}")
                return False
        except Exception as e:
            self.print_result(False, f"Migration error: {e}")
            return False
        
        return True
    
    def test_backend(self):
        """ทดสอบ Backend"""
        self.print_step("3", "Testing Backend...")
        
        # เริ่ม Django server
        try:
            server_process = subprocess.Popen([sys.executable, "manage.py", "runserver", "8000"],
                                             stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # รอให้ server เริ่ม
            time.sleep(5)
            
            # ตรวจสอบว่า server ทำงาน
            try:
                response = requests.get("http://localhost:8000", timeout=5)
                if response.status_code in [200, 401, 404]:
                    self.print_result(True, "Django server started")
                else:
                    self.print_result(False, f"Server returned status: {response.status_code}")
                    server_process.terminate()
                    return False
            except:
                self.print_result(False, "Cannot connect to Django server")
                server_process.terminate()
                return False
            
            # รัน backend tests
            try:
                result = subprocess.run([sys.executable, "test_basic.py"],
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    self.print_result(True, "Backend tests passed")
                    backend_success = True
                else:
                    self.print_result(False, f"Backend tests failed: {result.stderr}")
                    backend_success = False
            except Exception as e:
                self.print_result(False, f"Backend test error: {e}")
                backend_success = False
            
            # ปิด server
            server_process.terminate()
            server_process.wait()
            
            return backend_success
            
        except Exception as e:
            self.print_result(False, f"Backend setup error: {e}")
            return False
    
    def setup_frontend(self):
        """ตั้งค่า Frontend"""
        self.print_step("4", "Setting up Frontend...")
        
        # เปลี่ยนไปยัง frontend directory
        os.chdir(self.frontend_dir)
        
        # ตรวจสอบ package.json
        if not (self.frontend_dir / "package.json").exists():
            self.print_result(False, "package.json not found")
            return False
        
        # ติดตั้ง dependencies
        try:
            result = subprocess.run(["npm", "install"], capture_output=True, text=True)
            if result.returncode == 0:
                self.print_result(True, "Frontend dependencies installed")
            else:
                self.print_result(False, f"npm install failed: {result.stderr}")
                return False
        except Exception as e:
            self.print_result(False, f"Frontend setup error: {e}")
            return False
        
        return True
    
    def test_frontend(self):
        """ทดสอบ Frontend"""
        self.print_step("5", "Testing Frontend...")
        
        # เริ่ม frontend server
        try:
            frontend_process = subprocess.Popen(["npm", "start"],
                                              stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            # รอให้ server เริ่ม
            time.sleep(10)
            
            # ตรวจสอบว่า server ทำงาน
            try:
                response = requests.get("http://localhost:3000", timeout=5)
                if response.status_code == 200:
                    self.print_result(True, "Frontend server started")
                else:
                    self.print_result(False, f"Frontend server status: {response.status_code}")
                    frontend_process.terminate()
                    return False
            except:
                self.print_result(False, "Cannot connect to Frontend server")
                frontend_process.terminate()
                return False
            
            # รัน frontend tests
            try:
                result = subprocess.run(["node", "test_login_integration.js"],
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    self.print_result(True, "Frontend tests passed")
                    frontend_success = True
                else:
                    self.print_result(False, f"Frontend tests failed: {result.stderr}")
                    frontend_success = False
            except Exception as e:
                self.print_result(False, f"Frontend test error: {e}")
                frontend_success = False
            
            # ปิด server
            frontend_process.terminate()
            frontend_process.wait()
            
            return frontend_success
            
        except Exception as e:
            self.print_result(False, f"Frontend test error: {e}")
            return False
    
    def run_all_tests(self):
        """รันการทดสอบทั้งหมด"""
        self.print_header("SEPARATED TESTING - Following Best Practices")
        
        # ตรวจสอบ dependencies
        if not self.check_dependencies():
            print("\nDependencies check failed. Please install required software.")
            return False
        
        # ตั้งค่าและทดสอบ Backend
        if not self.setup_backend():
            print("\nBackend setup failed.")
            return False
        
        if not self.test_backend():
            print("\nBackend tests failed.")
            return False
        
        # ตั้งค่าและทดสอบ Frontend
        if not self.setup_frontend():
            print("\nFrontend setup failed.")
            return False
        
        if not self.test_frontend():
            print("\nFrontend tests failed.")
            return False
        
        # สรุปผลลัพธ์
        self.print_header("TEST RESULTS SUMMARY")
        print("[+] Dependencies: PASSED")
        print("[+] Backend Setup: PASSED")
        print("[+] Backend Tests: PASSED")
        print("[+] Frontend Setup: PASSED")
        print("[+] Frontend Tests: PASSED")
        print("\nALL TESTS PASSED!")
        print("\nSystem is working perfectly following best practices:")
        print("- Using separated testing")
        print("- Testing Backend before Frontend")
        print("- Using simple test scripts")
        print("- Checking Database migrations")
        
        return True

def main():
    """Main function"""
    runner = SeparatedTestRunner()
    success = runner.run_all_tests()
    
    if success:
        print("\nTesting completed - System is ready!")
        return 0
    else:
        print("\nTesting failed - Please check errors")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
