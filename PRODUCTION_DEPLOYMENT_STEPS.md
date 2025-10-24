# 🚀 Production Deployment Guide

## การแก้ไขปัญหา MIME Type และ Asset Loading

### ปัญหาที่แก้ไขแล้ว ✅
- ✅ MIME type error: ไฟล์ CSS ถูกส่งมาเป็น `text/html` แทนที่จะเป็น `text/css`
- ✅ 404 errors: ไฟล์ JavaScript และ CSS ไม่พบในเซิร์ฟเวอร์
- ✅ URL mismatch: ชื่อไฟล์ในโค้ดไม่ตรงกับไฟล์จริง

### ขั้นตอนการ Deploy ไปยัง Production

#### 1. เตรียม Frontend และ Backend

**Windows:**
```bash
# รันสคริปต์ deploy
deploy_production.bat
```

**Linux/Unix:**
```bash
# ให้สิทธิ์ execute
chmod +x deploy_production.sh

# รันสคริปต์ deploy
./deploy_production.sh
```

**หรือรันคำสั่งด้วยตนเอง:**
```bash
# 1. Build Frontend
cd frontend
npm run build

# 2. Collect Static Files
cd ../backend
python manage.py collectstatic --noinput
```

#### 2. ตรวจสอบไฟล์ที่สร้างขึ้น

หลังจากรันคำสั่งแล้ว ให้ตรวจสอบว่าไฟล์เหล่านี้มีอยู่:
```
backend/staticfiles/assets/
├── index-CmzFPlXl.css    ✅
├── index-DvwsR5qq.js     ✅
├── vendor-Dvwkxfce.js    ✅
└── ui-BN57xHbl.js        ✅
```

#### 3. ตั้งค่า Web Server (Nginx)

**ใช้ไฟล์ template ที่สร้างไว้:**
```bash
# Copy ไฟล์ nginx configuration
sudo cp nginx_production.conf /etc/nginx/sites-available/your-site

# แก้ไข path ให้ตรงกับเซิร์ฟเวอร์ของคุณ
sudo nano /etc/nginx/sites-available/your-site
```

**แก้ไข path ที่สำคัญ:**
```nginx
# เปลี่ยน path ให้ตรงกับเซิร์ฟเวอร์ของคุณ
location /static/ {
    alias /path/to/your/staticfiles/;  # ← เปลี่ยนเป็น path จริง
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**Enable site:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/your-site /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

#### 4. ตั้งค่า Django Production

**แก้ไข settings.py สำหรับ production:**
```python
# settings_production.py
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = '/path/to/your/staticfiles/'

# WhiteNoise configuration
MIDDLEWARE = [
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # ... other middleware
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

#### 5. ทดสอบการ Deploy

**ทดสอบไฟล์ Static:**
```bash
# ทดสอบ CSS
curl -I https://your-domain.com/static/assets/index-CmzFPlXl.css
# ควรได้: Content-Type: text/css

# ทดสอบ JavaScript
curl -I https://your-domain.com/static/assets/index-DvwsR5qq.js
# ควรได้: Content-Type: text/javascript
```

**ทดสอบหน้าเว็บ:**
```bash
# ทดสอบหน้าแรก
curl -I https://your-domain.com/
# ควรได้: Status 200 OK
```

### การแก้ไขปัญหาเพิ่มเติม

#### หากยังมี MIME Type Error:

**1. ตรวจสอบ nginx configuration:**
```nginx
# เพิ่มใน location /static/
location ~* \.css$ {
    add_header Content-Type "text/css";
}
location ~* \.js$ {
    add_header Content-Type "text/javascript";
}
```

**2. ตรวจสอบ mime.types:**
```bash
# ตรวจสอบไฟล์ mime.types
cat /etc/nginx/mime.types | grep -E "(css|js)"
```

**3. ตรวจสอบ Django settings:**
```python
# ตรวจสอบ STATICFILES_DIRS
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
    os.path.join(BASE_DIR, '..', 'frontend', 'dist'),
]
```

#### หากยังมี 404 Error:

**1. ตรวจสอบ path ใน nginx:**
```bash
# ตรวจสอบว่าไฟล์มีอยู่จริง
ls -la /path/to/your/staticfiles/assets/
```

**2. ตรวจสอบ permissions:**
```bash
# ตั้งค่า permissions ที่ถูกต้อง
sudo chown -R www-data:www-data /path/to/your/staticfiles/
sudo chmod -R 755 /path/to/your/staticfiles/
```

### การตรวจสอบหลัง Deploy

**1. เปิดเว็บไซต์ในเบราว์เซอร์:**
- ตรวจสอบว่า CSS โหลดได้ (หน้าเว็บมี styling)
- ตรวจสอบว่า JavaScript ทำงานได้
- เปิด Developer Tools ดู Network tab

**2. ตรวจสอบ Console:**
- ไม่ควรมี MIME type errors
- ไม่ควรมี 404 errors
- ไม่ควรมี CORS errors

**3. ตรวจสอบ Performance:**
- ไฟล์ CSS และ JS โหลดเร็ว
- ไม่มี broken links

### คำแนะนำเพิ่มเติม

**1. Caching:**
```nginx
# ตั้งค่า cache สำหรับ static files
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**2. Compression:**
```nginx
# เปิด gzip compression
gzip on;
gzip_types text/css application/javascript;
```

**3. Security:**
```nginx
# เพิ่ม security headers
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options DENY;
```

### การแก้ไขปัญหาเฉพาะ

**หากใช้ Apache แทน Nginx:**
```apache
# .htaccess ใน staticfiles directory
<IfModule mod_mime.c>
    AddType text/css .css
    AddType text/javascript .js
</IfModule>
```

**หากใช้ Cloudflare:**
- ตรวจสอบ Page Rules
- ตั้งค่า Browser Cache TTL
- เปิด Auto Minify

---

## สรุป

หลังจากทำตามขั้นตอนนี้ ปัญหา MIME type และ asset loading ควรจะหายไปแล้ว:

✅ **MIME Type Fixed**: ไฟล์ CSS และ JS ถูกส่งด้วย MIME type ที่ถูกต้อง  
✅ **404 Errors Fixed**: ไฟล์ทั้งหมดพบและโหลดได้  
✅ **Asset Loading Fixed**: เว็บไซต์ทำงานได้ปกติ  

หากยังมีปัญหา ให้ตรวจสอบ logs ของ nginx และ Django เพื่อหาสาเหตุที่แท้จริง
