# 🔧 WebSocket Frontend Fix

**วันที่แก้ไข**: 10 พฤศจิกายน 2025

---

## 🐛 ปัญหาที่พบ

### Error
```
Uncaught ReferenceError: getWebSocketClient is not defined
at useNotifications.ts:240:22
```

### สาเหตุ
- `useNotifications.ts` ไม่ได้ import `getWebSocketClient`
- `useNotifications.ts` ไม่ได้ import `WS_CONFIG`
- `useNotifications.ts` ไม่ได้ประกาศ `wsClientRef` และ `unsubscribeRef`

---

## ✅ การแก้ไข

### 1. เพิ่ม Imports

**File**: `frontend/hooks/useNotifications.ts`

```typescript
import { getWebSocketClient } from '../utils/websocketClient';
import { WS_CONFIG } from '../config/api';
import { useState, useEffect, useCallback, useRef } from 'react';
```

### 2. เพิ่ม Refs

```typescript
const wsClientRef = useRef<any>(null);
const unsubscribeRef = useRef<Array<() => void>>([]);
```

---

## 📝 Changes Made

### File: `frontend/hooks/useNotifications.ts`

#### Added Imports
- ✅ `getWebSocketClient` from `../utils/websocketClient`
- ✅ `WS_CONFIG` from `../config/api`
- ✅ `useRef` from `react`

#### Added Refs
- ✅ `wsClientRef` - สำหรับเก็บ WebSocket client instance
- ✅ `unsubscribeRef` - สำหรับเก็บ unsubscribe functions

---

## 🧪 Verification

### Check Imports
```typescript
// Should be at top of file
import { getWebSocketClient } from '../utils/websocketClient';
import { WS_CONFIG } from '../config/api';
```

### Check Refs
```typescript
// Should be in component
const wsClientRef = useRef<any>(null);
const unsubscribeRef = useRef<Array<() => void>>([]);
```

---

## 🚀 Next Steps

1. **Rebuild Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Restart Dev Server**
   ```bash
   npm run dev
   ```

3. **Verify Fix**
   - Check browser console for errors
   - Verify WebSocket connection works
   - Test notification delivery

---

## 📝 Notes

- Import path: `../utils/websocketClient` (relative from `hooks/`)
- `getWebSocketClient` is exported from `websocketClient.ts`
- `WS_CONFIG` is exported from `config/api.ts`
- Refs are needed for cleanup on unmount

---

**Last Updated**: November 10, 2025

