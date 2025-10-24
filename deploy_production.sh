#!/bin/bash

echo "========================================"
echo " DEPLOY TO PRODUCTION SCRIPT"
echo "========================================"
echo

echo "[1/4] Building Frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend build failed!"
    exit 1
fi
echo "✓ Frontend build completed successfully"
echo

echo "[2/4] Collecting Static Files..."
cd ../backend
python manage.py collectstatic --noinput
if [ $? -ne 0 ]; then
    echo "ERROR: Static files collection failed!"
    exit 1
fi
echo "✓ Static files collected successfully"
echo

echo "[3/4] Verifying Assets..."
if [ -f "staticfiles/assets/index-CmzFPlXl.css" ]; then
    echo "✓ CSS file found"
else
    echo "ERROR: CSS file not found!"
    exit 1
fi

if [ -f "staticfiles/assets/index-DvwsR5qq.js" ]; then
    echo "✓ Main JS file found"
else
    echo "ERROR: Main JS file not found!"
    exit 1
fi

if [ -f "staticfiles/assets/vendor-Dvwkxfce.js" ]; then
    echo "✓ Vendor JS file found"
else
    echo "ERROR: Vendor JS file not found!"
    exit 1
fi

if [ -f "staticfiles/assets/ui-BN57xHbl.js" ]; then
    echo "✓ UI JS file found"
else
    echo "ERROR: UI JS file not found!"
    exit 1
fi
echo

echo "[4/4] Production Deployment Checklist:"
echo "========================================"
echo "✓ Frontend built successfully"
echo "✓ Static files collected"
echo "✓ All assets verified"
echo
echo "NEXT STEPS FOR PRODUCTION:"
echo "1. Upload backend/staticfiles/ to your web server"
echo "2. Ensure nginx/web server serves static files with correct MIME types"
echo "3. Configure nginx to serve /static/ requests from staticfiles directory"
echo "4. Test the website to ensure all assets load correctly"
echo
echo "MIME Types to verify in nginx:"
echo "- .css files should return \"text/css\""
echo "- .js files should return \"text/javascript\""
echo "- .html files should return \"text/html\""
echo
echo "Example nginx configuration:"
echo "location /static/ {"
echo "    alias /path/to/staticfiles/;"
echo "    expires 1y;"
echo "    add_header Cache-Control \"public, immutable\";"
echo "}"
echo
echo "========================================"
echo " DEPLOYMENT READY!"
echo "========================================"
