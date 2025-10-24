"""
Backup System
Automated backup for database and files
"""

import os
import django
import subprocess
import shutil
from datetime import datetime
from pathlib import Path

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

def backup_database():
    """Backup database"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backups/database/db_backup_{timestamp}.sql'
    
    try:
        # PostgreSQL backup
        cmd = [
            'pg_dump',
            '-h', 'localhost',
            '-U', 'project_user',
            '-d', 'final_project_management',
            '-f', backup_file
        ]
        
        subprocess.run(cmd, check=True)
        print(f"Database backup created: {backup_file}")
        return backup_file
    except Exception as e:
        print(f"Database backup failed: {e}")
        return None

def backup_files():
    """Backup media files"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backups/files/media_backup_{timestamp}.tar.gz'
    
    try:
        # Create tar.gz backup
        cmd = ['tar', '-czf', backup_file, 'media/']
        subprocess.run(cmd, check=True)
        print(f"Files backup created: {backup_file}")
        return backup_file
    except Exception as e:
        print(f"Files backup failed: {e}")
        return None

def backup_logs():
    """Backup log files"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backups/logs/logs_backup_{timestamp}.tar.gz'
    
    try:
        # Create tar.gz backup
        cmd = ['tar', '-czf', backup_file, 'logs/']
        subprocess.run(cmd, check=True)
        print(f"Logs backup created: {backup_file}")
        return backup_file
    except Exception as e:
        print(f"Logs backup failed: {e}")
        return None

def cleanup_old_backups():
    """Clean up old backup files"""
    backup_dirs = ['backups/database', 'backups/files', 'backups/logs']
    
    for backup_dir in backup_dirs:
        if os.path.exists(backup_dir):
            for file in os.listdir(backup_dir):
                file_path = os.path.join(backup_dir, file)
                if os.path.isfile(file_path):
                    # Delete files older than 30 days
                    file_age = datetime.now().timestamp() - os.path.getmtime(file_path)
                    if file_age > 30 * 24 * 60 * 60:  # 30 days
                        os.remove(file_path)
                        print(f"Deleted old backup: {file_path}")

def run_backup():
    """Run complete backup"""
    print(f"Starting backup at {datetime.now()}")
    
    # Create backup directories
    os.makedirs('backups/database', exist_ok=True)
    os.makedirs('backups/files', exist_ok=True)
    os.makedirs('backups/logs', exist_ok=True)
    
    # Run backups
    db_backup = backup_database()
    files_backup = backup_files()
    logs_backup = backup_logs()
    
    # Cleanup old backups
    cleanup_old_backups()
    
    print(f"Backup completed at {datetime.now()}")
    
    return {
        'database': db_backup,
        'files': files_backup,
        'logs': logs_backup
    }

if __name__ == '__main__':
    run_backup()
