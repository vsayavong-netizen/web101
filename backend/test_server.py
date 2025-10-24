#!/usr/bin/env python
"""
Test script to verify Django can start without errors
"""
import os
import sys
import django
from django.core.management import call_command
from io import StringIO

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

print("[INFO] Django setup successful")

# Test importing middleware
try:
    from core.middleware import (
        SecurityMiddleware,
        RateLimitMiddleware,
        AuditLogMiddleware,
        SecurityHeadersMiddleware,
    )
    print("[OK] All middleware classes imported successfully")
except Exception as e:
    print(f"[ERROR] Middleware import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test system check
print("[INFO] Running Django system check...")
try:
    from django.core.management import execute_from_command_line
    out = StringIO()
    try:
        call_command('check', stdout=out, verbosity=2)
        print("[OK] System check passed")
    except SystemExit as e:
        if e.code == 0:
            print("[OK] System check passed")
        else:
            print(f"[ERROR] System check failed with code {e.code}")
            sys.exit(1)
except Exception as e:
    print(f"[ERROR] System check error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n[SUCCESS] All tests passed! Django is ready to run.")
