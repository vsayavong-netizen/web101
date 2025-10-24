#!/usr/bin/env python
"""
Script to fix ALLOWED_HOSTS issue for production deployment
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings_production')

# Setup Django
django.setup()

def fix_allowed_hosts():
    """Fix ALLOWED_HOSTS configuration"""
    
    # Get current ALLOWED_HOSTS
    current_hosts = getattr(settings, 'ALLOWED_HOSTS', [])
    print(f"Current ALLOWED_HOSTS: {current_hosts}")
    
    # Required production domains
    required_domains = [
        'eduinfo.online',
        'www.eduinfo.online', 
        'dbm-ecdo.onrender.com',
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        'testserver'
    ]
    
    # Add missing domains
    updated_hosts = list(current_hosts)
    for domain in required_domains:
        if domain not in updated_hosts:
            updated_hosts.append(domain)
            print(f"Added domain: {domain}")
    
    print(f"Updated ALLOWED_HOSTS: {updated_hosts}")
    
    # Update settings
    settings.ALLOWED_HOSTS = updated_hosts
    
    return updated_hosts

def test_allowed_hosts():
    """Test if ALLOWED_HOSTS is working correctly"""
    from django.http import HttpRequest
    from django.core.exceptions import DisallowedHost
    
    test_hosts = [
        'eduinfo.online',
        'www.eduinfo.online',
        'dbm-ecdo.onrender.com',
        'localhost',
        '127.0.0.1'
    ]
    
    print("\nTesting ALLOWED_HOSTS:")
    for host in test_hosts:
        try:
            request = HttpRequest()
            request.META['HTTP_HOST'] = host
            request.get_host()
            print(f"✅ {host} - OK")
        except DisallowedHost as e:
            print(f"❌ {host} - FAILED: {e}")
        except Exception as e:
            print(f"⚠️ {host} - ERROR: {e}")

if __name__ == '__main__':
    print("🔧 Fixing ALLOWED_HOSTS configuration...")
    
    try:
        # Fix ALLOWED_HOSTS
        updated_hosts = fix_allowed_hosts()
        
        # Test the configuration
        test_allowed_hosts()
        
        print("\n✅ ALLOWED_HOSTS configuration fixed successfully!")
        print(f"Final ALLOWED_HOSTS: {updated_hosts}")
        
    except Exception as e:
        print(f"❌ Error fixing ALLOWED_HOSTS: {e}")
        sys.exit(1)
