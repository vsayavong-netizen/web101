"""
Management command to run tests with custom configuration.
Usage: python manage.py run_tests
"""

from django.core.management.base import BaseCommand
from django.test.utils import get_runner
from django.conf import settings
import os
import sys


class Command(BaseCommand):
    help = 'Run tests with custom configuration and reporting'

    def add_arguments(self, parser):
        parser.add_argument(
            '--app',
            type=str,
            help='Run tests for specific app only',
        )
        parser.add_argument(
            '--coverage',
            action='store_true',
            help='Run tests with coverage reporting',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Run tests in verbose mode',
        )
        parser.add_argument(
            '--parallel',
            type=int,
            default=1,
            help='Run tests in parallel (default: 1)',
        )
        parser.add_argument(
            '--keepdb',
            action='store_true',
            help='Keep test database after tests',
        )
        parser.add_argument(
            '--debug',
            action='store_true',
            help='Run tests in debug mode',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('Starting test suite...')
        )

        # Configure test settings
        test_settings = self.configure_test_settings(options)
        
        # Run tests
        if options['coverage']:
            self.run_tests_with_coverage(test_settings, options)
        else:
            self.run_tests(test_settings, options)

        self.stdout.write(
            self.style.SUCCESS('Test suite completed!')
        )

    def configure_test_settings(self, options):
        """Configure test settings based on options."""
        # Use test settings
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'test_settings')
        
        # Import settings after setting the module
        from django.conf import settings
        
        # Configure test database
        if options['keepdb']:
            settings.DATABASES['default']['NAME'] = 'test_db.sqlite3'
        
        # Configure parallel testing
        if options['parallel'] > 1:
            settings.DATABASES['default']['TEST'] = {
                'SERIALIZE': False,
            }
        
        return settings

    def run_tests(self, test_settings, options):
        """Run tests without coverage."""
        TestRunner = get_runner(test_settings)
        test_runner = TestRunner(
            verbosity=2 if options['verbose'] else 1,
            interactive=False,
            keepdb=options['keepdb'],
            parallel=options['parallel'],
            debug_mode=options['debug']
        )
        
        # Determine which tests to run
        if options['app']:
            test_labels = [options['app']]
        else:
            test_labels = [
                'accounts',
                'students',
                'advisors',
                'projects',
                'committees',
                'majors',
                'classrooms',
                'milestones',
                'scoring',
                'notifications',
                'ai_services',
                'analytics',
                'settings',
                'reports',
            ]
        
        # Run tests
        failures = test_runner.run_tests(test_labels)
        
        if failures:
            self.stdout.write(
                self.style.ERROR(f'Tests failed: {failures} failures')
            )
            sys.exit(1)
        else:
            self.stdout.write(
                self.style.SUCCESS('All tests passed!')
            )

    def run_tests_with_coverage(self, test_settings, options):
        """Run tests with coverage reporting."""
        try:
            import coverage
        except ImportError:
            self.stdout.write(
                self.style.ERROR('Coverage package not installed. Install with: pip install coverage')
            )
            return
        
        # Start coverage
        cov = coverage.Coverage()
        cov.start()
        
        try:
            # Run tests
            self.run_tests(test_settings, options)
        finally:
            # Stop coverage
            cov.stop()
            cov.save()
            
            # Generate coverage report
            self.stdout.write('\n' + '='*50)
            self.stdout.write('COVERAGE REPORT')
            self.stdout.write('='*50)
            
            # Print coverage summary
            total_coverage = cov.report()
            
            # Generate HTML coverage report
            cov.html_report(directory='htmlcov')
            self.stdout.write(f'\nHTML coverage report generated in htmlcov/')
            
            # Generate XML coverage report
            cov.xml_report(outfile='coverage.xml')
            self.stdout.write(f'XML coverage report generated: coverage.xml')
            
            if total_coverage < 80:
                self.stdout.write(
                    self.style.WARNING(f'Coverage is {total_coverage:.1f}% - below 80% threshold')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Coverage is {total_coverage:.1f}% - above 80% threshold')
                )

    def run_specific_tests(self, test_labels, options):
        """Run specific tests."""
        TestRunner = get_runner(settings)
        test_runner = TestRunner(
            verbosity=2 if options['verbose'] else 1,
            interactive=False,
            keepdb=options['keepdb'],
            parallel=options['parallel'],
            debug_mode=options['debug']
        )
        
        failures = test_runner.run_tests(test_labels)
        return failures
