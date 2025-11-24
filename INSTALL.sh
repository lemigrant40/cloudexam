#!/bin/bash

# CloudExam Prep - Installation Script
# Automated setup for development environment

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════"
echo "   CloudExam Prep - Installation Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}[1/5]${NC} Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 18 or higher: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js version too old (found v$NODE_VERSION, need v18+)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) found${NC}"

# Check Python (optional, for parser)
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓ Python $(python3 --version) found${NC}"
else
    echo -e "${YELLOW}⚠ Python not found (optional, needed for question parser)${NC}"
fi

# Check Docker (optional)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) found${NC}"
else
    echo -e "${YELLOW}⚠ Docker not found (optional, needed for deployment)${NC}"
fi

echo ""

# Install root dependencies
echo -e "${BLUE}[2/5]${NC} Installing root dependencies..."
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"
echo ""

# Install client dependencies
echo -e "${BLUE}[3/5]${NC} Installing client dependencies..."
cd client
npm install
cd ..
echo -e "${GREEN}✓ Client dependencies installed${NC}"
echo ""

# Check for questions.json
echo -e "${BLUE}[4/5]${NC} Checking for questions.json..."
if [ -f "questions.json" ]; then
    QUESTION_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('questions.json')).length)")
    echo -e "${GREEN}✓ Found questions.json with $QUESTION_COUNT questions${NC}"
else
    echo -e "${YELLOW}⚠ questions.json not found${NC}"
    echo "  You need to run the parser to create it:"
    echo "  ${BLUE}python3 parser.py${NC}"
    echo ""
fi

# Create .env.example if not exists
echo -e "${BLUE}[5/5]${NC} Setting up configuration..."
if [ ! -f "client/.env" ]; then
    cat > client/.env << EOF
# Socket.io server URL
VITE_SOCKET_URL=http://localhost:3000
EOF
    echo -e "${GREEN}✓ Created client/.env${NC}"
else
    echo -e "${GREEN}✓ client/.env already exists${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Installation complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Show next steps
echo "Next steps:"
echo ""

if [ ! -f "questions.json" ]; then
    echo -e "1. ${YELLOW}Parse your exam questions:${NC}"
    echo -e "   ${BLUE}python3 parser.py${NC}"
    echo "   (Paste your PDF text and press Ctrl+D when done)"
    echo ""
fi

echo -e "2. ${YELLOW}Start the development server:${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "   This will start:"
echo "   - Backend on  http://localhost:3000"
echo "   - Frontend on http://localhost:5173"
echo ""

echo -e "3. ${YELLOW}Open your browser:${NC}"
echo "   http://localhost:5173"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""

# Offer to start dev server
read -p "Do you want to start the development server now? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -f "questions.json" ]; then
        echo -e "${YELLOW}Warning: questions.json not found. You'll need to create it first.${NC}"
        echo "Starting server anyway (you can add questions later)..."
        echo ""
    fi

    echo -e "${GREEN}Starting development server...${NC}"
    npm run dev
fi
