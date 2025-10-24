# การตั้งค่าฟอนต์

## ✅ ฟอนต์ที่ใช้

### ภาษาอังกฤษ
- **Times New Roman** (มีอยู่ใน Windows อยู่แล้ว)
- Fallback: Times, serif

### ภาษาลาว
- **Saysettha OT** (Primary)
- **Phetsarath OT** (Fallback)
- Fallback: system-ui, sans-serif

---

## 📥 วิธีติดตั้งฟอนต์ลาว

### Windows

#### ตัวเลือก 1: ดาวน์โหลดและติดตั้งจาก Google Fonts
1. เปิด: https://fonts.google.com/?subset=lao
2. ค้นหา "Phetsarath" หรือ "Saysettha OT"
3. Download font
4. แตกไฟล์ .zip
5. Double-click ไฟล์ .ttf หรือ .otf
6. คลิก "Install"

#### ตัวเลือก 2: ติดตั้งด้วยมือ
1. ดาวน์โหลดฟอนต์:
   - Saysettha OT: หาจาก Lao font repositories
   - Phetsarath OT: มักติดตั้งมากับ Windows แล้ว

2. วิธีติดตั้ง:
   - คัดลอกไฟล์ฟอนต์ (.ttf หรือ .otf)
   - วางที่: `C:\Windows\Fonts\`
   - หรือ Double-click และคลิก "Install"

3. Restart browser หลังติดตั้ง

### Mac/Linux

```bash
# Mac
# วางไฟล์ฟอนต์ใน ~/Library/Fonts/

# Linux
# วางไฟล์ฟอนต์ใน ~/.fonts/
mkdir -p ~/.fonts
cp *.ttf ~/.fonts/
fc-cache -f -v
```

---

## 🌐 การใช้ Web Fonts (Alternative)

หากต้องการให้ฟอนต์โหลดจาก CDN:

### เพิ่มใน `index.html`:

```html
<head>
  <!-- ... -->
  
  <!-- Lao Fonts from Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Lao:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
```

### อัปเดต `index.css`:

```css
:lang(lo) body,
:lang(lo) *,
:lang(lo) .MuiTypography-root,
:lang(lo) .MuiButton-root {
  font-family: 'Saysettha OT', 'Phetsarath OT', 'Noto Sans Lao', system-ui, sans-serif !important;
}
```

---

## 🔍 วิธีตรวจสอบว่าฟอนต์โหลดแล้ว

### 1. ใช้ DevTools
```javascript
// เปิด Console (F12)
document.fonts.check('16px "Saysettha OT"')
// ควรได้ true ถ้าฟอนต์โหลดแล้ว
```

### 2. ดูใน Elements
1. เปิด DevTools (F12)
2. เลือก element ที่มีภาษาลาว
3. ดูใน Computed → font-family
4. ควรเห็น "Saysettha OT" หรือ "Phetsarath OT"

---

## 📝 การตั้งค่าปัจจุบัน

### Files ที่แก้ไข:
1. ✅ `frontend/index.css` - ตั้งค่าฟอนต์พื้นฐาน
2. ✅ `frontend/context/ThemeContext.tsx` - ตั้งค่า MUI theme

### Font Stack:
```css
/* English (Default) */
font-family: 'Times New Roman', Times, serif;

/* Lao (when :lang(lo) detected) */
font-family: 'Saysettha OT', 'Phetsarath OT', system-ui, sans-serif;
```

---

## 🎯 การใช้งาน

### ระบบจะเลือกฟอนต์อัตโนมัติตาม:
- **ภาษาอังกฤษ** → Times New Roman
- **ภาษาลาว** (เมื่อมี `lang="lo"`) → Saysettha OT

### ตัวอย่าง:
```tsx
// ภาษาอังกฤษ
<Typography>English Text</Typography>
// ใช้ Times New Roman

// ภาษาลาว
<Typography lang="lo">ຂໍ້ຄວາມພາສາລາວ</Typography>
// ใช้ Saysettha OT
```

---

## ⚠️ หมายเหตุ

1. **Saysettha OT** อาจไม่มีในระบบ Windows ทุกเครื่อง → ติดตั้งเพิ่ม
2. **Phetsarath OT** มักมีใน Windows 10/11 อยู่แล้ว → ใช้เป็น fallback
3. หากไม่มีทั้งสอง → จะใช้ system-ui (Segoe UI ใน Windows)

---

## 🔗 แหล่งข้อมูลเพิ่มเติม

- Lao Unicode Fonts: http://www.laofont.org/
- Google Fonts (Lao): https://fonts.google.com/?subset=lao
- Noto Sans Lao: https://fonts.google.com/noto/specimen/Noto+Sans+Lao

---

**อัปเดต:** 22 ตุลาคม 2025  
**สถานะ:** ✅ ตั้งค่าเสร็จสมบูรณ์

