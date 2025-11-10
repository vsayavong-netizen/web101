@echo off
chcp 65001 >nul
echo ============================================================
echo 🧪 Automated Test สำหรับปุ่ม "Add New Student"
echo ============================================================
echo.

REM ตรวจสอบว่า Python ติดตั้งอยู่หรือไม่
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ไม่พบ Python กรุณาติดตั้ง Python ก่อน
    pause
    exit /b 1
)

REM ตรวจสอบว่า virtual environment มีอยู่หรือไม่
if not exist "venv\" (
    echo 📦 กำลังสร้าง virtual environment...
    python -m venv venv
)

REM เปิดใช้งาน virtual environment
echo 🔧 กำลังเปิดใช้งาน virtual environment...
call venv\Scripts\activate.bat

REM ติดตั้ง dependencies
echo 📥 กำลังติดตั้ง dependencies...
pip install -q selenium webdriver-manager requests

REM รัน test
echo.
echo 🚀 กำลังรัน test...
echo.
python test_add_student_button.py

REM ตรวจสอบผลลัพธ์
if errorlevel 1 (
    echo.
    echo ❌ การทดสอบล้มเหลว
    pause
    exit /b 1
) else (
    echo.
    echo ✅ การทดสอบผ่าน!
    pause
    exit /b 0
)

