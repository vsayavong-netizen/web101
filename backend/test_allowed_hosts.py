#!/usr/bin/env python
"""
Test script to verify ALLOWED_HOSTS configuration
"""

import os
import sys
import django
from django.conf import settings

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings_production')

def test_allowed_hosts():
    """Test ALLOWED_HOSTS configuration"""
    
    print("🧪 Testing ALLOWED_HOSTS Configuration")
    print("=" * 50)
    
    try:
        # Setup Django
        django.setup()
        
        # Get current ALLOWED_HOSTS
        current_hosts = getattr(settings, 'ALLOWED_HOSTS', [])
        print(f"📋 Current ALLOWED_HOSTS: {current_hosts}")
        
        # Test domains
        test_domains = [
            'eduinfo.online',
            'www.eduinfo.online',
            'localhost',
            '127.0.0.1',
            'dbm-ecdo.onrender.com'
        ]
        
        print("\n🔍 Testing domains:")
        for domain in test_domains:
            if domain in current_hosts:
                print(f"✅ {domain} - ALLOWED")
            else:
                print(f"❌ {domain} - NOT ALLOWED")
        
        # Test Django's host validation
        from django.http import HttpRequest
        from django.core.exceptions import DisallowedHost
        
        print("\n🌐 Testing Django host validation:")
        for domain in test_domains:
            try:
                request = HttpRequest()
                request.META['HTTP_HOST'] = domain
                host = request.get_host()
                print(f"✅ {domain} - Django validation PASSED")
            except DisallowedHost as e:
                print(f"❌ {domain} - Django validation FAILED: {e}")
            except Exception as e:
                print(f"⚠️ {domain} - Django validation ERROR: {e}")
        
        print(f"\n📊 Summary:")
        print(f"- Total ALLOWED_HOSTS: {len(current_hosts)}")
        print(f"- Test domains: {len(test_domains)}")
        print(f"- All domains allowed: {all(domain in current_hosts for domain in test_domains)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing ALLOWED_HOSTS: {e}")
        return False

if __name__ == '__main__':
    success = test_allowed_hosts()
    if success:
        print("\n🎉 ALLOWED_HOSTS test completed successfully!")
    else:
        print("\n💥 ALLOWED_HOSTS test failed!")
        sys.exit(1)
