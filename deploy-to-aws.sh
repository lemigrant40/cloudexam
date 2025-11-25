#!/bin/bash

# ═══════════════════════════════════════════════════════════
# CloudExam Prep - AWS Deployment Script
# ═══════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   CloudExam Prep - AWS Deployment Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
REPO_NAME="${REPO_NAME:-cloudexam-prep}"

# Check if AWS_ACCOUNT_ID is set
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${YELLOW}⚠️  AWS_ACCOUNT_ID not set, attempting to retrieve...${NC}"
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        echo -e "${RED}❌ Could not determine AWS Account ID${NC}"
        echo -e "${YELLOW}Please set AWS_ACCOUNT_ID environment variable or configure AWS CLI${NC}"
        exit 1
    fi
fi

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPO_NAME"

echo -e "${GREEN}Configuration:${NC}"
echo -e "  AWS Region: ${BLUE}$AWS_REGION${NC}"
echo -e "  AWS Account ID: ${BLUE}$AWS_ACCOUNT_ID${NC}"
echo -e "  Repository Name: ${BLUE}$REPO_NAME${NC}"
echo -e "  ECR URI: ${BLUE}$ECR_URI${NC}"
echo ""

# Step 1: Build client
echo -e "${YELLOW}📦 Step 1/5: Building client...${NC}"
cd client
npm run build
cd ..
echo -e "${GREEN}✅ Client built successfully${NC}"
echo ""

# Step 2: Build Docker image
echo -e "${YELLOW}🐋 Step 2/5: Building Docker image...${NC}"
docker build -t $REPO_NAME:latest .
echo -e "${GREEN}✅ Docker image built successfully${NC}"
echo ""

# Step 3: Authenticate with ECR
echo -e "${YELLOW}🔐 Step 3/5: Authenticating with ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_URI
echo -e "${GREEN}✅ Authenticated with ECR${NC}"
echo ""

# Step 4: Tag and push image
echo -e "${YELLOW}🚀 Step 4/5: Pushing to ECR...${NC}"
docker tag $REPO_NAME:latest $ECR_URI:latest
docker push $ECR_URI:latest
echo -e "${GREEN}✅ Image pushed successfully${NC}"
echo ""

# Step 5: Get deployment instructions
echo -e "${YELLOW}📋 Step 5/5: Deployment Instructions${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Docker image pushed successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo -e "1️⃣  ${BLUE}Go to AWS App Runner Console:${NC}"
echo -e "   https://console.aws.amazon.com/apprunner/home?region=$AWS_REGION"
echo ""
echo -e "2️⃣  ${BLUE}Select your service and click 'Deploy'${NC}"
echo ""
echo -e "3️⃣  ${BLUE}Or use AWS CLI:${NC}"
echo -e "   ${GREEN}aws apprunner start-deployment \\${NC}"
echo -e "   ${GREEN}  --service-arn YOUR_SERVICE_ARN \\${NC}"
echo -e "   ${GREEN}  --region $AWS_REGION${NC}"
echo ""
echo -e "4️⃣  ${BLUE}Verify deployment:${NC}"
echo -e "   ${GREEN}curl https://YOUR_APP_URL/health${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}💡 Troubleshooting:${NC}"
echo ""
echo -e "• Check logs in AWS Console > App Runner > Logs"
echo -e "• Verify environment variables:"
echo -e "  - NODE_ENV=production"
echo -e "  - PORT=3000"
echo -e "• Ensure service is listening on 0.0.0.0:3000"
echo -e "• Check browser console for connection errors"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Deployment preparation complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
