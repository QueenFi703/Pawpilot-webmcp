@echo off
REM Prepare PawPilot for git commit (Windows batch script)
REM Usage: prepare-commit.bat

setlocal enabledelayedexpansion

echo.
echo 🐾 PawPilot - Prepare for Git Commit
echo ====================================

echo Cleaning up build artifacts...

REM Remove directories
if exist dist rmdir /s /q dist
if exist node_modules rmdir /s /q node_modules

REM Remove files
if exist req.json del req.json
for %%f in (*.log) do del "%%f" 2>nul

echo ✅ Artifacts cleaned

echo.
echo Verifying source files...

setlocal
set missing=0

for %%f in (
  src\server.ts
  src\App.tsx
  src\App.css
  src\index.tsx
  index.html
  Dockerfile
  docker-compose.yml
  package.json
  package-lock.json
  tsconfig.json
  vite.config.ts
  .gitignore
  .dockerignore
  QUICKSTART.md
  DELIVERY_PACKAGE.md
  IMPLEMENTATION_SUMMARY.md
  GIT_COMMIT_GUIDE.md
) do (
  if not exist "%%f" (
    echo ❌ Missing: %%f
    set /a missing=!missing!+1
  )
)

if %missing% equ 0 (
  echo ✅ All source files present
) else (
  echo ⚠️ !missing! files missing
)

echo.
echo Files ready to commit:
echo ======================
dir /s /b /a:-d | findstr /v "node_modules dist .git *.log req.json"

echo.
echo Ready to commit!
echo ===============
echo Run these commands:
echo   git add .
echo   git commit -m "feat: complete WebMCP implementation with polished UI"
echo   git push origin main

endlocal
