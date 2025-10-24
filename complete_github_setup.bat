@echo off
echo ========================================
echo    BM23 Project - GitHub Setup
echo ========================================
echo.

echo Step 1: Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed. Please install Git first:
    echo 1. Go to https://git-scm.com/download/win
    echo 2. Download and install Git for Windows
    echo 3. Restart this script after installation
    echo.
    pause
    exit /b 1
) else (
    echo Git is installed successfully!
)

echo.
echo Step 2: Configuring Git for projectsouk@gmail.com...
git config --global user.name "projectsouk"
git config --global user.email "projectsouk@gmail.com"

echo.
echo Step 3: Initializing Git repository...
if exist .git (
    echo Git repository already exists.
) else (
    git init
    echo Git repository initialized.
)

echo.
echo Step 4: Adding all files to Git...
git add .

echo.
echo Step 5: Creating initial commit...
git commit -m "Initial commit: BM23 Project - Complete Django + React Application"

echo.
echo Step 6: Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/projectsouk-rgb/bm23.git

echo.
echo Step 7: Setting main branch and pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Your project has been uploaded to:
echo https://github.com/projectsouk-rgb/bm23.git
echo.
echo You can now:
echo - View your code on GitHub
echo - Clone the repository on other machines
echo - Collaborate with others
echo - Use GitHub features like Issues, Pull Requests, etc.
echo.
pause
