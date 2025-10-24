"""
Management command to check system health and performance.
Usage: python manage.py system_health
"""

import time
from django.core.management.base import BaseCommand
from django.db import connection
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from accounts.models import Profile
from students.models import Student
from advisors.models import Advisor
from projects.models import ProjectGroup, Project
from committees.models import Committee
from milestones.models import Milestone
from scoring.models import ProjectScore
from notifications.models import Notification
from ai_services.models import AIAnalysis
from settings.models import SystemSetting, SystemLog

User = get_user_model()


class Command(BaseCommand):
    help = 'Check system health and performance metrics'

    def add_arguments(self, parser):
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Show detailed health information',
        )
        parser.add_argument(
            '--save-log',
            action='store_true',
            help='Save health check results to system logs',
        )

    def handle(self, *args, **options):
        self.detailed = options['detailed']
        self.save_log = options['save_log']
        
        self.stdout.write(
            self.style.SUCCESS('Starting system health check...')
        )
        
        # Perform health checks
        health_results = {
            'timestamp': timezone.now(),
            'database': self.check_database_health(),
            'models': self.check_model_health(),
            'performance': self.check_performance_metrics(),
            'data_integrity': self.check_data_integrity(),
            'system_settings': self.check_system_settings(),
        }
        
        # Display results
        self.display_health_results(health_results)
        
        # Save to logs if requested
        if self.save_log:
            self.save_health_log(health_results)
        
        self.stdout.write(
            self.style.SUCCESS('System health check completed!')
        )

    def check_database_health(self):
        """Check database connectivity and performance."""
        start_time = time.time()
        
        try:
            # Test database connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()
            
            # Test query performance
            cursor.execute("SELECT COUNT(*) FROM auth_user")
            user_count = cursor.fetchone()[0]
            
            end_time = time.time()
            query_time = end_time - start_time
            
            return {
                'status': 'healthy',
                'connection': 'ok',
                'query_time': round(query_time, 4),
                'user_count': user_count,
                'error': None
            }
            
        except Exception as e:
            return {
                'status': 'unhealthy',
                'connection': 'failed',
                'query_time': None,
                'user_count': None,
                'error': str(e)
            }

    def check_model_health(self):
        """Check model data health."""
        model_checks = {}
        
        # Check each model
        models_to_check = [
            ('Users', User),
            ('Profiles', Profile),
            ('Students', Student),
            ('Advisors', Advisor),
            ('Project Groups', ProjectGroup),
            ('Projects', Project),
            ('Committees', Committee),
            ('Milestones', Milestone),
            ('Project Scores', ProjectScore),
            ('Notifications', Notification),
            ('AI Analyses', AIAnalysis),
        ]
        
        for name, model in models_to_check:
            try:
                count = model.objects.count()
                model_checks[name] = {
                    'count': count,
                    'status': 'healthy' if count >= 0 else 'warning'
                }
            except Exception as e:
                model_checks[name] = {
                    'count': 0,
                    'status': 'error',
                    'error': str(e)
                }
        
        return model_checks

    def check_performance_metrics(self):
        """Check system performance metrics."""
        start_time = time.time()
        
        # Test cache
        cache_key = 'health_check_test'
        cache.set(cache_key, 'test_value', 60)
        cache_result = cache.get(cache_key)
        cache.delete(cache_key)
        
        # Test database query performance
        db_start = time.time()
        User.objects.count()
        db_end = time.time()
        
        # Test complex query
        complex_start = time.time()
        ProjectGroup.objects.select_related('advisor').prefetch_related('students').count()
        complex_end = time.time()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        return {
            'total_time': round(total_time, 4),
            'cache_status': 'ok' if cache_result == 'test_value' else 'failed',
            'simple_query_time': round(db_end - db_start, 4),
            'complex_query_time': round(complex_end - complex_start, 4),
        }

    def check_data_integrity(self):
        """Check data integrity issues."""
        integrity_issues = []
        
        # Check for orphaned records
        try:
            # Check for profiles without users
            orphaned_profiles = Profile.objects.filter(user__isnull=True).count()
            if orphaned_profiles > 0:
                integrity_issues.append(f'{orphaned_profiles} orphaned profiles')
            
            # Check for students without profiles
            students_without_profiles = Student.objects.filter(
                user__profile__isnull=True
            ).count()
            if students_without_profiles > 0:
                integrity_issues.append(f'{students_without_profiles} students without profiles')
            
            # Check for projects without groups
            projects_without_groups = Project.objects.filter(
                project_group__isnull=True
            ).count()
            if projects_without_groups > 0:
                integrity_issues.append(f'{projects_without_groups} projects without groups')
            
        except Exception as e:
            integrity_issues.append(f'Error checking data integrity: {e}')
        
        return {
            'issues': integrity_issues,
            'status': 'healthy' if not integrity_issues else 'warning'
        }

    def check_system_settings(self):
        """Check system settings."""
        try:
            settings_count = SystemSetting.objects.count()
            required_settings = [
                'site_name', 'max_students_per_group', 'min_students_per_group'
            ]
            
            missing_settings = []
            for setting_key in required_settings:
                if not SystemSetting.objects.filter(key=setting_key).exists():
                    missing_settings.append(setting_key)
            
            return {
                'total_settings': settings_count,
                'missing_required': missing_settings,
                'status': 'healthy' if not missing_settings else 'warning'
            }
            
        except Exception as e:
            return {
                'total_settings': 0,
                'missing_required': [],
                'status': 'error',
                'error': str(e)
            }

    def display_health_results(self, results):
        """Display health check results."""
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('SYSTEM HEALTH REPORT'))
        self.stdout.write('='*50)
        
        # Database Health
        db_health = results['database']
        self.stdout.write(f'\n📊 DATABASE HEALTH: {db_health["status"].upper()}')
        if db_health['status'] == 'healthy':
            self.stdout.write(f'  ✅ Connection: {db_health["connection"]}')
            self.stdout.write(f'  ⏱️  Query Time: {db_health["query_time"]}s')
            self.stdout.write(f'  👥 Users: {db_health["user_count"]}')
        else:
            self.stdout.write(f'  ❌ Error: {db_health["error"]}')
        
        # Model Health
        self.stdout.write(f'\n📋 MODEL HEALTH:')
        for model_name, model_health in results['models'].items():
            status_icon = '✅' if model_health['status'] == 'healthy' else '⚠️' if model_health['status'] == 'warning' else '❌'
            self.stdout.write(f'  {status_icon} {model_name}: {model_health["count"]} records')
            if 'error' in model_health:
                self.stdout.write(f'    Error: {model_health["error"]}')
        
        # Performance Metrics
        perf = results['performance']
        self.stdout.write(f'\n⚡ PERFORMANCE METRICS:')
        self.stdout.write(f'  ⏱️  Total Time: {perf["total_time"]}s')
        self.stdout.write(f'  💾 Cache: {perf["cache_status"]}')
        self.stdout.write(f'  🔍 Simple Query: {perf["simple_query_time"]}s')
        self.stdout.write(f'  🔍 Complex Query: {perf["complex_query_time"]}s')
        
        # Data Integrity
        integrity = results['data_integrity']
        self.stdout.write(f'\n🔒 DATA INTEGRITY: {integrity["status"].upper()}')
        if integrity['issues']:
            for issue in integrity['issues']:
                self.stdout.write(f'  ⚠️  {issue}')
        else:
            self.stdout.write('  ✅ No integrity issues found')
        
        # System Settings
        settings = results['system_settings']
        self.stdout.write(f'\n⚙️  SYSTEM SETTINGS: {settings["status"].upper()}')
        self.stdout.write(f'  📊 Total Settings: {settings["total_settings"]}')
        if settings['missing_required']:
            self.stdout.write(f'  ⚠️  Missing: {", ".join(settings["missing_required"])}')
        else:
            self.stdout.write('  ✅ All required settings present')
        
        # Overall Status
        overall_status = self.determine_overall_status(results)
        status_icon = '✅' if overall_status == 'healthy' else '⚠️' if overall_status == 'warning' else '❌'
        self.stdout.write(f'\n{status_icon} OVERALL STATUS: {overall_status.upper()}')

    def determine_overall_status(self, results):
        """Determine overall system status."""
        statuses = []
        
        # Check database
        if results['database']['status'] == 'unhealthy':
            return 'unhealthy'
        statuses.append(results['database']['status'])
        
        # Check models
        for model_health in results['models'].values():
            statuses.append(model_health['status'])
        
        # Check data integrity
        statuses.append(results['data_integrity']['status'])
        
        # Check system settings
        statuses.append(results['system_settings']['status'])
        
        if 'unhealthy' in statuses or 'error' in statuses:
            return 'unhealthy'
        elif 'warning' in statuses:
            return 'warning'
        else:
            return 'healthy'

    def save_health_log(self, results):
        """Save health check results to system logs."""
        try:
            overall_status = self.determine_overall_status(results)
            
            SystemLog.objects.create(
                log_type='info',
                message=f'System health check completed - Status: {overall_status}',
                source='system_health_command',
                user=None
            )
            
            self.stdout.write('  💾 Health check results saved to system logs')
            
        except Exception as e:
            self.stdout.write(f'  ❌ Error saving health log: {e}')
