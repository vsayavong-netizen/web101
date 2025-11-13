#!/bin/bash

# ============================================
# Database Configuration Update Script
# ============================================
# Script สำหรับแก้ไข database configuration ใน .env file

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

ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    print_error ".env file not found at $ENV_FILE"
    exit 1
fi

print_header "Database Configuration Update"

# Show current values
echo "Current database configuration:"
echo "================================"
grep -E "^DB_(NAME|USER|PASSWORD)=" "$ENV_FILE" | sed 's/PASSWORD=.*/PASSWORD=***HIDDEN***/'
echo ""

# Check if still using template values
CURRENT_USER=$(grep "^DB_USER=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
CURRENT_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [[ "$CURRENT_USER" == *"your_db_user"* ]] || [[ "$CURRENT_PASSWORD" == *"your_strong_password"* ]]; then
    print_warning "Database configuration still contains template values!"
    echo ""
    echo "Please provide your database credentials:"
    echo ""
    
    # Get new values
    read -p "Database User Name: " NEW_DB_USER
    read -sp "Database Password: " NEW_DB_PASSWORD
    echo ""
    
    if [ -z "$NEW_DB_USER" ] || [ -z "$NEW_DB_PASSWORD" ]; then
        print_error "Database user and password are required!"
        exit 1
    fi
    
    # Update .env file
    print_header "Updating .env file"
    
    # Backup original
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    print_success "Backup created: ${ENV_FILE}.backup"
    
    # Update DB_USER
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/^DB_USER=.*/DB_USER=$NEW_DB_USER/" "$ENV_FILE"
        sed -i '' "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASSWORD/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/^DB_USER=.*/DB_USER=$NEW_DB_USER/" "$ENV_FILE"
        sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASSWORD/" "$ENV_FILE"
    fi
    
    print_success "Database configuration updated"
    echo ""
    echo "Updated values:"
    echo "  DB_USER=$NEW_DB_USER"
    echo "  DB_PASSWORD=***HIDDEN***"
    echo ""
    
    # Verify
    print_header "Verifying Configuration"
    if grep -q "^DB_USER=$NEW_DB_USER$" "$ENV_FILE"; then
        print_success "DB_USER updated correctly"
    else
        print_error "DB_USER update failed"
    fi
    
    if grep -q "^DB_PASSWORD=$NEW_DB_PASSWORD$" "$ENV_FILE"; then
        print_success "DB_PASSWORD updated correctly"
    else
        print_error "DB_PASSWORD update failed"
    fi
    
    print_header "Next Steps"
    echo "1. Verify configuration: python3 pre_deployment_check.py"
    echo "2. Create database: bash setup_database.sh"
    echo "3. Run migrations: cd backend && python manage.py migrate"
    
else
    print_success "Database configuration already updated"
    echo ""
    echo "Current configuration:"
    echo "  DB_USER=$CURRENT_USER"
    echo "  DB_PASSWORD=***HIDDEN***"
    echo ""
    echo "If you want to change it, edit backend/.env manually or run this script again."
fi

print_success "Database configuration update completed!"
