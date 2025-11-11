"""
Django management command to create Academic Year
Usage: python manage.py create_academic_year [year] [--start-date] [--end-date] [--active]
"""
from django.core.management.base import BaseCommand, CommandError
from settings.models import AcademicYear
from datetime import date, datetime


class Command(BaseCommand):
    help = 'Create a new Academic Year'

    def add_arguments(self, parser):
        parser.add_argument(
            'year',
            type=str,
            nargs='?',
            help='Academic year (e.g., 2024 or 2024-2025)',
        )
        parser.add_argument(
            '--start-date',
            type=str,
            help='Start date (YYYY-MM-DD format, default: YYYY-08-01)',
        )
        parser.add_argument(
            '--end-date',
            type=str,
            help='End date (YYYY-MM-DD format, default: (YYYY+1)-07-31)',
        )
        parser.add_argument(
            '--active',
            action='store_true',
            help='Set as active year (deactivates others)',
        )
        parser.add_argument(
            '--description',
            type=str,
            help='Description for the academic year',
        )

    def handle(self, *args, **options):
        year_str = options.get('year')
        
        if not year_str:
            # Default to current year
            current_year = datetime.now().year
            year_str = str(current_year)
            self.stdout.write(
                self.style.WARNING(f'No year specified, using current year: {year_str}')
            )

        # Parse year
        if '-' in year_str:
            # Format: "2024-2025"
            start_year = int(year_str.split('-')[0])
            end_year = int(year_str.split('-')[1])
            if end_year != start_year + 1:
                raise CommandError('End year must be one year after start year')
        else:
            # Format: "2024"
            start_year = int(year_str)
            end_year = start_year + 1
            year_str = f"{start_year}-{end_year}"

        # Check if year already exists
        if AcademicYear.objects.filter(year=year_str).exists():
            existing = AcademicYear.objects.get(year=year_str)
            self.stdout.write(
                self.style.WARNING(f'Academic Year {year_str} already exists!')
            )
            self.stdout.write(f'  ID: {existing.id}')
            self.stdout.write(f'  Start: {existing.start_date}')
            self.stdout.write(f'  End: {existing.end_date}')
            self.stdout.write(f'  Active: {existing.is_active}')
            return

        # Parse dates
        start_date_str = options.get('start_date')
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        else:
            start_date = date(start_year, 8, 1)

        end_date_str = options.get('end_date')
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = date(end_year, 7, 31)

        # Validate dates
        if start_date >= end_date:
            raise CommandError('End date must be after start date')

        description = options.get('description') or f'Academic Year {year_str}'

        # If --active, deactivate all other years
        is_active = options.get('active', False)
        if is_active:
            AcademicYear.objects.update(is_active=False)
            self.stdout.write(self.style.WARNING('Deactivated all other academic years'))

        # Create academic year
        academic_year = AcademicYear.objects.create(
            year=year_str,
            start_date=start_date,
            end_date=end_date,
            is_active=is_active,
            description=description
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Successfully created Academic Year: {academic_year.year}'
            )
        )
        self.stdout.write(f'   Start Date: {academic_year.start_date}')
        self.stdout.write(f'   End Date: {academic_year.end_date}')
        self.stdout.write(f'   Active: {academic_year.is_active}')
        self.stdout.write(f'   Description: {academic_year.description}')

        # List all academic years
        self.stdout.write('\n📚 All Academic Years:')
        for ay in AcademicYear.objects.all().order_by('-year'):
            status = '✅ Active' if ay.is_active else '⏸️  Inactive'
            self.stdout.write(
                f'   {ay.year}: {ay.start_date} to {ay.end_date} [{status}]'
            )

