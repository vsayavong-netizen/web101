@echo off
REM Deploy eduinfo.online fix to GitHub and Render
REM Created: 2025-10-22

echo ========================================
echo   Deploy eduinfo.online Fix
echo ========================================
echo.

echo [1/4] Checking Git status...
git status

echo.
echo [2/4] Adding changed files...
git add backend/.env.production EDUINFO_ONLINE_FIX.md QUICK_FIX_SUMMARY.md DEPLOY_INSTRUCTIONS.md deploy_eduinfo_fix.bat

echo.
echo [3/4] Committing changes...
git commit -m "fix: add eduinfo.online to ALLOWED_HOSTS and update production settings"

echo.
echo [4/4] Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo   ✅ Changes pushed to GitHub!
echo ========================================
echo.
echo ⚠️ IMPORTANT: Render reads from Environment Variables, NOT from .env files!
echo.
echo Next steps (MUST DO):
echo.
echo 1. Go to Render Dashboard: https://dashboard.render.com
echo 2. Select your Web Service
echo 3. Go to "Environment" tab
echo 4. Update/Add these Environment Variables:
echo    Key: ALLOWED_HOSTS
echo    Value: eduinfo.online,www.eduinfo.online,localhost,127.0.0.1,0.0.0.0
echo.
echo    Key: DEBUG
echo    Value: False
echo.
echo    Key: CORS_ALLOWED_ORIGINS
echo    Value: https://eduinfo.online,https://www.eduinfo.online,http://localhost:3000,http://localhost:5173
echo.
echo    Key: CSRF_TRUSTED_ORIGINS
echo    Value: https://eduinfo.online,https://www.eduinfo.online
echo.
echo 5. Click "Save Changes"
echo 6. Render will redeploy automatically (or click "Manual Deploy")
echo 7. Wait 5-10 minutes for deployment
echo 8. Test at https://eduinfo.online/
echo.

pause

