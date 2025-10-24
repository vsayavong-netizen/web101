"""
Management command to restore data from backup files.
Usage: python manage.py restore_data --backup-dir backups
"""

import json
import os
from django.core.management.base import BaseCommand, CommandError
from django.core import serializers
from django.db import transaction
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Restore data from backup files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--backup-dir',
            type=str,
            required=True,
            help='Directory containing backup files',
        )
        parser.add_argument(
            '--timestamp',
            type=str,
            help='Specific backup timestamp to restore (default: latest)',
        )
        parser.add_argument(
            '--format',
            type=str,
            choices=['json', 'xml'],
            default='json',
            help='Backup format (default: json)',
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing data before restoring',
        )
        parser.add_argument(
            '--models',
            nargs='+',
            help='Specific models to restore (default: all models)',
        )

    def handle(self, *args, **options):
        self.backup_dir = options['backup_dir']
        self.timestamp = options['timestamp']
        self.format = options['format']
        self.clear_existing = options['clear_existing']
        self.models = options['models']
        
        if not os.path.exists(self.backup_dir):
            raise CommandError(f'Backup directory {self.backup_dir} does not exist')
        
        # Find backup files
        backup_files = self.find_backup_files()
        
        if not backup_files:
            raise CommandError('No backup files found')
        
        self.stdout.write(
            self.style.SUCCESS(f'Found {len(backup_files)} backup files')
        )
        
        if self.clear_existing:
            self.stdout.write(
                self.style.WARNING('Clearing existing data...')
            )
            self.clear_existing_data()
        
        # Restore data
        with transaction.atomic():
            for backup_file in backup_files:
                self.restore_file(backup_file)
        
        self.stdout.write(
            self.style.SUCCESS('Data restoration completed successfully!')
        )

    def find_backup_files(self):
        """Find backup files in the backup directory."""
        backup_files = []
        
        # Get all files in backup directory
        for filename in os.listdir(self.backup_dir):
            if filename.endswith(f'.{self.format}') and not filename.startswith('backup_summary'):
                # Extract timestamp from filename
                parts = filename.split('_')
                if len(parts) >= 2:
                    timestamp = '_'.join(parts[-2:]).replace(f'.{self.format}', '')
                    
                    # If specific timestamp requested, filter by it
                    if self.timestamp and timestamp != self.timestamp:
                        continue
                    
                    backup_files.append({
                        'filename': filename,
                        'timestamp': timestamp,
                        'model_name': '_'.join(parts[:-2])
                    })
        
        # Sort by timestamp (newest first)
        backup_files.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return backup_files

    def clear_existing_data(self):
        """Clear existing data before restoring."""
        # This is a simplified version - in production, you might want more control
        from django.core.management import call_command
        call_command('clear_data', confirm=True)

    def restore_file(self, backup_file):
        """Restore data from a single backup file."""
        file_path = os.path.join(self.backup_dir, backup_file['filename'])
        
        try:
            self.stdout.write(f'  Restoring {backup_file["model_name"]}...')
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = f.read()
            
            # Deserialize data
            objects = serializers.deserialize(self.format, data)
            
            # Save objects
            count = 0
            for obj in objects:
                obj.save()
                count += 1
            
            self.stdout.write(f'    Restored {count} records')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'    Error restoring {backup_file["model_name"]}: {e}')
            )

    def get_model_from_filename(self, filename):
        """Get model class from filename."""
        # This is a simplified mapping - in production, you'd want a more robust solution
        model_mapping = {
            'users': User,
            'profiles': 'accounts.Profile',
            'students': 'students.Student',
            'advisors': 'advisors.Advisor',
            'majors': 'majors.Major',
            'classrooms': 'classrooms.Classroom',
            'projects': 'projects.Project',
            'committees': 'committees.Committee',
            'milestones': 'milestones.Milestone',
            'scoring': 'scoring.ScoringRubric',
            'notifications': 'notifications.Notification',
            'ai_analyses': 'ai_services.AIAnalysis',
            'analytics': 'analytics.AnalyticsDashboard',
            'reports': 'reports.Report',
            'settings': 'settings.SystemSetting',
        }
        
        # Extract model name from filename
        model_name = filename.split('_')[0]
        return model_mapping.get(model_name)
