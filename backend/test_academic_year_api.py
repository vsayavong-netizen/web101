"""
Test script for Academic Year API
Run: python manage.py shell < test_academic_year_api.py
Or use: python manage.py test settings
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from settings.models import AcademicYear
from datetime import date

print("=" * 60)
print("Testing Academic Year API")
print("=" * 60)

# 1. Check if Academic Year exists
print("\n1. Checking existing Academic Years:")
years = AcademicYear.objects.all()
if years.exists():
    for year in years:
        status = "✅ Active" if year.is_active else "⏸️  Inactive"
        print(f"   - {year.year}: {year.start_date} to {year.end_date} [{status}]")
else:
    print("   ⚠️  No Academic Years found. Create one using:")
    print("      python manage.py create_academic_year 2024 --active")

# 2. Test creating Academic Year (if needed)
if not AcademicYear.objects.filter(year='2024').exists():
    print("\n2. Creating test Academic Year 2024...")
    year = AcademicYear.objects.create(
        year='2024',
        start_date=date(2024, 8, 1),
        end_date=date(2025, 7, 31),
        is_active=True,
        description='Test Academic Year 2024-2025'
    )
    print(f"   ✅ Created: {year.year}")
else:
    print("\n2. Academic Year 2024 already exists")

# 3. Test API endpoints (manual check)
print("\n3. API Endpoints to test:")
print("   GET  /api/settings/academic-years/")
print("   GET  /api/settings/academic-years/current/")
print("   GET  /api/settings/academic-years/available/")
print("   POST /api/settings/academic-years/create_next_year/")
print("\n   Test these endpoints using:")
print("   - Swagger UI: http://localhost:8000/api/docs/")
print("   - Or use curl/Postman with authentication token")

print("\n" + "=" * 60)
print("Test completed!")
print("=" * 60)

