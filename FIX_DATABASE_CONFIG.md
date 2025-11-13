# 🔧 Fix Database Configuration

**วันที่สร้าง**: 2025-01-27  
**ปัญหา**: Database Configuration: FAIL  
**สถานะ**: ⚠️ Action Required

---

## 📋 Problem

Pre-deployment check แสดงว่า Database Configuration FAIL เพราะ:
- `DB_USER` ยังเป็น template value (`your_db_user`)
- `DB_PASSWORD` ยังเป็น template value (`your_strong_password_here`)

---

## 🚀 Solution Options

### Option 1: Interactive Script (Recommended) ⭐

รัน script เพื่อแก้ไขอัตโนมัติ:

```bash
bash update_database_config.sh
```

**Script นี้จะ**:
- แสดงค่าปัจจุบัน
- ขอให้คุณใส่ DB_USER และ DB_PASSWORD
- อัพเดทไฟล์ .env อัตโนมัติ
- สร้าง backup ของไฟล์เดิม

---

### Option 2: Manual Edit

แก้ไขไฟล์ `.env` ด้วยตนเอง:

```bash
nano backend/.env
```

**แก้ไขบรรทัดเหล่านี้**:
```env
DB_USER=your_actual_db_user
DB_PASSWORD=your_actual_strong_password
```

**ตัวอย่าง**:
```env
DB_USER=bm23_user
DB_PASSWORD=MySecurePassword123!
```

---

### Option 3: Use Interactive Environment Setup

รัน interactive setup script ที่จะช่วยตั้งค่าทั้งหมด:

```bash
python3 setup_env_interactive.py
```

---

## 📝 Step-by-Step Guide

### Step 1: Update Database Configuration

**Option A: Automated (Recommended)**
```bash
bash update_database_config.sh
```

**Option B: Manual**
```bash
nano backend/.env
# แก้ไข DB_USER และ DB_PASSWORD
```

---

### Step 2: Verify Configuration

```bash
python3 pre_deployment_check.py
```

**ควรเห็น**: `Database Configuration: PASS` ✅

---

### Step 3: Create Database (Optional)

หลังจากแก้ไข configuration แล้ว คุณสามารถสร้าง database ได้:

```bash
bash setup_database.sh
```

**หรือสร้างด้วยตนเอง**:
```bash
sudo -u postgres psql

# ใน PostgreSQL:
CREATE DATABASE final_project_management;
CREATE USER your_db_user WITH PASSWORD 'your_strong_password';
ALTER ROLE your_db_user SET client_encoding TO 'utf8';
ALTER ROLE your_db_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE your_db_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE final_project_management TO your_db_user;
\c final_project_management
GRANT ALL ON SCHEMA public TO your_db_user;
\q
```

**หมายเหตุ**: ใช้ `your_db_user` และ `your_strong_password` ที่ตั้งค่าใน `.env`

---

## ✅ Verification

### Check Current Values

```bash
cd backend
grep -E "^DB_(USER|PASSWORD)=" .env
```

**ควรเห็น**:
```
DB_USER=your_actual_db_user
DB_PASSWORD=your_actual_password
```

**ไม่ควรเห็น**:
```
DB_USER=your_db_user          ❌
DB_PASSWORD=your_strong_password_here  ❌
```

---

### Run Pre-Deployment Check

```bash
python3 pre_deployment_check.py
```

**Expected Output**:
```
✓ Database Configuration: PASS
```

**Not**:
```
✗ Database Configuration: FAIL
```

---

## 🔒 Security Notes

1. **อย่า commit `.env` file** - ไฟล์นี้มี sensitive information
2. **ใช้ strong passwords** - สำหรับ database
3. **ตรวจสอบ permissions** - `.env` ควรมี permissions 600
   ```bash
   chmod 600 backend/.env
   ```

---

## 🆘 Troubleshooting

### ปัญหา: Script ไม่ทำงาน

```bash
# ตรวจสอบ permissions
chmod +x update_database_config.sh

# รันอีกครั้ง
bash update_database_config.sh
```

### ปัญหา: ไม่สามารถแก้ไขไฟล์ได้

```bash
# ตรวจสอบ permissions
ls -la backend/.env

# เปลี่ยน permissions ถ้าจำเป็น
chmod 644 backend/.env
```

### ปัญหา: Database connection error หลังแก้ไข

```bash
# ตรวจสอบว่า PostgreSQL ทำงานอยู่
sudo systemctl status postgresql

# ทดสอบ connection
PGPASSWORD='your_password' psql -h localhost -U your_db_user -d final_project_management
```

---

## 📊 Current Status

| Item | Status | Action |
|------|--------|--------|
| DB_USER | ❌ Template value | Update required |
| DB_PASSWORD | ❌ Template value | Update required |
| .env file | ✅ Exists | Ready to edit |
| Update script | ✅ Ready | Can run now |

---

## 🎯 Quick Fix

**Fastest way to fix**:

```bash
# 1. Update database config
bash update_database_config.sh

# 2. Verify
python3 pre_deployment_check.py

# 3. Create database (optional)
bash setup_database.sh
```

---

## 📚 Related Documents

- **`ENV_SETUP_GUIDE.md`** - คู่มือตั้งค่า environment แบบละเอียด
- **`DEPLOYMENT_QUICK_START.md`** - Quick start guide
- **`setup_env_interactive.py`** - Interactive setup script

---

**Last Updated**: 2025-01-27  
**Status**: ⚠️ Action Required  
**Next Step**: Run `bash update_database_config.sh`

---

*Guide for fixing database configuration issue*
