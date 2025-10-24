@echo off
echo 🔧 Deploying API fixes to production...

cd web100\backend

echo 📦 Installing dependencies...
pip install -r requirements.txt

echo 🗄️ Running migrations...
python manage.py migrate

echo 📁 Collecting static files...
python manage.py collectstatic --noinput

echo 🧪 Testing API endpoints...
python fix_production_500.py
python fix_api_endpoints.py

echo ✅ API fixes deployed successfully!
echo 🌐 Your API should now be working at https://eduinfo.online/api/

pause
