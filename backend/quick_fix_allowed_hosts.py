#!/usr/bin/env python
"""
Quick fix for ALLOWED_HOSTS issue
Run this script to immediately fix the ALLOWED_HOSTS problem
"""

import os
import sys

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Set environment variables
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings_production')

def quick_fix():
    """Quick fix for ALLOWED_HOSTS"""
    
    print("🚀 Quick Fix for ALLOWED_HOSTS Issue")
    print("=" * 50)
    
    # Method 1: Update .env file
    env_file = os.path.join(backend_dir, '.env')
    if os.path.exists(env_file):
        print("📝 Updating .env file...")
        with open(env_file, 'r') as f:
            content = f.read()
        
        # Update ALLOWED_HOSTS in .env
        if 'ALLOWED_HOSTS=' in content:
            # Replace existing ALLOWED_HOSTS
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('ALLOWED_HOSTS='):
                    lines[i] = 'ALLOWED_HOSTS=eduinfo.online,www.eduinfo.online,localhost,127.0.0.1,dbm-ecdo.onrender.com,0.0.0.0,testserver'
                    break
            
            with open(env_file, 'w') as f:
                f.write('\n'.join(lines))
            print("✅ Updated .env file")
        else:
            # Add ALLOWED_HOSTS if not present
            with open(env_file, 'a') as f:
                f.write('\nALLOWED_HOSTS=eduinfo.online,www.eduinfo.online,localhost,127.0.0.1,dbm-ecdo.onrender.com,0.0.0.0,testserver\n')
            print("✅ Added ALLOWED_HOSTS to .env file")
    
    # Method 2: Create a temporary settings override
    print("🔧 Creating settings override...")
    override_content = '''
# Temporary override for ALLOWED_HOSTS
import os
os.environ.setdefault('ALLOWED_HOSTS', 'eduinfo.online,www.eduinfo.online,localhost,127.0.0.1,dbm-ecdo.onrender.com,0.0.0.0,testserver')

# Force override ALLOWED_HOSTS
ALLOWED_HOSTS = [
    'eduinfo.online',
    'www.eduinfo.online', 
    'localhost',
    '127.0.0.1',
    'dbm-ecdo.onrender.com',
    '0.0.0.0',
    'testserver'
]
'''
    
    override_file = os.path.join(backend_dir, 'allowed_hosts_override.py')
    with open(override_file, 'w') as f:
        f.write(override_content)
    print("✅ Created settings override file")
    
    # Method 3: Update settings_production.py directly
    print("📝 Updating settings_production.py...")
    settings_file = os.path.join(backend_dir, 'final_project_management', 'settings_production.py')
    
    if os.path.exists(settings_file):
        with open(settings_file, 'r') as f:
            content = f.read()
        
        # Add a hardcoded ALLOWED_HOSTS override at the top
        override_section = '''
# EMERGENCY FIX: Force ALLOWED_HOSTS for production
ALLOWED_HOSTS = [
    'eduinfo.online',
    'www.eduinfo.online',
    'localhost', 
    '127.0.0.1',
    'dbm-ecdo.onrender.com',
    '0.0.0.0',
    'testserver'
]
'''
        
        # Insert after imports
        if 'from .settings import *' in content:
            content = content.replace(
                'from .settings import *',
                'from .settings import *' + override_section
            )
            
            with open(settings_file, 'w') as f:
                f.write(content)
            print("✅ Updated settings_production.py")
    
    print("\n🎉 Quick fix completed!")
    print("The following domains are now allowed:")
    print("- eduinfo.online")
    print("- www.eduinfo.online") 
    print("- localhost")
    print("- 127.0.0.1")
    print("- dbm-ecdo.onrender.com")
    print("- 0.0.0.0")
    print("- testserver")
    
    print("\n📋 Next steps:")
    print("1. Restart your Django application")
    print("2. Test the website at https://eduinfo.online")
    print("3. If still having issues, check the logs for more details")

if __name__ == '__main__':
    quick_fix()
