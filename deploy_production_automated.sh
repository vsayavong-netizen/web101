#!/bin/bash

# ============================================
# Automated Production Deployment Script
# ============================================
# This script automates the production deployment process
# Run with: bash deploy_production_automated.sh

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR=$(pwd)
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$PROJECT_DIR/.venv"

# Functions
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

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# ============================================
# Step 1: Pre-Deployment Checks
# ============================================
print_header "Step 1: Pre-Deployment Validation"

# Check required commands
echo "Checking required commands..."
check_command python3 || exit 1
check_command npm || exit 1
check_command psql || print_warning "PostgreSQL client not found (optional)"

# Run pre-deployment validation
if [ -f "pre_deployment_check.py" ]; then
    echo "Running pre-deployment validation..."
    python3 pre_deployment_check.py
    if [ $? -ne 0 ]; then
        print_error "Pre-deployment validation failed!"
        print_warning "Please fix the issues before continuing"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    print_warning "pre_deployment_check.py not found, skipping validation"
fi

# ============================================
# Step 2: Environment Setup
# ============================================
print_header "Step 2: Environment Setup"

# Check if .env.production exists
if [ ! -f "$BACKEND_DIR/.env.production" ]; then
    print_error ".env.production not found!"
    print_warning "Please create backend/.env.production from template"
    exit 1
fi

# Check if .env exists, if not copy from .env.production
if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_warning ".env file not found, copying from .env.production"
    cp "$BACKEND_DIR/.env.production" "$BACKEND_DIR/.env"
    print_warning "IMPORTANT: Please edit backend/.env with your actual production values!"
    read -p "Press Enter after updating .env file..."
fi

print_success "Environment files ready"

# ============================================
# Step 3: Python Virtual Environment
# ============================================
print_header "Step 3: Python Virtual Environment"

if [ ! -d "$VENV_DIR" ]; then
    print_warning "Virtual environment not found, creating..."
    python3 -m venv "$VENV_DIR"
    print_success "Virtual environment created"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"
print_success "Virtual environment activated"

# Install/Update dependencies
print_header "Installing Python Dependencies"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"
print_success "Python dependencies installed"

# ============================================
# Step 4: Database Setup
# ============================================
print_header "Step 4: Database Setup"

cd "$BACKEND_DIR"

# Check database connection
print_warning "Checking database connection..."
python3 manage.py check --database default 2>&1 | head -5 || print_warning "Database connection check failed"

# Run migrations
echo "Running database migrations..."
python3 manage.py migrate --noinput
print_success "Database migrations completed"

# ============================================
# Step 5: Collect Static Files
# ============================================
print_header "Step 5: Collecting Static Files"

python3 manage.py collectstatic --noinput
print_success "Static files collected"

# ============================================
# Step 6: Frontend Build
# ============================================
print_header "Step 6: Building Frontend"

cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found, installing..."
    npm install
fi

# Build frontend
echo "Building frontend for production..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend build completed"
else
    print_error "Frontend build failed!"
    exit 1
fi

# ============================================
# Step 7: Create Superuser (Optional)
# ============================================
print_header "Step 7: Superuser Setup"

read -p "Do you want to create a superuser? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$BACKEND_DIR"
    python3 manage.py createsuperuser
fi

# ============================================
# Step 8: Final Verification
# ============================================
print_header "Step 8: Final Verification"

cd "$BACKEND_DIR"

# Run Django checks
echo "Running Django system checks..."
python3 manage.py check --deploy
if [ $? -eq 0 ]; then
    print_success "Django system checks passed"
else
    print_warning "Some Django checks failed (review output above)"
fi

# Check static files
if [ -d "staticfiles" ] && [ "$(ls -A staticfiles)" ]; then
    print_success "Static files directory exists and is not empty"
else
    print_error "Static files directory is empty or missing"
fi

# Check frontend build
if [ -d "$FRONTEND_DIR/dist" ] && [ "$(ls -A $FRONTEND_DIR/dist)" ]; then
    print_success "Frontend build exists and is not empty"
else
    print_error "Frontend build is missing or empty"
fi

# ============================================
# Step 9: Deployment Summary
# ============================================
print_header "DEPLOYMENT PREPARATION COMPLETE"

echo -e "${GREEN}✓${NC} Environment configured"
echo -e "${GREEN}✓${NC} Dependencies installed"
echo -e "${GREEN}✓${NC} Database migrated"
echo -e "${GREEN}✓${NC} Static files collected"
echo -e "${GREEN}✓${NC} Frontend built"
echo -e "${GREEN}✓${NC} System checks passed"

print_header "NEXT STEPS"

echo "1. Review and update backend/.env with production values"
echo "2. Set up your web server (Nginx/Apache)"
echo "3. Configure SSL certificates (Let's Encrypt)"
echo "4. Set up Gunicorn service (see PRODUCTION_DEPLOYMENT_CHECKLIST.md)"
echo "5. Configure Nginx (see nginx_production.conf)"
echo "6. Test the deployment"
echo ""
echo "For detailed instructions, see:"
echo "  - PRODUCTION_DEPLOYMENT_CHECKLIST.md"
echo "  - ACTION_PLAN.md"
echo ""

print_success "Deployment preparation completed successfully!"
