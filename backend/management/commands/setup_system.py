"""
Django management command to set up the system properly.
This command handles migrations and fixture loading in the correct order.
"""

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.db import transaction
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Set up the system with proper migration and fixture loading order'

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-migrations',
            action='store_true',
            help='Skip running migrations',
        )
        parser.add_argument(
            '--skip-fixtures',
            action='store_true',
            help='Skip loading fixtures',
        )
        parser.add_argument(
            '--skip-superuser',
            action='store_true',
            help='Skip creating superuser',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Starting system setup...')
        )

        # Step 1: Run migrations
        if not options['skip_migrations']:
            self.stdout.write('🗄️ Running database migrations...')
            try:
                call_command('migrate', verbosity=0)
                self.stdout.write(
                    self.style.SUCCESS('✅ Migrations completed successfully')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Migration failed: {e}')
                )
                return

        # Step 2: Create superuser
        if not options['skip_superuser']:
            self.stdout.write('👤 Setting up superuser...')
            try:
                if not User.objects.filter(username='admin').exists():
                    User.objects.create_superuser(
                        username='admin',
                        email='admin@bm23.com',
                        password='admin123'
                    )
                    self.stdout.write(
                        self.style.SUCCESS('✅ Superuser created: admin/admin123')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING('⚠️ Superuser already exists')
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Superuser creation failed: {e}')
                )

        # Step 3: Load fixtures
        if not options['skip_fixtures']:
            self.stdout.write('📊 Loading initial data...')
            try:
                fixture_path = 'fixtures/initial_data.json'
                if os.path.exists(fixture_path):
                    call_command('loaddata', fixture_path, verbosity=0)
                    self.stdout.write(
                        self.style.SUCCESS('✅ Initial data loaded successfully')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING('⚠️ No fixture file found')
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Fixture loading failed: {e}')
                )

        # Step 4: Collect static files
        self.stdout.write('📦 Collecting static files...')
        try:
            call_command('collectstatic', '--noinput', verbosity=0)
            self.stdout.write(
                self.style.SUCCESS('✅ Static files collected successfully')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Static files collection failed: {e}')
            )

        self.stdout.write(
            self.style.SUCCESS('🎉 System setup completed successfully!')
        )
