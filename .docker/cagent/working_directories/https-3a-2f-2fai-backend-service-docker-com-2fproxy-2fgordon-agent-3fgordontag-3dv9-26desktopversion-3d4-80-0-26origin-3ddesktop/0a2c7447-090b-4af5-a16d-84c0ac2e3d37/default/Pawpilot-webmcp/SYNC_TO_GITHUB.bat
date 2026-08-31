@echo off
REM 🚀 ONE-COMMAND SYNC TO GITHUB (Windows)
REM Run this script to push all PawPilot v2.0 files to GitHub

echo.
echo 🐾 PawPilot v2.0 - GitHub Sync
echo ================================
echo.

cd Pawpilot-webmcp

echo [1/7] Configuring git...
git config --global user.email "dev@pawpilot.dev"
git config --global user.name "PawPilot v2.0"
echo ✅ Git configured
echo.

echo [2/7] Initializing repository...
if exist .git (
    echo Git repo already initialized
) else (
    git init
    echo ✅ Git initialized
)
echo.

echo [3/7] Staging all files...
git add .
echo ✅ Files staged
echo.

echo [4/7] Creating commit...
git commit -m "feat: PawPilot v2.0 - AI-powered pet care platform with OpenAI and PostgreSQL"
echo ✅ Commit created
echo.

echo [5/7] Setting main branch...
git branch -M main
echo ✅ Main branch set
echo.

echo [6/7] Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/QueenFi703/Pawpilot-webmcp.git
echo ✅ Remote added
echo.

echo [7/7] Pushing to GitHub...
git push -u origin main --force
echo ✅ Push complete!
echo.

echo ================================
echo ✅ SUCCESS!
echo ================================
echo.
echo Your repository is now synced!
echo.
echo 🌍 Visit:
echo    https://github.com/QueenFi703/Pawpilot-webmcp
echo.
echo 🚀 To run PawPilot locally:
echo    cd Pawpilot-webmcp
echo    docker compose up --build
echo.
echo Then open: http://localhost:3000
echo.
pause
