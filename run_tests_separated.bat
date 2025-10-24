@echo off
REM Separated Testing Script for Windows
REM ตามข้อแนะนำที่ดีที่สุด

echo ============================================================
echo SEPARATED TESTING - ตามข้อแนะนำที่ดีที่สุด
echo ============================================================

REM ตรวจสอบ Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [1] FAIL: Python not found
    pause
    exit /b 1
) else (
    echo [1] PASS: Python found
)

REM ตรวจสอบ Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [1] FAIL: Node.js not found
    pause
    exit /b 1
) else (
    echo [1] PASS: Node.js found
)

echo.
echo [2] Setting up Backend...
cd backend

REM ติดตั้ง dependencies
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo [2] FAIL: Dependencies installation failed
    pause
    exit /b 1
) else (
    echo [2] PASS: Dependencies installed
)

REM รัน migrations
python manage.py makemigrations
python manage.py migrate
if errorlevel 1 (
    echo [2] FAIL: Database migrations failed
    pause
    exit /b 1
) else (
    echo [2] PASS: Database migrations completed
)

echo.
echo [3] Testing Backend...
python test_basic.py
if errorlevel 1 (
    echo [3] FAIL: Backend tests failed
    pause
    exit /b 1
) else (
    echo [3] PASS: Backend tests passed
)

echo.
echo [4] Setting up Frontend...
cd ..\frontend

REM ติดตั้ง dependencies
npm install
if errorlevel 1 (
    echo [4] FAIL: Frontend dependencies installation failed
    pause
    exit /b 1
) else (
    echo [4] PASS: Frontend dependencies installed
)

echo.
echo [5] Testing Frontend...
node test_login_integration.js
if errorlevel 1 (
    echo [5] FAIL: Frontend tests failed
    pause
    exit /b 1
) else (
    echo [5] PASS: Frontend tests passed
)

echo.
echo ============================================================
echo TEST RESULTS SUMMARY
echo ============================================================
echo PASS: Dependencies
echo PASS: Backend Setup
echo PASS: Backend Tests
echo PASS: Frontend Setup
echo PASS: Frontend Tests
echo.
echo ALL TESTS PASSED!
echo.
echo ระบบทำงานได้อย่างสมบูรณ์ตามข้อแนะนำที่ดีที่สุด:
echo - ใช้การทดสอบแยกส่วน
echo - ทดสอบ Backend ก่อน Frontend
echo - ใช้สคริปต์ทดสอบแบบง่าย
echo - ตรวจสอบ Database migrations
echo.
pause
exit /b 0
