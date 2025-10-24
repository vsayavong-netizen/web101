# 🔧 Fix 500 Internal Server Error on Render

## 🚨 Problem
- POST /api/auth/login/ returns 500 Internal Server Error
- Frontend cannot connect to backend API
- Database connection or settings issues

## ✅ Solution

### 1. Update Render Environment Variables
Go to Render Dashboard → Your Service → Environment and set:

```
DJANGO_SETTINGS_MODULE=final_project_management.settings_production
DATABASE_URL=postgresql://web100data_user:4881Q4Dc5XxYmSmEXuGzlOq29x7GMsbL@dpg-d3rs9qp5pdvs73fve9j0-a.singapore-postgres.render.com:5432/web100data?sslmode=require
PYTHONPATH=/opt/render/project/src/backend
```

### 2. Update Start Command
Go to Render Dashboard → Your Service → Settings → Start Command:

```bash
chmod +x startup.sh && ./startup.sh
```

### 3. Alternative Start Command (if startup.sh doesn't work)
```bash
cd backend && python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:$PORT --workers 3 final_project_management.wsgi:application
```

## 🧪 Testing After Fix

### 1. Health Check
Visit: `https://eduinfo.online/health/`
Expected: 200 OK response

### 2. API Documentation
Visit: `https://eduinfo.online/api/docs/`
Expected: Swagger UI loads

### 3. Login Test
- Go to: `https://eduinfo.online/`
- Try to login with: `admin` / `admin123`

## 🔍 Troubleshooting

### If still getting 500 errors:

1. **Check Render Logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for Python/Django error messages

2. **Test Database Connection:**
   - Use Render Shell to test:
   ```bash
   python manage.py dbshell
   ```

3. **Check Settings:**
   - Verify `DJANGO_SETTINGS_MODULE` is set correctly
   - Ensure `DATABASE_URL` is valid

4. **Manual Migration:**
   - Use Render Shell:
   ```bash
   python manage.py migrate --noinput
   python manage.py collectstatic --noinput
   ```

## 📋 Common Issues & Solutions

### Issue: Database Connection Failed
**Solution:** Update `DATABASE_URL` with correct password and host

### Issue: Settings Module Not Found
**Solution:** Set `DJANGO_SETTINGS_MODULE=final_project_management.settings_production`

### Issue: Static Files Not Found
**Solution:** Run `python manage.py collectstatic --noinput`

### Issue: Migrations Not Applied
**Solution:** Run `python manage.py migrate --noinput`

## 🎯 Expected Results

After applying the fix:
- ✅ Website loads at `https://eduinfo.online/`
- ✅ Login works with `admin` / `admin123`
- ✅ API endpoints respond correctly
- ✅ No more 500 errors

## 📞 Support

If issues persist:
1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure database is accessible from Render
4. Test with a simple Django view first

---

**Status:** ✅ Fix Applied  
**Date:** $(date)  
**Service:** eduinfo.online  
**Error:** 500 Internal Server Error  
**Solution:** Environment variables and startup script updated
