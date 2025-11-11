"""
Script to create Academic Year immediately
Run: python create_academic_year_now.py
"""
import os
import sys
import django
from datetime import date

# Setup Django
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)
os.chdir(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from settings.models import AcademicYear

def create_academic_year():
    """Create Academic Year 2024 if it doesn't exist"""
    print("=" * 60)
    print("Creating Academic Year")
    print("=" * 60)
    
    # Check if 2024 exists
    year, created = AcademicYear.objects.get_or_create(
        year='2024',
        defaults={
            'start_date': date(2024, 8, 1),
            'end_date': date(2025, 7, 31),
            'is_active': True,
            'description': 'Academic Year 2024-2025'
        }
    )
    
    if created:
        print(f"\n[OK] Created Academic Year: {year.year}")
        print(f"     Start: {year.start_date}")
        print(f"     End: {year.end_date}")
        print(f"     Active: {year.is_active}")
    else:
        print(f"\n[OK] Academic Year {year.year} already exists")
        print(f"     Start: {year.start_date}")
        print(f"     End: {year.end_date}")
        print(f"     Active: {year.is_active}")
        
        # Ensure it's active
        if not year.is_active:
            year.is_active = True
            year.save()
            print(f"     [UPDATED] Set as active")
    
    # List all academic years
    print("\n" + "=" * 60)
    print("All Academic Years:")
    print("=" * 60)
    years = AcademicYear.objects.all().order_by('-year')
    for ay in years:
        status = '[ACTIVE]' if ay.is_active else '[INACTIVE]'
        print(f"  - {ay.year}: {ay.start_date} to {ay.end_date} {status}")
    
    print("\n" + "=" * 60)
    print("[OK] Done! Academic Year is ready.")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Restart Django server: python manage.py runserver")
    print("2. Refresh frontend: Ctrl+Shift+R")
    print("=" * 60)

if __name__ == '__main__':
    try:
        create_academic_year()
    except Exception as e:
        print(f"\n[ERROR] Failed to create Academic Year: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

