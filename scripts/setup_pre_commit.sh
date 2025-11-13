#!/bin/bash
# Setup Pre-commit Hooks Script
# This script installs and configures pre-commit hooks

set -e

echo "🔧 Setting up Pre-commit Hooks"
echo "==============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if pre-commit is installed
if ! command -v pre-commit &> /dev/null; then
    echo -e "${YELLOW}Installing pre-commit...${NC}"
    pip install pre-commit
fi

# Install pre-commit hooks
echo -e "${GREEN}Installing pre-commit hooks...${NC}"
pre-commit install

# Install additional hooks
echo -e "${GREEN}Installing additional hooks...${NC}"
pre-commit install --hook-type pre-push
pre-commit install --hook-type commit-msg

# Run pre-commit on all files (optional)
read -p "Do you want to run pre-commit on all files now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Running pre-commit on all files...${NC}"
    pre-commit run --all-files
fi

echo ""
echo "============================================="
echo "✅ Pre-commit Hooks Setup Complete"
echo "============================================="
echo ""
echo "Pre-commit hooks are now active."
echo "They will run automatically on git commit."
