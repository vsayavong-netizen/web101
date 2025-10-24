#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import django

# Set UTF-8 encoding for Windows
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

try:
    from core.middleware import (
        SecurityMiddleware,
        RateLimitMiddleware,
        AuditLogMiddleware,
        SecurityHeadersMiddleware,
        BlockSuspiciousRequestsMiddleware,
        EnvironmentProtectionMiddleware,
        SecureFileAccessMiddleware,
    )
    print("[OK] All middleware imports successful!")
    print("  - SecurityMiddleware")
    print("  - RateLimitMiddleware")
    print("  - AuditLogMiddleware")
    print("  - SecurityHeadersMiddleware")
    print("  - BlockSuspiciousRequestsMiddleware")
    print("  - EnvironmentProtectionMiddleware")
    print("  - SecureFileAccessMiddleware")
except Exception as e:
    print(f"[ERROR] Import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
