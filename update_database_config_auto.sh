#!/bin/bash

# ============================================
# Database Configuration Update Script (Auto)
# ============================================
# Script สำหรับแก้ไข database configuration ใน .env file
# ใช้ค่าพื้นฐานที่สามารถแก้ไขได้ภายหลัง

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

print_header "Database Configuration Update (Auto)"

# Show current values
echo "Current database configuration:"
echo "================================"
grep -E "^DB_(NAME|USER|PASSWORD)=" "$ENV_FILE" | sed 's/PASSWORD=.*/PASSWORD=***HIDDEN***/'
echo ""

# Check if still using template values
CURRENT_USER=$(grep "^DB_USER=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
CURRENT_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [[ "$CURRENT_USER" == *"your_db_user"* ]] || [[ "$CURRENT_PASSWORD" == *"your_strong_password"* ]]; then
    print_warning "Database configuration contains template values"
    echo ""
    echo "Setting default values (you can change them later):"
    echo ""
    
    # Generate default values
    DEFAULT_DB_USER="bm23_user"
    DEFAULT_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)
    
    # If openssl not available, use alternative
    if [ -z "$DEFAULT_DB_PASSWORD" ] || [ ${#DEFAULT_DB_PASSWORD} -lt 12 ]; then
        DEFAULT_DB_PASSWORD="Bm23SecurePass$(date +%s | sha256sum | base64 | head -c 16)"
    fi
    
    NEW_DB_USER="$DEFAULT_DB_USER"
    NEW_DB_PASSWORD="$DEFAULT_DB_PASSWORD"
    
    print_warning "Using default values:"
    echo "  DB_USER: $NEW_DB_USER"
    echo "  DB_PASSWORD: [GENERATED - See below]"
    echo ""
    print_warning "⚠️  IMPORTANT: Please update these values with your actual database credentials!"
    echo ""
    
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
    
    print_success "Database configuration updated with default values"
    echo ""
    echo "Updated values:"
    echo "  DB_USER=$NEW_DB_USER"
    echo "  DB_PASSWORD=$NEW_DB_PASSWORD"
    echo ""
    print_warning "⚠️  Save this password! You'll need it to create the database."
    echo ""
    
    # Save password to a temporary file (with warning)
    PASSWORD_FILE="${ENV_FILE}.password.txt"
    echo "$NEW_DB_PASSWORD" > "$PASSWORD_FILE"
    chmod 600 "$PASSWORD_FILE"
    print_warning "Password saved to: $PASSWORD_FILE (read-only, delete after use)"
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
    echo "1. Review the generated password in: $PASSWORD_FILE"
    echo "2. Update values if needed: nano backend/.env"
    echo "3. Verify configuration: python3 pre_deployment_check.py"
    echo "4. Create database: bash setup_database.sh"
    echo "5. Delete password file after use: rm $PASSWORD_FILE"
    
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
