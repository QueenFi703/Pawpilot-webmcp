#!/bin/bash
# 🚀 ONE-COMMAND SYNC TO GITHUB
# Run this script to push all PawPilot v2.0 files to GitHub

set -e

echo "🐾 PawPilot v2.0 - GitHub Sync"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd Pawpilot-webmcp

echo -e "${BLUE}Step 1: Configuring git...${NC}"
git config --global user.email "dev@pawpilot.dev"
git config --global user.name "PawPilot v2.0"

echo -e "${GREEN}✅ Git configured${NC}"
echo ""

echo -e "${BLUE}Step 2: Initializing repository...${NC}"
if [ -d .git ]; then
    echo "Git repo already initialized"
else
    git init
    echo -e "${GREEN}✅ Git initialized${NC}"
fi
echo ""

echo -e "${BLUE}Step 3: Staging all files...${NC}"
git add .
echo -e "${GREEN}✅ Files staged${NC}"
echo ""

echo -e "${BLUE}Step 4: Creating commit...${NC}"
git commit -m "feat: PawPilot v2.0 - Complete AI-powered pet care platform

🤖 Features:
- OpenAI GPT-4/3.5 integration with dynamic orchestration
- PostgreSQL database with full persistence layer
- 5 MCP tools with real API backends
- React UI with real-time tool inspector
- Docker Compose with PostgreSQL service
- Docker Cloud deployment ready
- Complete security implementation
- 13+ comprehensive documentation files

📦 Components:
- Backend: Express.js + OpenAI + PostgreSQL
- Frontend: React 18 + TypeScript + Vite
- Database: PostgreSQL with optimized schema
- Deployment: Docker + Docker Compose + Docker Cloud

🔐 Security:
- API keys in environment variables
- Database credentials protected
- CORS properly configured
- Health checks enabled
- Non-root Docker user

📖 Documentation:
- START_HERE.md - Quick start guide
- DEPLOY_V2.md - Complete deployment
- OPENAI_SETUP.md - API configuration
- DOCKER_CLOUD_DEPLOYMENT.md - Cloud setup
- Plus 9+ additional guides

✅ Status: Production Ready"

echo -e "${GREEN}✅ Commit created${NC}"
echo ""

echo -e "${BLUE}Step 5: Setting main branch...${NC}"
git branch -M main
echo -e "${GREEN}✅ Main branch set${NC}"
echo ""

echo -e "${BLUE}Step 6: Adding remote repository...${NC}"
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/QueenFi703/Pawpilot-webmcp.git
echo -e "${GREEN}✅ Remote added${NC}"
echo ""

echo -e "${BLUE}Step 7: Pushing to GitHub...${NC}"
git push -u origin main --force
echo -e "${GREEN}✅ Push complete!${NC}"
echo ""

echo "================================"
echo -e "${GREEN}✅ SUCCESS!${NC}"
echo "================================"
echo ""
echo "Your repository is now synced!"
echo ""
echo "🌍 Visit:"
echo "   https://github.com/QueenFi703/Pawpilot-webmcp"
echo ""
echo "🚀 To run PawPilot locally:"
echo "   cd Pawpilot-webmcp"
echo "   docker compose up --build"
echo ""
echo "Then open: http://localhost:3000"
echo ""
