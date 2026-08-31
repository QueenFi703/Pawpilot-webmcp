#!/bin/bash
# Git push script for PawPilot

echo "🚀 PawPilot v2.0 - Git Push Script"
echo "===================================="

cd Pawpilot-webmcp

# Configure git
echo "Configuring git..."
git config core.longpaths true
git config --global user.email "dev@pawpilot.dev"
git config --global user.name "PawPilot Builder"

# Initialize if needed
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
  git remote add origin https://github.com/QueenFi703/Pawpilot-webmcp.git
  git branch -M main
fi

# Check status
echo "Current git status:"
git status

# Add all files
echo "Staging files..."
git add .

# Show what will be committed
echo "Files to commit:"
git diff --cached --name-only

# Commit
echo "Committing..."
git commit -m "feat: PawPilot v2.0 - AI-powered pet care with OpenAI and PostgreSQL

Major Features:
- OpenAI GPT-4/3.5 integration for dynamic agent orchestration
- PostgreSQL database with full persistence
- 5 functional MCP tools with real backends
- Docker Compose with health checks
- Docker Cloud ready for production
- Complete security implementation

Files:
- src/server.ts (OpenAI + DB integration)
- src/App.tsx (React UI)
- src/App.css (Styling)
- docker-compose.yml (PostgreSQL + App)
- schema.sql (Database schema)
- .env (Configuration)
- Comprehensive documentation

Ready for deployment!"

# Push to repository
echo "Pushing to GitHub..."
git push -u origin main

echo "✅ Push complete!"
echo "Visit: https://github.com/QueenFi703/Pawpilot-webmcp"
