"""
Script to create initial Academic Year
Run: python manage.py shell < create_academic_year.py
Or: python manage.py shell แล้วพิมพ์คำสั่งด้านล่าง
"""
from settings.models import AcademicYear
from datetime import date

# Check if 2024 academic year already exists
if not AcademicYear.objects.filter(year='2024').exists():
    year = AcademicYear.objects.create(
        year='2024',
        start_date=date(2024, 8, 1),
        end_date=date(2025, 7, 31),
        is_active=True,
        description='Academic Year 2024-2025'
    )
    print(f'✅ Created Academic Year: {year.year} ({year.start_date} to {year.end_date})')
else:
    existing = AcademicYear.objects.get(year='2024')
    print(f'ℹ️  Academic Year 2024 already exists (Active: {existing.is_active})')

# List all academic years
print('\n📚 All Academic Years:')
for ay in AcademicYear.objects.all().order_by('-year'):
    status = '✅ Active' if ay.is_active else '⏸️  Inactive'
    print(f'  - {ay.year}: {ay.start_date} to {ay.end_date} [{status}]')

