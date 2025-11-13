# 🎯 คู่มือการรัน Browser Tests อัตโนมัติ

## 📋 ภาพรวม

สคริปต์สำหรับรัน Browser Tests อัตโนมัติด้วย Playwright ในโหมด browser (headed mode) เพื่อให้เห็น browser window ระหว่างการทดสอบ

## 🚀 วิธีการใช้งาน

### วิธีที่ 1: รันอัตโนมัติพร้อมเริ่ม Frontend Server (แนะนำ)

```bash
./run_browser_tests_auto.sh
```

สคริปต์นี้จะ:
- ✅ ตรวจสอบว่า frontend server ทำงานอยู่หรือไม่
- ✅ ถ้าไม่ทำงาน จะเริ่ม frontend server อัตโนมัติ
- ✅ รอให้ frontend server พร้อม
- ✅ รัน browser tests ใน headed mode
- ✅ ปิด frontend server หลังเสร็จสิ้น (ถ้าเราเป็นคนเริ่มมัน)

### วิธีที่ 2: รันด้วย Python Script

```bash
python3 run_browser_tests.py
```

สคริปต์นี้จะ:
- ✅ ตรวจสอบว่า frontend server ทำงานอยู่หรือไม่
- ⚠️ ถ้าไม่ทำงาน จะแจ้งเตือนและให้คุณเริ่มเอง
- ✅ รัน browser tests ใน headed mode

### วิธีที่ 3: รันด้วย Bash Script

```bash
./run_browser_tests.sh
```

สคริปต์นี้จะ:
- ✅ รัน browser tests ใน headed mode
- ⚠️ ต้องเริ่ม frontend server เองก่อน

## 📝 ข้อกำหนดเบื้องต้น

### 1. Frontend Server
Frontend server ต้องทำงานอยู่ที่ `http://localhost:5173`

**เริ่ม frontend server:**
```bash
cd frontend
npm run dev
```

### 2. Backend Server (แนะนำ)
Backend server ควรทำงานอยู่ที่ `http://localhost:8000` (ไม่บังคับ)

**เริ่ม backend server:**
```bash
cd backend
python manage.py runserver
```

### 3. Dependencies
สคริปต์จะติดตั้ง dependencies อัตโนมัติ:
- Playwright และ browsers
- E2E test dependencies

## 🎯 Test Files

Tests อยู่ใน `frontend/e2e/tests/`:
- `auth.spec.ts` - ทดสอบ Authentication
- `projects.spec.ts` - ทดสอบ Projects Management
- `search.spec.ts` - ทดสอบ Advanced Search
- `notifications.spec.ts` - ทดสอบ Notifications

## 🔧 การตั้งค่า

### Environment Variables

```bash
# ตั้งค่า Base URL สำหรับ tests
export PLAYWRIGHT_TEST_BASE_URL="http://localhost:5173"

# ตั้งค่า Backend URL
export BACKEND_URL="http://localhost:8000"
```

### Playwright Configuration

ไฟล์ `frontend/e2e/playwright.config.ts`:
- Base URL: `http://localhost:5173` (default)
- Browser: Chromium, Firefox, WebKit
- Mode: Headed (แสดง browser window)
- Reporter: HTML + List

## 📊 ดูผลการทดสอบ

หลังจากรันเทสต์เสร็จ:

```bash
cd frontend/e2e
npx playwright show-report
```

จะเปิด HTML report ใน browser

## 🎨 Browser Mode Options

### Headed Mode (แสดง browser)
```bash
npx playwright test --headed
```

### Headless Mode (ไม่แสดง browser)
```bash
npx playwright test
```

### UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Debug Mode
```bash
npx playwright test --debug
```

## 🔍 Troubleshooting

### ปัญหา: Frontend server ไม่ทำงาน

**วิธีแก้:**
```bash
cd frontend
npm install  # ถ้ายังไม่ได้ติดตั้ง dependencies
npm run dev
```

### ปัญหา: Playwright browsers ไม่ติดตั้ง

**วิธีแก้:**
```bash
cd frontend/e2e
npx playwright install --with-deps chromium
```

### ปัญหา: Tests ล้มเหลวเพราะ API errors

**วิธีแก้:**
- ตรวจสอบว่า backend server ทำงานอยู่
- ตรวจสอบ network tab ใน browser
- ดู console errors

### ปัญหา: Port 5173 ถูกใช้งานแล้ว

**วิธีแก้:**
```bash
# หา process ที่ใช้ port 5173
lsof -i :5173

# หรือเปลี่ยน port
cd frontend
npm run dev -- --port 3000
```

## 📝 ตัวอย่างการใช้งาน

### รันเทสต์ทั้งหมด
```bash
./run_browser_tests_auto.sh
```

### รันเทสต์เฉพาะ Authentication
```bash
cd frontend/e2e
npx playwright test tests/auth.spec.ts --headed
```

### รันเทสต์เฉพาะ Chromium
```bash
cd frontend/e2e
npx playwright test --project=chromium --headed
```

### รันเทสต์แบบ Debug
```bash
cd frontend/e2e
npx playwright test --debug
```

## 🎯 สรุป

- ✅ **run_browser_tests_auto.sh** - รันอัตโนมัติพร้อมเริ่ม frontend server (แนะนำ)
- ✅ **run_browser_tests.py** - รันด้วย Python script
- ✅ **run_browser_tests.sh** - รันด้วย Bash script

ทุกสคริปต์จะรัน tests ใน **headed mode** (แสดง browser window) เพื่อให้เห็นการทำงานของ tests

---

**วันที่สร้าง:** 2025-11-13
**เวอร์ชัน:** 1.0.0
