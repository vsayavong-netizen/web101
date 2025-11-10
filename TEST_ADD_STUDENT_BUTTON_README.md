# 🧪 Test Script สำหรับปุ่ม "Add New Student"

## 📋 คำอธิบาย

Test script นี้ใช้สำหรับทดสอบปุ่ม "Add New Student" ในหน้า Student Management โดยใช้ Selenium WebDriver กับ Chrome browser

## ✨ คุณสมบัติ

- ✅ ทดสอบการคลิกปุ่ม "Add New Student"
- ✅ ตรวจสอบว่า modal เปิดขึ้นมาหลังจากคลิกปุ่ม
- ✅ บันทึก screenshot เมื่อเกิดข้อผิดพลาด
- ✅ รองรับการ login อัตโนมัติ
- ✅ Navigate ไปที่หน้า Student Management อัตโนมัติ

## 📦 Prerequisites

### 1. ติดตั้ง Python Dependencies

```bash
pip install selenium webdriver-manager requests
```

หรือใช้ requirements.txt:

```bash
pip install -r requirements.txt
```

### 2. ติดตั้ง Chrome Browser

- ต้องมี Google Chrome ติดตั้งอยู่บนเครื่อง
- ChromeDriver จะถูกดาวน์โหลดอัตโนมัติโดย webdriver-manager

### 3. เริ่ม Frontend Server

```bash
cd frontend
npm start
```

Frontend server ควรรันที่ `http://localhost:3000`

## 🚀 วิธีรัน Test

### วิธีที่ 1: ใช้ Batch File (Windows)

```bash
run_add_student_test.bat
```

### วิธีที่ 2: รัน Python Script โดยตรง

```bash
python test_add_student_button.py
```

หรือ

```bash
python3 test_add_student_button.py
```

หรือ

```bash
py test_add_student_button.py
```

## ⚙️ Environment Variables

สามารถตั้งค่า environment variables ได้:

- `FRONTEND_URL`: URL ของ frontend server (default: `http://localhost:3000`)
- `TEST_USERNAME`: Username สำหรับ login (default: `admin`)
- `TEST_PASSWORD`: Password สำหรับ login (default: `admin123`)

### ตัวอย่าง (Windows PowerShell):

```powershell
$env:FRONTEND_URL="http://localhost:3000"
$env:TEST_USERNAME="admin"
$env:TEST_PASSWORD="admin123"
python test_add_student_button.py
```

### ตัวอย่าง (Windows CMD):

```cmd
set FRONTEND_URL=http://localhost:3000
set TEST_USERNAME=admin
set TEST_PASSWORD=admin123
python test_add_student_button.py
```

### ตัวอย่าง (Linux/Mac):

```bash
export FRONTEND_URL=http://localhost:3000
export TEST_USERNAME=admin
export TEST_PASSWORD=admin123
python3 test_add_student_button.py
```

## 📊 ผลลัพธ์

### ✅ Test ผ่าน

```
✅ การทดสอบผ่านทั้งหมด!
✅ ปุ่ม 'Add New Student' ทำงานถูกต้อง
✅ Modal เปิดขึ้นมาหลังจากคลิกปุ่ม
```

### ❌ Test ล้มเหลว

Test จะบันทึก screenshot ไว้ในไฟล์:
- `login_error_screenshot.png` - ข้อผิดพลาดในการ login
- `navigation_error_screenshot.png` - ข้อผิดพลาดในการ navigate
- `add_button_not_found_screenshot.png` - ไม่พบปุ่ม
- `modal_not_found_screenshot.png` - ไม่พบ modal
- `test_error_screenshot.png` - ข้อผิดพลาดอื่นๆ

## 🔍 Troubleshooting

### ปัญหา: "Python was not found"

**วิธีแก้:**
- ติดตั้ง Python จาก [python.org](https://www.python.org/downloads/)
- หรือใช้ `py` แทน `python` ใน Windows
- ตรวจสอบว่า Python อยู่ใน PATH

### ปัญหา: "ModuleNotFoundError: No module named 'selenium'"

**วิธีแก้:**
```bash
pip install selenium webdriver-manager requests
```

### ปัญหา: "Frontend server ไม่ได้รันอยู่"

**วิธีแก้:**
1. เริ่ม frontend server:
   ```bash
   cd frontend
   npm start
   ```
2. รอให้ server เริ่มทำงาน (ประมาณ 10-30 วินาที)
3. ตรวจสอบว่าเข้าถึงได้ที่ `http://localhost:3000`

### ปัญหา: "ไม่พบปุ่ม Add New Student"

**วิธีแก้:**
1. ตรวจสอบ screenshot ที่บันทึกไว้
2. ตรวจสอบว่า login สำเร็จและอยู่ในหน้า Student Management
3. ตรวจสอบว่า user มีสิทธิ์เข้าถึงหน้า Student Management

### ปัญหา: "ChromeDriver version mismatch"

**วิธีแก้:**
- webdriver-manager จะดาวน์โหลด ChromeDriver ที่เหมาะสมอัตโนมัติ
- ตรวจสอบว่า Chrome browser เป็นเวอร์ชันล่าสุด

## 📝 Test Flow

1. **ตรวจสอบ Frontend Server** - ตรวจสอบว่า server กำลังรันอยู่
2. **Setup Chrome WebDriver** - ตั้งค่าและเริ่ม Chrome browser
3. **Login** - Login เข้าระบบด้วย username และ password
4. **Navigate to Students Page** - Navigate ไปที่หน้า Student Management
5. **Find Add Button** - หาปุ่ม "Add New Student"
6. **Click Button** - คลิกปุ่ม
7. **Verify Modal** - ตรวจสอบว่า modal เปิดขึ้นมา
8. **Take Screenshot** - บันทึก screenshot ของผลลัพธ์

## 🎯 Expected Behavior

เมื่อคลิกปุ่ม "Add New Student":
- ✅ Modal/Dialog ควรเปิดขึ้นมา
- ✅ Form สำหรับเพิ่ม student ควรแสดง
- ✅ มี input fields สำหรับ Student ID, Name, Surname, etc.

## 📸 Screenshots

Test จะบันทึก screenshot อัตโนมัติเมื่อ:
- ✅ Test สำเร็จ - `add_student_modal_screenshot.png`
- ❌ เกิดข้อผิดพลาด - ไฟล์ screenshot ต่างๆ ตามประเภทของ error

## 🔧 Customization

### เปิด/ปิด Headless Mode

แก้ไขใน `test_add_student_button.py`:

```python
# เปิด headless mode (ไม่แสดง browser)
chrome_options.add_argument('--headless')

# หรือ comment ออกเพื่อเห็น browser
# chrome_options.add_argument('--headless')
```

### เปลี่ยน Timeout

แก้ไขใน `test_add_student_button.py`:

```python
wait = WebDriverWait(driver, 15)  # เปลี่ยน 15 เป็นค่าที่ต้องการ (วินาที)
```

## 📚 Related Files

- `test_add_student_button.py` - Main test script
- `run_add_student_test.bat` - Batch file สำหรับรัน test (Windows)
- `requirements.txt` - Python dependencies

## 🆘 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ screenshots ที่บันทึกไว้
2. ตรวจสอบ console output
3. ตรวจสอบว่า frontend server ทำงานปกติ
4. ตรวจสอบว่า login credentials ถูกต้อง

