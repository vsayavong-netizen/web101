@echo off
REM Secure .env File - Easy Launcher
REM This script launches the PowerShell security script

echo.
echo ========================================
echo   Secure .env File Permissions
echo ========================================
echo.
echo This will set restrictive permissions on your .env file.
echo.
echo IMPORTANT: This script should be run as Administrator
echo            for full functionality.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell not found!
    echo Please install PowerShell or run the commands manually.
    pause
    exit /b 1
)

REM Run the PowerShell script
echo.
echo Running security script...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0secure_env_permissions.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Script failed!
    echo Try running this batch file as Administrator.
    echo.
    pause
    exit /b 1
)

echo.
echo Done!
pause

