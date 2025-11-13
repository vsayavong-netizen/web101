#!/bin/bash
# Security Audit Script for BM23 System
# This script runs security checks on both backend and frontend

set -e

echo "🔒 Starting Security Audit for BM23 System"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend Security Audit
echo "📦 Backend Security Audit"
echo "------------------------"
cd backend

# Check if safety is installed
if ! command -v safety &> /dev/null; then
    echo -e "${YELLOW}Installing safety...${NC}"
    pip install safety
fi

# Run safety check
echo -e "${GREEN}Running safety check on Python dependencies...${NC}"
safety check --json > ../security-reports/backend-safety-report.json 2>&1 || true
safety check || true

# Check if bandit is installed
if ! command -v bandit &> /dev/null; then
    echo -e "${YELLOW}Installing bandit...${NC}"
    pip install bandit
fi

# Run bandit security scan
echo -e "${GREEN}Running bandit security scan...${NC}"
bandit -r . -f json -o ../security-reports/backend-bandit-report.json || true
bandit -r . || true

cd ..

# Frontend Security Audit
echo ""
echo "📦 Frontend Security Audit"
echo "------------------------"
cd frontend

# Run npm audit
echo -e "${GREEN}Running npm audit...${NC}"
npm audit --json > ../security-reports/frontend-npm-audit-report.json 2>&1 || true
npm audit || true

cd ..

# Create reports directory if it doesn't exist
mkdir -p security-reports

# Summary
echo ""
echo "=========================================="
echo "✅ Security Audit Complete"
echo "=========================================="
echo ""
echo "Reports saved to:"
echo "  - security-reports/backend-safety-report.json"
echo "  - security-reports/backend-bandit-report.json"
echo "  - security-reports/frontend-npm-audit-report.json"
echo ""
echo "Review the reports and update vulnerable packages as needed."
