#!/bin/bash
# Performance Audit Script for BM23 System
# This script analyzes performance metrics

set -e

echo "⚡ Starting Performance Audit for BM23 System"
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend Performance Analysis
echo "📊 Backend Performance Analysis"
echo "-------------------------------"
cd backend

# Check for slow queries (requires Django debug toolbar or similar)
echo -e "${GREEN}Checking database query performance...${NC}"
echo "Run: python manage.py shell"
echo "Then execute:"
echo "  from django.db import connection"
echo "  print(connection.queries)"
echo ""

# Check for N+1 queries
echo -e "${GREEN}Checking for potential N+1 queries...${NC}"
echo "Review views.py files for missing select_related/prefetch_related"
echo ""

# Frontend Performance Analysis
echo ""
echo "📊 Frontend Performance Analysis"
echo "-------------------------------"
cd ../frontend

# Build and analyze bundle size
echo -e "${GREEN}Building frontend for analysis...${NC}"
npm run build

# Check bundle sizes
echo -e "${GREEN}Analyzing bundle sizes...${NC}"
if [ -d "dist" ]; then
    echo "Bundle sizes:"
    du -sh dist/*
    echo ""
    echo "Largest files:"
    find dist -type f -exec du -h {} + | sort -rh | head -10
fi

cd ..

# Summary
echo ""
echo "============================================="
echo "✅ Performance Audit Complete"
echo "============================================="
echo ""
echo "Recommendations:"
echo "  1. Review database queries for optimization"
echo "  2. Add select_related/prefetch_related where needed"
echo "  3. Implement API response caching"
echo "  4. Optimize frontend bundle size"
echo "  5. Add database indexes for frequently queried fields"
