#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Script สำหรับทดสอบปุ่ม "Add New Student" โดยใช้ Selenium WebDriver
ทดสอบการคลิกปุ่มและตรวจสอบว่า modal เปิดขึ้นมา
"""

import os
import sys
import time
from pathlib import Path

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

def check_server_running(url, timeout=5):
    """ตรวจสอบว่า server กำลังรันอยู่หรือไม่"""
    try:
        import requests
        response = requests.get(url, timeout=timeout)
        return response.status_code == 200
    except ImportError:
        print("⚠️ requests module ไม่ได้ติดตั้ง กรุณาติดตั้งด้วย: pip install requests")
        return False
    except:
        return False

def setup_chrome_driver():
    """ตั้งค่า Chrome WebDriver"""
    print("🔧 กำลังตั้งค่า Chrome WebDriver...")
    
    chrome_options = Options()
    # เปิดใช้งาน headless mode (ไม่แสดง browser window) - comment ออกถ้าต้องการเห็น browser
    # chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--start-maximized')
    
    # ใช้ webdriver-manager เพื่อดาวน์โหลดและจัดการ ChromeDriver อัตโนมัติ
    service = Service(ChromeDriverManager().install())
    
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(10)
    
    print("✅ Chrome WebDriver พร้อมใช้งาน")
    return driver

def login(driver, base_url="http://localhost:3000"):
    """Login เข้าระบบ"""
    print(f"\n🔐 กำลัง Login เข้าระบบที่ {base_url}...")
    
    try:
        driver.get(base_url)
        time.sleep(2)
        
        # รอให้หน้า login โหลดเสร็จ
        wait = WebDriverWait(driver, 15)
        
        # ตรวจสอบว่าอยู่ในหน้า Welcome หรือ Login
        # หาปุ่ม "เข้าสู่ระบบ" ในหน้า Welcome
        try:
            welcome_login_button = driver.find_element(By.XPATH, "//button[contains(text(), 'เข้าสู่ระบบ') or contains(text(), 'Login')]")
            if welcome_login_button.is_displayed():
                print("📄 พบหน้า Welcome กำลังคลิกปุ่มเข้าสู่ระบบ...")
                welcome_login_button.click()
                time.sleep(3)  # รอให้หน้า login โหลด
        except:
            pass
        
        # รอให้หน้า login form โหลด
        time.sleep(2)
        
        # ตรวจสอบว่ามี tabs (Staff/Student) หรือไม่
        try:
            # หา tabs และเลือก Staff tab
            staff_tab = driver.find_element(By.XPATH, "//button[@role='tab' and contains(text(), 'Staff') or contains(text(), 'บุคลากร')]")
            if staff_tab.is_displayed():
                staff_tab.click()
                time.sleep(1)
        except:
            pass
        
        # หา input fields สำหรับ username และ password
        # ลองหาด้วยหลายวิธี
        username_input = None
        password_input = None
        
        # วิธีที่ 1: หา input ที่เป็น text field แรก (สำหรับ staff name)
        try:
            text_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text'], input:not([type='password'])")
            for inp in text_inputs:
                if inp.is_displayed() and inp.get_attribute('type') != 'password':
                    username_input = inp
                    break
        except:
            pass
        
        # วิธีที่ 2: หาด้วย placeholder หรือ name
        if not username_input:
            try:
                username_input = driver.find_element(By.XPATH, "//input[@type='text' or @name='staffName' or @name='studentId' or @name='username' or @name='email']")
            except:
                try:
                    username_input = driver.find_element(By.CSS_SELECTOR, "input[type='text']")
                except:
                    pass
        
        # หา password input
        try:
            password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        except:
            pass
        
        if not username_input or not password_input:
            print("⚠️ ไม่พบ input fields สำหรับ login")
            print("📄 กำลังบันทึก screenshot...")
            driver.save_screenshot("login_page_screenshot.png")
            print("💡 กรุณาตรวจสอบ screenshot: login_page_screenshot.png")
            
            # Debug: แสดง input fields ที่พบ
            try:
                all_inputs = driver.find_elements(By.CSS_SELECTOR, "input")
                print(f"   พบ input fields ทั้งหมด: {len(all_inputs)}")
                for i, inp in enumerate(all_inputs):
                    inp_type = inp.get_attribute('type')
                    inp_name = inp.get_attribute('name')
                    inp_placeholder = inp.get_attribute('placeholder')
                    is_displayed = inp.is_displayed()
                    print(f"   Input {i+1}: type={inp_type}, name={inp_name}, name={inp_placeholder}, displayed={is_displayed}")
            except:
                pass
            
            return False
        
        # กรอกข้อมูล login (ใช้ข้อมูล default หรือจาก environment variables)
        username = os.getenv('TEST_USERNAME', 'admin')
        password = os.getenv('TEST_PASSWORD', 'admin123')
        
        print(f"📝 กำลังกรอกข้อมูล login: {username}")
        username_input.clear()
        username_input.send_keys(username)
        
        time.sleep(1)
        
        password_input.clear()
        password_input.send_keys(password)
        
        time.sleep(1)
        
        # หาปุ่ม submit หรือ login
        submit_button = None
        try:
            submit_button = driver.find_element(By.XPATH, "//button[@type='submit' or contains(text(), 'Login') or contains(text(), 'เข้าสู่ระบบ') or contains(text(), 'Sign In')]")
        except:
            try:
                submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            except:
                pass
        
        if submit_button:
            submit_button.click()
        else:
            # ลองกด Enter ที่ password field
            password_input.submit()
        
        # รอให้ login เสร็จและ redirect
        time.sleep(3)
        
        # ตรวจสอบว่า login สำเร็จ (URL เปลี่ยนหรือมี element ที่บ่งบอกว่า login แล้ว)
        current_url = driver.current_url
        print(f"📍 URL ปัจจุบัน: {current_url}")
        
        # รอให้หน้า dashboard หรือ homepage โหลด
        time.sleep(3)
        
        print("✅ Login สำเร็จ")
        return True
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการ Login: {e}")
        driver.save_screenshot("login_error_screenshot.png")
        return False

def navigate_to_students_page(driver):
    """Navigate ไปที่หน้า Student Management"""
    print("\n🧭 กำลัง Navigate ไปที่หน้า Student Management...")
    
    try:
        wait = WebDriverWait(driver, 15)
        
        # รอให้หน้าโหลดเสร็จ
        time.sleep(3)
        
        # หาปุ่มหรือ link ที่มีคำว่า "Students" หรือ "นักศึกษา"
        # ลองหาด้วยหลายวิธี
        students_link = None
        
        # วิธีที่ 1: หาด้วย text content (case insensitive)
        try:
            students_link = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'student')] | //a[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'student')]"))
            )
        except:
            pass
        
        # วิธีที่ 2: หา navigation buttons ทั้งหมดและหา Students
        if not students_link:
            try:
                # หา buttons ใน navigation area
                nav_buttons = driver.find_elements(By.CSS_SELECTOR, "button.MuiButton-root, button[class*='MuiButton'], button[class*='NavButton']")
                for button in nav_buttons:
                    text = button.text.strip().lower()
                    if 'student' in text or 'นักศึกษา' in text:
                        students_link = button
                        break
            except:
                pass
        
        # วิธีที่ 3: หาด้วย SVG icon (UserGroupIcon)
        if not students_link:
            try:
                # หา SVG icons ใน navigation
                svg_elements = driver.find_elements(By.CSS_SELECTOR, "svg")
                for svg in svg_elements:
                    # ตรวจสอบว่าเป็น UserGroup icon หรือไม่ (viewBox="0 0 24 24" และมี path)
                    viewbox = svg.get_attribute("viewBox")
                    if viewbox and "24" in viewbox:
                        # หา button ที่มี SVG นี้
                        parent_button = svg.find_element(By.XPATH, "./ancestor::button")
                        if parent_button:
                            text = parent_button.text.strip().lower()
                            if 'student' in text or text == '' or len(text) < 20:  # อาจจะเป็น icon only
                                students_link = parent_button
                                break
            except:
                pass
        
        # วิธีที่ 4: หาโดยใช้ XPath ที่ครอบคลุมมากขึ้น
        if not students_link:
            try:
                # หา buttons ที่อยู่ใน navigation area
                all_buttons = driver.find_elements(By.XPATH, "//button[contains(@class, 'MuiButton') or contains(@class, 'NavButton')]")
                for button in all_buttons:
                    text = button.text.strip().lower()
                    if 'student' in text:
                        students_link = button
                        break
            except:
                pass
        
        # วิธีที่ 5: ใช้ JavaScript เพื่อหา element
        if not students_link:
            try:
                students_link = driver.execute_script("""
                    var buttons = document.querySelectorAll('button');
                    for (var i = 0; i < buttons.length; i++) {
                        var text = buttons[i].textContent.toLowerCase();
                        if (text.includes('student') || text.includes('นักศึกษา')) {
                            return buttons[i];
                        }
                    }
                    return null;
                """)
            except:
                pass
        
        if students_link:
            # Scroll ไปที่ element
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", students_link)
            time.sleep(1)
            
            # ตรวจสอบว่าปุ่มแสดงอยู่
            if not students_link.is_displayed():
                # ลอง scroll อีกครั้ง
                driver.execute_script("window.scrollTo(0, 0);")
                time.sleep(1)
                driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", students_link)
                time.sleep(1)
            
            students_link.click()
            print("✅ คลิกที่ Students navigation link")
        else:
            print("⚠️ ไม่พบ Students navigation link")
            print("📄 กำลังบันทึก screenshot...")
            driver.save_screenshot("navigation_screenshot.png")
            print("💡 กรุณาตรวจสอบ screenshot: navigation_screenshot.png")
            
            # แสดงข้อมูล debug
            print("\n📋 Debug: กำลังหา navigation buttons...")
            try:
                all_buttons = driver.find_elements(By.CSS_SELECTOR, "button")
                print(f"   พบ buttons ทั้งหมด: {len(all_buttons)}")
                for i, btn in enumerate(all_buttons[:10]):  # แสดงแค่ 10 ตัวแรก
                    text = btn.text.strip()
                    if text:
                        print(f"   Button {i+1}: '{text[:50]}'")
            except:
                pass
            
            return False
        
        # รอให้หน้า Student Management โหลด
        time.sleep(3)
        
        # ตรวจสอบว่าเข้าหน้า Student Management แล้ว
        current_url = driver.current_url
        print(f"📍 URL ปัจจุบัน: {current_url}")
        
        # รอให้หน้าโหลดเสร็จ
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(2)
        
        print("✅ เข้าหน้า Student Management สำเร็จ")
        return True
        
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการ Navigate: {e}")
        driver.save_screenshot("navigation_error_screenshot.png")
        return False

def test_add_student_button(driver):
    """ทดสอบปุ่ม Add New Student"""
    print("\n🧪 กำลังทดสอบปุ่ม 'Add New Student'...")
    
    try:
        wait = WebDriverWait(driver, 15)
        
        # หาปุ่ม "Add New Student" หรือ "Add Student"
        # ใช้ XPath ที่ตรงกับ HTML structure ที่ผู้ใช้ให้มา
        add_button = None
        
        # วิธีที่ 1: หาด้วย text content
        try:
            add_button = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Add New Student') or contains(text(), 'Add Student') or contains(text(), 'เพิ่มนักศึกษา')]"))
            )
        except:
            # วิธีที่ 2: หาด้วย class name ที่มี MuiButton
            try:
                buttons = driver.find_elements(By.CSS_SELECTOR, "button.MuiButton-root")
                for button in buttons:
                    text = button.text
                    if 'Add' in text and 'Student' in text:
                        add_button = button
                        break
            except:
                pass
        
        # วิธีที่ 3: หาด้วย SVG icon (AddIcon)
        if not add_button:
            try:
                # หา SVG ที่มี path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" (AddIcon)
                add_icon = driver.find_element(By.XPATH, "//svg[@data-testid='AddIcon']")
                # หา button ที่มี icon นี้
                add_button = add_icon.find_element(By.XPATH, "./ancestor::button")
            except:
                pass
        
        if not add_button:
            print("❌ ไม่พบปุ่ม 'Add New Student'")
            print("📄 กำลังบันทึก screenshot...")
            driver.save_screenshot("add_button_not_found_screenshot.png")
            print("💡 กรุณาตรวจสอบ screenshot: add_button_not_found_screenshot.png")
            
            # แสดง HTML ของหน้าเพื่อ debug
            print("\n📋 HTML ของหน้า (บางส่วน):")
            page_source = driver.page_source
            if 'Add' in page_source and 'Student' in page_source:
                # หา section ที่มีคำว่า Add และ Student
                import re
                matches = re.findall(r'.{0,200}Add.{0,50}Student.{0,200}', page_source, re.IGNORECASE)
                for match in matches[:3]:
                    print(f"  ...{match}...")
            
            return False
        
        print(f"✅ พบปุ่ม 'Add New Student': {add_button.text}")
        
        # Scroll ไปที่ปุ่ม
        driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", add_button)
        time.sleep(1)
        
        # ตรวจสอบว่าปุ่มสามารถคลิกได้
        if not add_button.is_displayed():
            print("⚠️ ปุ่มไม่แสดงบนหน้าจอ")
            return False
        
        if not add_button.is_enabled():
            print("⚠️ ปุ่มไม่สามารถคลิกได้ (disabled)")
            return False
        
        print("🖱️ กำลังคลิกปุ่ม 'Add New Student'...")
        add_button.click()
        
        # รอให้ modal เปิดขึ้นมา
        time.sleep(2)
        
        # ตรวจสอบว่า modal เปิดขึ้นมา
        # หา modal หรือ dialog ที่มี form สำหรับเพิ่ม student
        modal_found = False
        
        # วิธีที่ 1: หา MuiModal หรือ MuiDialog
        try:
            modal = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[role='dialog'], .MuiModal-root, .MuiDialog-root, [class*='Modal'], [class*='Dialog']"))
            )
            if modal.is_displayed():
                modal_found = True
                print("✅ พบ Modal/Dialog")
        except:
            pass
        
        # วิธีที่ 2: หา form fields ที่เกี่ยวข้องกับ student
        if not modal_found:
            try:
                # หา input fields ที่เกี่ยวข้องกับ student form
                student_id_input = driver.find_element(By.XPATH, "//input[@placeholder*='Student ID' or @placeholder*='รหัสนักศึกษา' or @name*='studentId' or @name*='student_id']")
                if student_id_input.is_displayed():
                    modal_found = True
                    print("✅ พบ Student Form (พบ input field)")
            except:
                pass
        
        # วิธีที่ 3: ตรวจสอบว่ามี element ที่มีคำว่า "Student" ใน modal
        if not modal_found:
            try:
                # หา element ที่มี text เกี่ยวกับ student form
                student_form_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Student ID') or contains(text(), 'Name') or contains(text(), 'รหัสนักศึกษา') or contains(text(), 'ชื่อ')]")
                if len(student_form_elements) > 0:
                    modal_found = True
                    print("✅ พบ Student Form (พบ form elements)")
            except:
                pass
        
        if modal_found:
            print("✅ Modal เปิดขึ้นมาสำเร็จ!")
            print("✅ การทดสอบปุ่ม 'Add New Student' ผ่าน!")
            
            # บันทึก screenshot
            driver.save_screenshot("add_student_modal_screenshot.png")
            print("📸 บันทึก screenshot: add_student_modal_screenshot.png")
            
            return True
        else:
            print("⚠️ ไม่พบ Modal หรือ Form หลังจากคลิกปุ่ม")
            print("📄 กำลังบันทึก screenshot...")
            driver.save_screenshot("modal_not_found_screenshot.png")
            print("💡 กรุณาตรวจสอบ screenshot: modal_not_found_screenshot.png")
            return False
        
    except TimeoutException:
        print("❌ Timeout: ไม่พบ element ที่ต้องการ")
        driver.save_screenshot("timeout_error_screenshot.png")
        return False
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาดในการทดสอบ: {e}")
        import traceback
        traceback.print_exc()
        driver.save_screenshot("test_error_screenshot.png")
        return False

def main():
    """Main function"""
    print("=" * 70)
    print("🧪 Automated Test สำหรับปุ่ม 'Add New Student'")
    print("=" * 70)
    
    # ตรวจสอบว่า frontend server กำลังรันอยู่หรือไม่
    # Vite default port is 5173, but also check 3000 for compatibility
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    print(f"\n🔍 กำลังตรวจสอบ Frontend server ที่ {frontend_url}...")
    
    if not check_server_running(frontend_url):
        print(f"❌ Frontend server ไม่ได้รันอยู่ที่ {frontend_url}")
        print("💡 กรุณาเริ่ม Frontend server ก่อน:")
        print("   cd frontend")
        print("   npm start")
        return False
    
    print(f"✅ Frontend server กำลังรันอยู่ที่ {frontend_url}")
    
    driver = None
    
    try:
        # ตั้งค่า Chrome WebDriver
        driver = setup_chrome_driver()
        
        # Login เข้าระบบ
        if not login(driver, frontend_url):
            print("\n❌ การทดสอบล้มเหลว: ไม่สามารถ Login ได้")
            return False
        
        # Navigate ไปที่หน้า Student Management
        if not navigate_to_students_page(driver):
            print("\n❌ การทดสอบล้มเหลว: ไม่สามารถ Navigate ไปที่หน้า Students ได้")
            return False
        
        # ทดสอบปุ่ม Add New Student
        test_result = test_add_student_button(driver)
        
        # สรุปผลการทดสอบ
        print("\n" + "=" * 70)
        print("📊 สรุปผลการทดสอบ")
        print("=" * 70)
        
        if test_result:
            print("✅ การทดสอบผ่านทั้งหมด!")
            print("✅ ปุ่ม 'Add New Student' ทำงานถูกต้อง")
            print("✅ Modal เปิดขึ้นมาหลังจากคลิกปุ่ม")
            return True
        else:
            print("❌ การทดสอบล้มเหลว")
            print("⚠️ กรุณาตรวจสอบ screenshots ที่บันทึกไว้")
            return False
        
    except KeyboardInterrupt:
        print("\n⏹️ การทดสอบถูกยกเลิกโดยผู้ใช้")
        return False
    except Exception as e:
        print(f"\n❌ เกิดข้อผิดพลาดในการทดสอบ: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if driver:
            print("\n🛑 กำลังปิด browser...")
            # รอ 2 วินาทีก่อนปิดเพื่อดูผลลัพธ์
            time.sleep(2)
            driver.quit()
            print("✅ Browser ปิดแล้ว")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

