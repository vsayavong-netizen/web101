"""
Script to ensure Academic Year exists in database
Run: python manage.py shell < backend/scripts/ensure_academic_year.py
Or: python backend/scripts/ensure_academic_year.py
"""
import os
import sys
import django
from datetime import date

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from settings.models import AcademicYear

def ensure_academic_year():
    """Ensure at least one Academic Year exists"""
    print("=" * 60)
    print("Ensuring Academic Year exists")
    print("=" * 60)
    
    # Check if any academic year exists
    if AcademicYear.objects.exists():
        print("\n[OK] Academic Years found:")
        for ay in AcademicYear.objects.all().order_by('-year'):
            status = '[ACTIVE]' if ay.is_active else '[INACTIVE]'
            print(f"  - {ay.year}: {ay.start_date} to {ay.end_date} {status}")
        
        # Check if any is active
        active_year = AcademicYear.objects.filter(is_active=True).first()
        if not active_year:
            # Activate the latest year
            latest = AcademicYear.objects.order_by('-year').first()
            if latest:
                latest.is_active = True
                latest.save()
                print(f"\n[OK] Activated latest year: {latest.year}")
        else:
            print(f"\n[OK] Active year: {active_year.year}")
    else:
        print("\n[WARNING] No Academic Years found. Creating default year...")
        
        # Create default academic year (2024)
        year = AcademicYear.objects.create(
            year='2024',
            start_date=date(2024, 8, 1),
            end_date=date(2025, 7, 31),
            is_active=True,
            description='Academic Year 2024-2025'
        )
        print(f"[OK] Created Academic Year: {year.year}")
        print(f"      Start: {year.start_date}")
        print(f"      End: {year.end_date}")
        print(f"      Active: {year.is_active}")
    
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)

if __name__ == '__main__':
    ensure_academic_year()

