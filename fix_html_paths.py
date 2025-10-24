#!/usr/bin/env python3
"""
Script to fix HTML file paths for production deployment.
Changes /assets/ to /static/assets/ in the built HTML file.
"""

import os
import re

def fix_html_paths(html_file_path):
    """
    Fix asset paths in HTML file from /assets/ to /static/assets/
    """
    if not os.path.exists(html_file_path):
        print(f"ERROR: HTML file not found: {html_file_path}")
        return False
    
    try:
        # Read the HTML file
        with open(html_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace /assets/ with /static/assets/
        # This handles both src and href attributes
        content = re.sub(r'(["\'])/assets/', r'\1/static/assets/', content)
        
        # Write the fixed content back
        with open(html_file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"SUCCESS: Fixed asset paths in {html_file_path}")
        return True
        
    except Exception as e:
        print(f"ERROR: Failed to fix HTML paths: {e}")
        return False

def main():
    """
    Main function to fix HTML paths in frontend dist directory.
    """
    print("Fixing HTML asset paths for production...")
    
    # Paths to check
    html_paths = [
        'frontend/dist/index.html',
        'backend/staticfiles/index.html',
    ]
    
    success_count = 0
    for html_path in html_paths:
        if fix_html_paths(html_path):
            success_count += 1
    
    print(f"Fixed {success_count}/{len(html_paths)} HTML files")
    
    if success_count > 0:
        print("SUCCESS: HTML path fixing completed successfully!")
        return 0
    else:
        print("ERROR: No HTML files were fixed")
        return 1

if __name__ == "__main__":
    exit(main())
