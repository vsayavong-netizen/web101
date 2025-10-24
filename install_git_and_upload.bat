@echo off
echo ========================================
echo    BM23 Project - Git Installation & Upload
echo ========================================
echo.

echo Step 1: Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo Git is not installed on this system.
    echo.
    echo Please follow these steps to install Git:
    echo.
    echo 1. Open your web browser
    echo 2. Go to: https://git-scm.com/download/win
    echo 3. Download "Git for Windows"
    echo 4. Run the installer with default settings
    echo 5. Restart this script after installation
    echo.
    echo After installing Git, run this script again.
    echo.
    pause
    exit /b 1
) else (
    echo Git is installed successfully!
    git --version
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

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    SUCCESS! Upload Complete!
    echo ========================================
    echo.
    echo Your BM23 project has been successfully uploaded to:
    echo https://github.com/projectsouk-rgb/bm23.git
    echo.
    echo You can now:
    echo - View your code on GitHub
    echo - Clone the repository on other machines
    echo - Collaborate with others
    echo - Use GitHub features like Issues, Pull Requests, etc.
    echo.
) else (
    echo.
    echo ========================================
    echo    ERROR! Upload Failed!
    echo ========================================
    echo.
    echo There was an error uploading to GitHub.
    echo Please check:
    echo 1. Your internet connection
    echo 2. GitHub credentials
    echo 3. Repository permissions
    echo.
    echo You may need to authenticate with GitHub.
    echo.
)

pause
