#!/usr/bin/env python
"""
Backup script for BM23 application
"""

import os
import sys
import django
import shutil
import json
import subprocess
from datetime import datetime
from pathlib import Path

# Add the project directory to Python path
project_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(project_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.conf import settings
from django.core.management import call_command

def create_backup_directory():
    """Create backup directory with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backups/backup_{timestamp}"
    os.makedirs(backup_dir, exist_ok=True)
    return backup_dir

def backup_database(backup_dir):
    """Backup database"""
    try:
        print("Backing up database...")
        
        # Get database configuration
        db_config = settings.DATABASES['default']
        
        if db_config['ENGINE'] == 'django.db.backends.postgresql':
            # PostgreSQL backup
            db_name = db_config['NAME']
            db_user = db_config['USER']
            db_host = db_config['HOST']
            db_port = db_config['PORT']
            
            backup_file = os.path.join(backup_dir, 'database.sql')
            cmd = f"pg_dump -h {db_host} -p {db_port} -U {db_user} -d {db_name} > {backup_file}"
            subprocess.run(cmd, shell=True, check=True)
            
        elif db_config['ENGINE'] == 'django.db.backends.sqlite3':
            # SQLite backup
            db_path = db_config['NAME']
            backup_file = os.path.join(backup_dir, 'database.sqlite3')
            shutil.copy2(db_path, backup_file)
        
        print("Database backup completed")
        return True
        
    except Exception as e:
        print(f"Database backup failed: {str(e)}")
        return False

def backup_media_files(backup_dir):
    """Backup media files"""
    try:
        print("Backing up media files...")
        
        media_source = settings.MEDIA_ROOT
        media_backup = os.path.join(backup_dir, 'media')
        
        if os.path.exists(media_source):
            shutil.copytree(media_source, media_backup)
            print("Media files backup completed")
        else:
            print("Media directory not found, skipping...")
        
        return True
        
    except Exception as e:
        print(f"Media files backup failed: {str(e)}")
        return False

def backup_static_files(backup_dir):
    """Backup static files"""
    try:
        print("Backing up static files...")
        
        static_source = settings.STATIC_ROOT
        static_backup = os.path.join(backup_dir, 'static')
        
        if os.path.exists(static_source):
            shutil.copytree(static_source, static_backup)
            print("Static files backup completed")
        else:
            print("Static directory not found, skipping...")
        
        return True
        
    except Exception as e:
        print(f"Static files backup failed: {str(e)}")
        return False

def backup_logs(backup_dir):
    """Backup log files"""
    try:
        print("Backing up log files...")
        
        logs_source = 'logs'
        logs_backup = os.path.join(backup_dir, 'logs')
        
        if os.path.exists(logs_source):
            shutil.copytree(logs_source, logs_backup)
            print("Log files backup completed")
        else:
            print("Logs directory not found, skipping...")
        
        return True
        
    except Exception as e:
        print(f"Log files backup failed: {str(e)}")
        return False

def export_fixtures(backup_dir):
    """Export Django fixtures"""
    try:
        print("Exporting fixtures...")
        
        fixtures_dir = os.path.join(backup_dir, 'fixtures')
        os.makedirs(fixtures_dir, exist_ok=True)
        
        # Export all models
        models_to_export = [
            'accounts.User',
            'projects.ProjectGroup',
            'students.Student',
            'advisors.Advisor',
            'majors.Major',
            'classrooms.Classroom',
            'milestones.Milestone',
            'scoring.ScoringCriteria',
            'notifications.Notification',
        ]
        
        for model in models_to_export:
            try:
                fixture_file = os.path.join(fixtures_dir, f'{model.replace(".", "_")}.json')
                call_command('dumpdata', model, output=fixture_file, indent=2)
                print(f"   Exported {model}")
            except Exception as e:
                print(f"   Failed to export {model}: {str(e)}")
        
        print("Fixtures export completed")
        return True
        
    except Exception as e:
        print(f"Fixtures export failed: {str(e)}")
        return False

def create_backup_info(backup_dir):
    """Create backup information file"""
    try:
        info = {
            'timestamp': datetime.now().isoformat(),
            'django_version': django.get_version(),
            'database_engine': settings.DATABASES['default']['ENGINE'],
            'debug_mode': settings.DEBUG,
            'allowed_hosts': settings.ALLOWED_HOSTS,
            'backup_type': 'full',
            'components': [
                'database',
                'media_files',
                'static_files',
                'logs',
                'fixtures'
            ]
        }
        
        info_file = os.path.join(backup_dir, 'backup_info.json')
        with open(info_file, 'w') as f:
            json.dump(info, f, indent=2)
        
        print("Backup info created")
        return True
        
    except Exception as e:
        print(f"Backup info creation failed: {str(e)}")
        return False

def cleanup_old_backups():
    """Clean up old backups (keep last 10)"""
    try:
        backups_dir = 'backups'
        if not os.path.exists(backups_dir):
            return True
        
        backup_dirs = [d for d in os.listdir(backups_dir) if d.startswith('backup_')]
        backup_dirs.sort(reverse=True)
        
        if len(backup_dirs) > 10:
            for old_backup in backup_dirs[10:]:
                old_path = os.path.join(backups_dir, old_backup)
                shutil.rmtree(old_path)
                print(f"Removed old backup: {old_backup}")
        
        return True
        
    except Exception as e:
        print(f"Cleanup failed: {str(e)}")
        return False

def main():
    """Run full backup"""
    print("Starting BM23 Backup Process...")
    print("=" * 50)
    
    # Create backup directory
    backup_dir = create_backup_directory()
    print(f"Backup directory: {backup_dir}")
    
    # Run backup components
    components = [
        ("Database", lambda: backup_database(backup_dir)),
        ("Media Files", lambda: backup_media_files(backup_dir)),
        ("Static Files", lambda: backup_static_files(backup_dir)),
        ("Log Files", lambda: backup_logs(backup_dir)),
        ("Fixtures", lambda: export_fixtures(backup_dir)),
        ("Backup Info", lambda: create_backup_info(backup_dir)),
    ]
    
    success_count = 0
    total_count = len(components)
    
    for name, func in components:
        print(f"\n{name}...")
        if func():
            success_count += 1
        else:
            print(f"{name} failed, continuing...")
    
    # Cleanup old backups
    print(f"\nCleaning up old backups...")
    cleanup_old_backups()
    
    # Summary
    print("\n" + "=" * 50)
    print(f"Backup Summary:")
    print(f"   Successful: {success_count}/{total_count}")
    print(f"   Backup location: {backup_dir}")
    
    if success_count == total_count:
        print("Full backup completed successfully!")
    else:
        print("Backup completed with some issues.")
        print("   Please check the logs above for details.")

if __name__ == "__main__":
    main()
