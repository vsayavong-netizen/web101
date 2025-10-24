"""
Management command for database maintenance tasks.
Usage: python manage.py db_maintenance
"""

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from accounts.models import Profile
from students.models import Student
from advisors.models import Advisor
from projects.models import ProjectGroup, Project
from milestones.models import Milestone
from scoring.models import ProjectScore
from notifications.models import Notification
from ai_services.models import AIAnalysis
from settings.models import SystemLog, SystemSetting

User = get_user_model()


class Command(BaseCommand):
    help = 'Perform database maintenance tasks'

    def add_arguments(self, parser):
        parser.add_argument(
            '--task',
            type=str,
            choices=['all', 'cleanup', 'optimize', 'vacuum', 'analyze', 'backup'],
            default='all',
            help='Maintenance task to perform (default: all)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually doing it',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days for cleanup operations (default: 30)',
        )

    def handle(self, *args, **options):
        self.task = options['task']
        self.dry_run = options['dry_run']
        self.days = options['days']
        
        self.stdout.write(
            self.style.SUCCESS('Starting database maintenance...')
        )
        
        if self.dry_run:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE - No changes will be made')
            )
        
        # Perform maintenance tasks
        if self.task in ['all', 'cleanup']:
            self.cleanup_old_data()
        
        if self.task in ['all', 'optimize']:
            self.optimize_database()
        
        if self.task in ['all', 'vacuum']:
            self.vacuum_database()
        
        if self.task in ['all', 'analyze']:
            self.analyze_database()
        
        if self.task in ['all', 'backup']:
            self.backup_database()
        
        self.stdout.write(
            self.style.SUCCESS('Database maintenance completed!')
        )

    def cleanup_old_data(self):
        """Clean up old and unnecessary data."""
        self.stdout.write('🧹 Cleaning up old data...')
        
        cutoff_date = timezone.now() - timedelta(days=self.days)
        
        # Clean up old system logs
        old_logs = SystemLog.objects.filter(timestamp__lt=cutoff_date)
        if self.dry_run:
            self.stdout.write(f'  Would delete {old_logs.count()} old system logs')
        else:
            count = old_logs.count()
            old_logs.delete()
            self.stdout.write(f'  Deleted {count} old system logs')
        
        # Clean up old notifications
        old_notifications = Notification.objects.filter(
            created_at__lt=cutoff_date,
            is_read=True
        )
        if self.dry_run:
            self.stdout.write(f'  Would delete {old_notifications.count()} old notifications')
        else:
            count = old_notifications.count()
            old_notifications.delete()
            self.stdout.write(f'  Deleted {count} old notifications')
        
        # Clean up old AI analysis logs
        old_ai_logs = AIAnalysis.objects.filter(
            created_at__lt=cutoff_date,
            status='completed'
        )
        if self.dry_run:
            self.stdout.write(f'  Would delete {old_ai_logs.count()} old AI analysis logs')
        else:
            count = old_ai_logs.count()
            old_ai_logs.delete()
            self.stdout.write(f'  Deleted {count} old AI analysis logs')
        
        # Clean up completed projects older than specified days
        old_completed_projects = ProjectGroup.objects.filter(
            status='completed',
            updated_at__lt=cutoff_date
        )
        if self.dry_run:
            self.stdout.write(f'  Would archive {old_completed_projects.count()} old completed projects')
        else:
            count = old_completed_projects.count()
            # Archive instead of delete
            old_completed_projects.update(status='archived')
            self.stdout.write(f'  Archived {count} old completed projects')

    def optimize_database(self):
        """Optimize database performance."""
        self.stdout.write('⚡ Optimizing database...')
        
        if self.dry_run:
            self.stdout.write('  Would run database optimization commands')
            return
        
        try:
            with connection.cursor() as cursor:
                # Update table statistics
                cursor.execute("ANALYZE;")
                self.stdout.write('  Updated table statistics')
                
                # Reindex tables
                cursor.execute("REINDEX DATABASE;")
                self.stdout.write('  Reindexed database')
                
        except Exception as e:
            self.stdout.write(f'  Error optimizing database: {e}')

    def vacuum_database(self):
        """Vacuum database to reclaim space."""
        self.stdout.write('🧽 Vacuuming database...')
        
        if self.dry_run:
            self.stdout.write('  Would run VACUUM command')
            return
        
        try:
            with connection.cursor() as cursor:
                # Run VACUUM to reclaim space
                cursor.execute("VACUUM;")
                self.stdout.write('  Vacuumed database')
                
                # Run VACUUM ANALYZE for better performance
                cursor.execute("VACUUM ANALYZE;")
                self.stdout.write('  Vacuumed and analyzed database')
                
        except Exception as e:
            self.stdout.write(f'  Error vacuuming database: {e}')

    def analyze_database(self):
        """Analyze database performance and provide recommendations."""
        self.stdout.write('📊 Analyzing database...')
        
        try:
            with connection.cursor() as cursor:
                # Get database size
                cursor.execute("""
                    SELECT pg_size_pretty(pg_database_size(current_database()));
                """)
                db_size = cursor.fetchone()[0]
                self.stdout.write(f'  Database size: {db_size}')
                
                # Get table sizes
                cursor.execute("""
                    SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                    LIMIT 10;
                """)
                table_sizes = cursor.fetchall()
                
                self.stdout.write('  Largest tables:')
                for schema, table, size in table_sizes:
                    self.stdout.write(f'    {table}: {size}')
                
                # Get index usage statistics
                cursor.execute("""
                    SELECT schemaname, tablename, attname, n_distinct, correlation
                    FROM pg_stats 
                    WHERE schemaname = 'public'
                    ORDER BY n_distinct DESC
                    LIMIT 10;
                """)
                stats = cursor.fetchall()
                
                self.stdout.write('  Column statistics:')
                for schema, table, column, n_distinct, correlation in stats:
                    self.stdout.write(f'    {table}.{column}: {n_distinct} distinct values')
                
        except Exception as e:
            self.stdout.write(f'  Error analyzing database: {e}')

    def backup_database(self):
        """Create database backup."""
        self.stdout.write('💾 Creating database backup...')
        
        if self.dry_run:
            self.stdout.write('  Would create database backup')
            return
        
        try:
            # This is a simplified backup - in production, you'd use pg_dump
            from django.core.management import call_command
            
            # Create a data backup using Django's serialization
            timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
            backup_file = f'backup_{timestamp}.json'
            
            # This would need to be implemented with proper database backup tools
            self.stdout.write(f'  Database backup would be saved as: {backup_file}')
            self.stdout.write('  Note: This is a simplified backup. Use pg_dump for production.')
            
        except Exception as e:
            self.stdout.write(f'  Error creating backup: {e}')

    def log_maintenance_activity(self, task, details):
        """Log maintenance activity to system logs."""
        if not self.dry_run:
            SystemLog.objects.create(
                log_type='info',
                message=f'Database maintenance: {task} - {details}',
                source='db_maintenance_command',
                user=None
            )
