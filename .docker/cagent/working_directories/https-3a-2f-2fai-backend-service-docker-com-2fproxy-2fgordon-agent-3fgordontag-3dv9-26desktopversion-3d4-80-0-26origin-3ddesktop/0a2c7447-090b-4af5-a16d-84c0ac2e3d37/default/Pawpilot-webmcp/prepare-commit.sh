#!/bin/bash
# Prepare PawPilot for git commit
# Usage: ./prepare-commit.sh

set -e

echo "🐾 PawPilot - Prepare for Git Commit"
echo "===================================="

# Clean up artifacts
echo "Cleaning up build artifacts..."
rm -rf dist/
rm -rf node_modules/
rm -f req.json
rm -f *.log

echo "✅ Artifacts cleaned"

# Verify key files exist
echo "Verifying source files..."
files=(
  "src/server.ts"
  "src/App.tsx"
  "src/App.css"
  "src/index.tsx"
  "index.html"
  "Dockerfile"
  "docker-compose.yml"
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "vite.config.ts"
  ".gitignore"
  ".dockerignore"
  "QUICKSTART.md"
  "DELIVERY_PACKAGE.md"
  "IMPLEMENTATION_SUMMARY.md"
  "GIT_COMMIT_GUIDE.md"
)

missing=0
for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing: $file"
    missing=$((missing + 1))
  fi
done

if [ $missing -eq 0 ]; then
  echo "✅ All source files present"
else
  echo "⚠️ $missing files missing"
fi

# Show what will be committed
echo ""
echo "Files to commit:"
echo "==============="
find . -type f \
  ! -path './node_modules/*' \
  ! -path './dist/*' \
  ! -path './.git/*' \
  ! -name '*.log' \
  ! -name 'req.json' \
  -exec ls -lh {} \; | awk '{print $9, "(" $5 ")"}'

echo ""
echo "Ready to commit!"
echo "==============="
echo "Run these commands:"
echo "  git add ."
echo "  git commit -m \"feat: complete WebMCP implementation with polished UI\""
echo "  git push origin main"
