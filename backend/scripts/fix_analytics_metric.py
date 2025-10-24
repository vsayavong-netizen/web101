#!/usr/bin/env python
"""
Script to fix AnalyticsMetric usage across the codebase.
"""
import os
import re

def fix_analytics_metric_usage():
    """Fix AnalyticsMetric usage in all Python files."""
    
    # Files to fix
    files_to_fix = [
        'accounts/signals.py',
        'students/signals.py', 
        'final_project_management/signals.py',
        'projects/signals.py',
        'final_project_management/utils.py',
        'accounts/middleware.py',
        'students/middleware.py',
        'projects/middleware.py'
    ]
    
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            print(f"Fixing {file_path}...")
            fix_file(file_path)
        else:
            print(f"File not found: {file_path}")

def fix_file(file_path):
    """Fix AnalyticsMetric usage in a single file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix patterns
    patterns = [
        # Fix name -> metric_name
        (r'name=([^,)]+)', r'metric_name=\1'),
        # Fix timestamp -> recorded_at
        (r'timestamp=([^,)]+)', r'recorded_at=\1'),
        # Fix metadata -> description
        (r'metadata=([^,)]+)', r'description=\1'),
        # Fix value= to value=
        (r'value=([^,)]+)', r'value=\1'),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed {file_path}")

if __name__ == '__main__':
    fix_analytics_metric_usage()
    print("AnalyticsMetric usage fixed!")
