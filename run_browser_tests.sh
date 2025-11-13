#!/bin/bash

# 🎯 สคริปต์สำหรับรัน Browser Tests อัตโนมัติด้วย Playwright
# Auto-run Browser Tests Script

set -e  # Exit on error

echo "🚀 เริ่มรัน Browser Tests อัตโนมัติ..."
echo "=========================================="

# สีสำหรับ output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ตรวจสอบว่า frontend/e2e directory มีอยู่
if [ ! -d "frontend/e2e" ]; then
    echo -e "${RED}❌ ไม่พบ frontend/e2e directory${NC}"
    exit 1
fi

cd frontend/e2e

# ตรวจสอบว่า node_modules มีอยู่หรือไม่
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 กำลังติดตั้ง dependencies...${NC}"
    npm install
fi

# ตรวจสอบว่า Playwright browsers ติดตั้งแล้วหรือยัง
if [ ! -d "node_modules/@playwright/test" ]; then
    echo -e "${YELLOW}📦 กำลังติดตั้ง Playwright browsers...${NC}"
    npx playwright install --with-deps chromium
fi

echo -e "${GREEN}✅ Dependencies พร้อมแล้ว${NC}"
echo ""

# ตรวจสอบว่า backend server ทำงานอยู่หรือไม่
echo "🔍 ตรวจสอบ Backend Server..."
BACKEND_URL="http://localhost:8000"
if curl -s -f "$BACKEND_URL/health/" > /dev/null 2>&1 || curl -s -f "$BACKEND_URL/api/" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server ทำงานอยู่ที่ $BACKEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Backend server อาจไม่ทำงานที่ $BACKEND_URL${NC}"
    echo -e "${YELLOW}   แต่จะรันเทสต์ต่อไป...${NC}"
fi

echo ""

# ตั้งค่า environment variables
export PLAYWRIGHT_TEST_BASE_URL="${PLAYWRIGHT_TEST_BASE_URL:-http://localhost:5173}"

echo "📋 การตั้งค่า:"
echo "   - Base URL: $PLAYWRIGHT_TEST_BASE_URL"
echo "   - Browser Mode: Headed (แสดง browser window)"
echo "   - Reporter: HTML"
echo ""

# รันเทสต์แบบ headed mode (แสดง browser)
echo -e "${GREEN}🧪 เริ่มรัน Browser Tests...${NC}"
echo "=========================================="

# รันเทสต์แบบ headed mode และแสดงผลแบบ verbose
npx playwright test --headed --reporter=html,list

# ตรวจสอบผลลัพธ์
TEST_EXIT_CODE=$?

echo ""
echo "=========================================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ ทุกเทสต์ผ่าน!${NC}"
    echo ""
    echo "📊 เปิดดูรายงานผล:"
    echo "   npx playwright show-report"
else
    echo -e "${RED}❌ มีเทสต์บางอันล้มเหลว${NC}"
    echo ""
    echo "📊 เปิดดูรายงานผล:"
    echo "   npx playwright show-report"
fi

echo ""
echo "🎯 สรุป:"
echo "   - รันเทสต์ใน browser mode (headed)"
echo "   - ใช้ Chromium browser"
echo "   - รายงานผลอยู่ใน HTML format"

exit $TEST_EXIT_CODE
