# คู่มือการลบ Tailwind CSS และแปลงเป็น Material-UI

## สถานะการทำงาน ✅

### เสร็จแล้ว
- ✅ ลบ Tailwind dependencies (`tailwindcss`, `@tailwindcss/postcss`, `autoprefixer`, `postcss`)
- ✅ ลบไฟล์ `tailwind.config.js`
- ✅ ลบไฟล์ `postcss.config.js`  
- ✅ แก้ไข `index.css` - ลบ Tailwind directives
- ✅ แปลง `LoginPage.tsx` เป็น Material-UI
- ✅ แปลง `App.tsx` เป็น Material-UI

### ไฟล์ที่ยังต้องแปลง

มี **20 ไฟล์** ที่ยังคงใช้ Tailwind classes อยู่:

1. `WelcomePage.tsx` - หน้าต้อนรับ
2. `HomePage.tsx` - หน้าหลัก
3. `StudentManagement.tsx`
4. `AdvisorManagement.tsx`
5. `AnalyticsDashboard.tsx`
6. `ClassroomManagement.tsx`
7. `CommitteeManagement.tsx`
8. `FinalProjectManagement.tsx`
9. `MajorManagement.tsx`
10. `ReportingPage.tsx`
11. `ScoringManagement.tsx`
12. `TourGuide.tsx`
13. `TopicSuggesterModal.tsx`
14. `SubmissionsManagement.tsx`
15. `Toast.tsx`
16. `ToastContainer.tsx`
17. `StudentWelcome.tsx`
18. `StudentRegistrationModal.tsx`
19. และอื่นๆ

## วิธีการแปลง Tailwind → Material-UI

### 1. Import Material-UI Components

```tsx
// แทนที่การใช้ className
import { Box, Button, Typography, TextField, Paper, Container } from '@mui/material';
```

### 2. ตารางแปลง Tailwind Classes → Material-UI

| Tailwind | Material-UI (sx prop) |
|----------|----------------------|
| `className="flex"` | `sx={{ display: 'flex' }}` |
| `className="flex-col"` | `sx={{ flexDirection: 'column' }}` |
| `className="items-center"` | `sx={{ alignItems: 'center' }}` |
| `className="justify-center"` | `sx={{ justifyContent: 'center' }}` |
| `className="p-4"` | `sx={{ p: 2 }}` (1 = 8px) |
| `className="m-4"` | `sx={{ m: 2 }}` |
| `className="bg-blue-600"` | `sx={{ bgcolor: 'primary.main' }}` |
| `className="text-white"` | `sx={{ color: 'white' }}` |
| `className="rounded-lg"` | `sx={{ borderRadius: 2 }}` |
| `className="shadow-lg"` | `<Paper elevation={8}>` หรือ `sx={{ boxShadow: 3 }}` |
| `className="w-full"` | `sx={{ width: '100%' }}` หรือ `fullWidth` prop |
| `className="min-h-screen"` | `sx={{ minHeight: '100vh' }}` |
| `className="text-xl"` | `<Typography variant="h6">` |
| `className="font-bold"` | `<Typography fontWeight="bold">` |
| `className="dark:bg-slate-900"` | `sx={{ bgcolor: 'background.default' }}` (MUI จัดการ dark mode อัตโนมัติ) |

### 3. ตัวอย่างการแปลง

#### ก่อน (Tailwind):
```tsx
<div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
  <div className="w-full max-w-sm p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl">
    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Title</h1>
    <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
      Click me
    </button>
  </div>
</div>
```

#### หลัง (Material-UI):
```tsx
<Box sx={{ 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  minHeight: '100vh',
  bgcolor: 'background.default',
  p: 2
}}>
  <Container maxWidth="xs">
    <Paper elevation={24} sx={{ p: 4, borderRadius: 4 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Title
      </Typography>
      <Button variant="contained" fullWidth size="large">
        Click me
      </Button>
    </Paper>
  </Container>
</Box>
```

### 4. Material-UI Components ที่ใช้บ่อย

- `<Box>` - แทน `<div>` ทั่วไป
- `<Container>` - แทน `<div className="max-w-7xl mx-auto">`
- `<Paper>` - แทน card/panel
- `<Typography>` - แทน `<h1>`, `<p>`, text elements
- `<Button>` - ปุ่มพร้อม variants (contained, outlined, text)
- `<TextField>` - input fields
- `<Grid>` - layout system
- `<Stack>` - จัดเรียง elements แนวตั้งหรือแนวนอน

### 5. Dark Mode

Material-UI จัดการ dark mode ผ่าน theme โดยอัตโนมัติ:
- ใช้ `bgcolor: 'background.default'` แทน `bg-white dark:bg-slate-900`
- ใช้ `color: 'text.primary'` แทน `text-slate-800 dark:text-white`

## ขั้นตอนการทำต่อ

### ตัวเลือก 1: แปลงทีละไฟล์ (แนะนำ)
1. เลือกไฟล์ที่ต้องการแปลง
2. Import Material-UI components
3. แปลง JSX ทีละส่วน
4. ทดสอบ

### ตัวเลือก 2: ใช้ regex/script (สำหรับไฟล์จำนวนมาก)
```bash
# หา Tailwind classes ทั้งหมด
grep -r "className=" frontend/components/
```

## การติดตั้ง Dependencies

หลังจากลบ Tailwind แล้ว ให้รัน:
```bash
cd frontend
npm install
```

## หมายเหตุ
- Material-UI มี built-in theme system ที่รองรับ dark mode
- ไม่ต้องกังวลเรื่อง responsive - MUI จัดการให้
- ใช้ `sx` prop สำหรับ styling inline
- สามารถใช้ `styled()` สำหรับ component ที่ซับซ้อน

## ตรวจสอบไฟล์ที่ใช้ Tailwind

```bash
grep -r "className=\".*\(flex\|grid\|p-\|m-\|bg-\|text-\|border-\|rounded-\).*\"" frontend/components/
```

---

**อัปเดตล่าสุด:** 22 ตุลาคม 2025

