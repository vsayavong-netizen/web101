#!/bin/bash

# ============================================
# Complete Deployment Steps Runner
# ============================================
# Script สำหรับรันขั้นตอน deployment ทั้งหมดตามลำดับ

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Step counter
STEP=1
TOTAL_STEPS=5

print_header "DEPLOYMENT STEPS RUNNER"
echo "This script will guide you through the deployment process."
echo ""

# Step 1: Pre-Deployment Check
print_header "Step $STEP/$TOTAL_STEPS: Pre-Deployment Check"
if python3 pre_deployment_check.py; then
    print_success "Pre-deployment check passed"
else
    print_error "Pre-deployment check failed"
    print_warning "Please fix the issues before continuing"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
STEP=$((STEP+1))

# Step 2: Database Setup
print_header "Step $STEP/$TOTAL_STEPS: Database Setup"
echo "Do you want to create the database now?"
read -p "Create database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if bash setup_database.sh; then
        print_success "Database setup completed"
    else
        print_warning "Database setup had issues, but continuing..."
    fi
else
    print_warning "Skipping database setup"
    print_warning "Make sure database is created before running migrations"
fi
STEP=$((STEP+1))

# Step 3: Run Migrations
print_header "Step $STEP/$TOTAL_STEPS: Database Migrations"
echo "Do you want to run migrations now?"
read -p "Run migrations? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    if python3 manage.py migrate --noinput; then
        print_success "Migrations completed"
    else
        print_error "Migrations failed"
        exit 1
    fi
    cd ..
else
    print_warning "Skipping migrations"
    print_warning "Run manually: cd backend && python manage.py migrate"
fi
STEP=$((STEP+1))

# Step 4: Automated Deployment
print_header "Step $STEP/$TOTAL_STEPS: Automated Deployment"
echo "Ready to run the automated deployment script?"
echo "This will:"
echo "  - Install dependencies"
echo "  - Collect static files"
echo "  - Build frontend"
echo "  - Run system checks"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if bash deploy_production_automated.sh; then
        print_success "Automated deployment completed"
    else
        print_error "Automated deployment failed"
        exit 1
    fi
else
    print_warning "Skipping automated deployment"
    print_warning "Run manually: bash deploy_production_automated.sh"
fi
STEP=$((STEP+1))

# Step 5: Final Verification
print_header "Step $STEP/$TOTAL_STEPS: Final Verification"
echo "Deployment preparation is complete!"
echo ""
echo "Next steps for production server:"
echo "1. Set up Gunicorn service (see PRODUCTION_DEPLOYMENT_CHECKLIST.md)"
echo "2. Configure Nginx (see nginx_production.conf)"
echo "3. Set up SSL certificate (Let's Encrypt)"
echo "4. Test the deployment"
echo ""
echo "For post-deployment verification, run:"
echo "  python3 post_deployment_verify.py https://yourdomain.com"

print_header "DEPLOYMENT PREPARATION COMPLETE"

print_success "All steps completed successfully!"
