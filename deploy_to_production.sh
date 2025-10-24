#!/bin/bash

# Production Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting Production Deployment..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env not found${NC}"
    echo "Please create backend/.env from backend/.env.production"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    echo -e "${YELLOW}⚠️  Warning: frontend/.env.production not found${NC}"
    echo "Using default environment variables"
fi

# 1. Backend Setup
echo -e "${GREEN}📦 Step 1: Setting up Backend...${NC}"
cd backend

# Install Python dependencies
echo "Installing Python dependencies..."
if [ -d "../.venv" ]; then
    source ../.venv/bin/activate || source ../.venv/Scripts/activate
else
    python3 -m venv ../.venv
    source ../.venv/bin/activate || source ../.venv/Scripts/activate
fi

pip install -r ../requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if needed
if [ -n "$DJANGO_SUPERUSER_USERNAME" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput || echo "Superuser already exists"
fi

cd ..

# 2. Frontend Build
echo ""
echo -e "${GREEN}📦 Step 2: Building Frontend...${NC}"
cd frontend

# Install Node dependencies
echo "Installing Node dependencies..."
npm ci --production=false

# Build for production
echo "Building frontend..."
if [ -f ".env.production" ]; then
    npm run build -- --mode production
else
    npm run build
fi

cd ..

# 3. Run Tests (optional)
echo ""
echo -e "${GREEN}🧪 Step 3: Running Tests...${NC}"
cd backend
python manage.py test --noinput || echo "Some tests failed"
cd ..

# 4. Final checks
echo ""
echo -e "${GREEN}✅ Step 4: Final Checks...${NC}"

# Check DEBUG mode
DEBUG_VALUE=$(grep "^DEBUG=" backend/.env | cut -d'=' -f2)
if [ "$DEBUG_VALUE" = "True" ]; then
    echo -e "${RED}❌ WARNING: DEBUG=True in production!${NC}"
    echo "Please set DEBUG=False in backend/.env"
    exit 1
else
    echo -e "${GREEN}✅ DEBUG mode is OFF${NC}"
fi

# Check SECRET_KEY
SECRET_KEY=$(grep "^SECRET_KEY=" backend/.env | cut -d'=' -f2)
if [[ $SECRET_KEY == *"development"* ]]; then
    echo -e "${RED}❌ WARNING: Using development SECRET_KEY!${NC}"
    echo "Please generate a new SECRET_KEY for production"
    exit 1
else
    echo -e "${GREEN}✅ SECRET_KEY is configured${NC}"
fi

# Check ALLOWED_HOSTS
ALLOWED_HOSTS=$(grep "^ALLOWED_HOSTS=" backend/.env | cut -d'=' -f2)
if [[ $ALLOWED_HOSTS == *"localhost"* ]]; then
    echo -e "${YELLOW}⚠️  Warning: ALLOWED_HOSTS contains localhost${NC}"
    echo "Make sure to add your production domain"
fi

echo ""
echo -e "${GREEN}🎉 Deployment Preparation Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with production values"
echo "2. Update frontend/.env.production with API URL"
echo "3. Setup web server (Nginx/Apache)"
echo "4. Configure SSL/TLS certificates"
echo "5. Start application services"
echo ""
echo "See PRODUCTION_DEPLOYMENT_CHECKLIST.md for detailed instructions"

