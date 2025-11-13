#!/bin/bash

# ============================================
# Database Setup Script
# ============================================
# Script สำหรับสร้าง PostgreSQL database สำหรับ production

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

# Read database config from .env
ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    print_error ".env file not found at $ENV_FILE"
    exit 1
fi

# Extract database config
DB_NAME=$(grep "^DB_NAME=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
DB_USER=$(grep "^DB_USER=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")

print_header "Database Setup Configuration"
echo "DB_NAME: $DB_NAME"
echo "DB_USER: $DB_USER"
echo "DB_PASSWORD: [HIDDEN]"
echo ""

# Check if values are still template values
if [[ "$DB_USER" == *"your_db_user"* ]] || [[ "$DB_PASSWORD" == *"your_strong_password"* ]]; then
    print_warning "Database configuration still contains template values!"
    print_warning "Please update backend/.env with your actual database credentials first."
    echo ""
    echo "Required updates in backend/.env:"
    echo "  DB_USER=your_actual_db_user"
    echo "  DB_PASSWORD=your_actual_password"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_header "Creating PostgreSQL Database"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL client (psql) not found!"
    print_warning "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  Or use: sudo apt install postgresql-client"
    exit 1
fi

# Check if PostgreSQL service is running
if ! sudo systemctl is-active --quiet postgresql 2>/dev/null; then
    print_warning "PostgreSQL service might not be running"
    print_warning "Attempting to start PostgreSQL..."
    sudo systemctl start postgresql || print_warning "Could not start PostgreSQL service"
fi

print_header "Creating Database and User"

# Create SQL script
SQL_SCRIPT=$(mktemp)
cat > "$SQL_SCRIPT" <<EOF
-- Create database
CREATE DATABASE $DB_NAME;

-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Set user properties
ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
ALTER ROLE $DB_USER SET timezone TO 'UTC';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

print_header "Executing Database Setup"

# Try to execute as postgres user
if sudo -u postgres psql -f "$SQL_SCRIPT" 2>&1; then
    print_success "Database and user created successfully"
else
    print_error "Failed to create database"
    print_warning "You may need to run this manually:"
    echo ""
    echo "sudo -u postgres psql"
    echo ""
    echo "Then run:"
    cat "$SQL_SCRIPT"
    echo ""
    rm "$SQL_SCRIPT"
    exit 1
fi

# Clean up
rm "$SQL_SCRIPT"

print_header "Verifying Database Connection"

# Test connection
if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection verified"
else
    print_warning "Could not verify database connection automatically"
    print_warning "Please test manually:"
    echo "  PGPASSWORD='$DB_PASSWORD' psql -h localhost -U $DB_USER -d $DB_NAME"
fi

print_header "Database Setup Complete"

echo "Next steps:"
echo "1. Run migrations: cd backend && python manage.py migrate"
echo "2. Create superuser: cd backend && python manage.py createsuperuser"
echo "3. Run pre-deployment check: python3 pre_deployment_check.py"

print_success "Database setup completed!"
