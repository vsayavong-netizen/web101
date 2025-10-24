"""
Test coverage analysis for the Final Project Management System
"""

import os
import sys
import django
from django.conf import settings
from django.test.utils import get_runner
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
    django.setup()
    
    # Run tests with coverage
    execute_from_command_line([
        'manage.py', 'test', '--verbosity=2', '--keepdb', '--parallel=4'
    ])
    
    # Generate coverage report
    try:
        import coverage
        cov = coverage.Coverage()
        cov.start()
        
        # Run tests
        TestRunner = get_runner(settings)
        test_runner = TestRunner()
        failures = test_runner.run_tests(["tests"])
        
        cov.stop()
        cov.save()
        
        # Generate HTML report
        cov.html_report(directory='htmlcov')
        
        # Generate console report
        cov.report()
        
        if failures:
            sys.exit(bool(failures))
            
    except ImportError:
        print("Coverage not installed. Install with: pip install coverage")
        sys.exit(1)
