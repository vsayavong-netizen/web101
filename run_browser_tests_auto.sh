#!/bin/bash

# 🎯 สคริปต์สำหรับรัน Browser Tests อัตโนมัติ (พร้อมเริ่ม Frontend Server)
# Auto-run Browser Tests Script with Frontend Server

set -e  # Exit on error

echo "🚀 เริ่มรัน Browser Tests อัตโนมัติ..."
echo "=========================================="

# สีสำหรับ output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ตรวจสอบว่า frontend/e2e directory มีอยู่
if [ ! -d "frontend/e2e" ]; then
    echo -e "${RED}❌ ไม่พบ frontend/e2e directory${NC}"
    exit 1
fi

# ฟังก์ชันสำหรับตรวจสอบว่า server ทำงานอยู่หรือไม่
check_server() {
    local url=$1
    if curl -s -f "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# ตรวจสอบว่า frontend server ทำงานอยู่หรือไม่
FRONTEND_URL="http://localhost:5173"
echo -e "${BLUE}🔍 ตรวจสอบ Frontend Server...${NC}"
if check_server "$FRONTEND_URL"; then
    echo -e "${GREEN}✅ Frontend server ทำงานอยู่ที่ $FRONTEND_URL${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Frontend server ไม่ทำงาน${NC}"
    echo -e "${YELLOW}   กำลังเริ่ม frontend server...${NC}"
    FRONTEND_RUNNING=false
    
    # ตรวจสอบว่า frontend dependencies ติดตั้งแล้วหรือยัง
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "${YELLOW}📦 กำลังติดตั้ง frontend dependencies...${NC}"
        cd frontend
        npm install || {
            echo -e "${RED}❌ การติดตั้ง dependencies ล้มเหลว${NC}"
            echo -e "${YELLOW}   จะรันเทสต์โดยไม่เริ่ม frontend server${NC}"
            cd ..
            FRONTEND_RUNNING=false
        }
        cd ..
    fi
    
    # เริ่ม frontend server ใน background
    if [ "$FRONTEND_RUNNING" = false ]; then
        echo -e "${BLUE}🚀 กำลังเริ่ม frontend server...${NC}"
        cd frontend
        npm run dev > /tmp/frontend_server.log 2>&1 &
        FRONTEND_PID=$!
        cd ..
        
        # รอให้ frontend server เริ่มทำงาน
        echo -e "${YELLOW}⏳ รอ frontend server เริ่มทำงาน...${NC}"
        for i in {1..30}; do
            if check_server "$FRONTEND_URL"; then
                echo -e "${GREEN}✅ Frontend server เริ่มทำงานแล้ว${NC}"
                FRONTEND_RUNNING=true
                break
            fi
            sleep 1
        done
        
        if [ "$FRONTEND_RUNNING" = false ]; then
            echo -e "${RED}❌ Frontend server ไม่สามารถเริ่มทำงานได้${NC}"
            echo -e "${YELLOW}   ดู log: tail -f /tmp/frontend_server.log${NC}"
            kill $FRONTEND_PID 2>/dev/null || true
        fi
    fi
fi

echo ""

# ตรวจสอบว่า backend server ทำงานอยู่หรือไม่
BACKEND_URL="http://localhost:8000"
echo -e "${BLUE}🔍 ตรวจสอบ Backend Server...${NC}"
if check_server "$BACKEND_URL/health/" || check_server "$BACKEND_URL/api/"; then
    echo -e "${GREEN}✅ Backend server ทำงานอยู่ที่ $BACKEND_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Backend server อาจไม่ทำงานที่ $BACKEND_URL${NC}"
    echo -e "${YELLOW}   แต่จะรันเทสต์ต่อไป...${NC}"
fi

echo ""

cd frontend/e2e

# ตรวจสอบว่า node_modules มีอยู่หรือไม่
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 กำลังติดตั้ง e2e dependencies...${NC}"
    npm install
fi

# ตรวจสอบว่า Playwright browsers ติดตั้งแล้วหรือยัง
if [ ! -d "node_modules/@playwright/test" ]; then
    echo -e "${YELLOW}📦 กำลังติดตั้ง Playwright browsers...${NC}"
    npx playwright install --with-deps chromium
fi

echo -e "${GREEN}✅ Dependencies พร้อมแล้ว${NC}"
echo ""

# ตั้งค่า environment variables
export PLAYWRIGHT_TEST_BASE_URL="${PLAYWRIGHT_TEST_BASE_URL:-$FRONTEND_URL}"

echo -e "${BLUE}📋 การตั้งค่า:${NC}"
echo "   - Base URL: $PLAYWRIGHT_TEST_BASE_URL"
echo "   - Browser Mode: Headed (แสดง browser window)"
echo "   - Reporter: HTML"
echo ""

# รันเทสต์แบบ headed mode (แสดง browser)
echo -e "${GREEN}🧪 เริ่มรัน Browser Tests...${NC}"
echo "=========================================="

# รันเทสต์แบบ headed mode และแสดงผลแบบ verbose
npx playwright test --headed --reporter=html,list

# เก็บ exit code
TEST_EXIT_CODE=$?

# หยุด frontend server ถ้าเราเป็นคนเริ่มมัน
if [ -n "$FRONTEND_PID" ] && [ "$FRONTEND_RUNNING" = true ]; then
    echo ""
    echo -e "${YELLOW}🛑 กำลังปิด frontend server...${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Frontend server ปิดแล้ว${NC}"
fi

echo ""
echo "=========================================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ ทุกเทสต์ผ่าน!${NC}"
else
    echo -e "${RED}❌ มีเทสต์บางอันล้มเหลว${NC}"
fi

echo ""
echo -e "${BLUE}📊 เปิดดูรายงานผล:${NC}"
echo "   cd frontend/e2e && npx playwright show-report"
echo ""
echo -e "${BLUE}🎯 สรุป:${NC}"
echo "   - รันเทสต์ใน browser mode (headed)"
echo "   - ใช้ Chromium browser"
echo "   - รายงานผลอยู่ใน HTML format"

exit $TEST_EXIT_CODE
