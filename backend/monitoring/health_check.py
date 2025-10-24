"""
Health Check Script
Monitors system health and performance
"""

import os
import django
import json
import time
from datetime import datetime

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.db import connection
from django.core.cache import cache
from django.contrib.auth import get_user_model
from projects.models import ProjectGroup
from students.models import Student
from advisors.models import Advisor

User = get_user_model()

def health_check():
    """Comprehensive health check"""
    start_time = time.time()
    
    health_status = {
        'timestamp': datetime.now().isoformat(),
        'status': 'healthy',
        'checks': {}
    }
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = {
            'status': 'ok',
            'response_time': time.time() - start_time
        }
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['checks']['database'] = {
            'status': 'error',
            'error': str(e)
        }
    
    # Cache check
    try:
        cache.set('health_check', 'ok', 30)
        cache_result = cache.get('health_check')
        if cache_result == 'ok':
            health_status['checks']['cache'] = {'status': 'ok'}
        else:
            health_status['checks']['cache'] = {'status': 'error', 'error': 'Cache test failed'}
    except Exception as e:
        health_status['checks']['cache'] = {'status': 'error', 'error': str(e)}
    
    # Model checks
    try:
        user_count = User.objects.count()
        project_count = ProjectGroup.objects.count()
        student_count = Student.objects.count()
        advisor_count = Advisor.objects.count()
        
        health_status['checks']['models'] = {
            'status': 'ok',
            'data': {
                'users': user_count,
                'projects': project_count,
                'students': student_count,
                'advisors': advisor_count
            }
        }
    except Exception as e:
        health_status['checks']['models'] = {'status': 'error', 'error': str(e)}
    
    # Performance metrics
    total_time = time.time() - start_time
    health_status['performance'] = {
        'total_time': total_time,
        'timestamp': datetime.now().isoformat()
    }
    
    return health_status

if __name__ == '__main__':
    result = health_check()
    print(json.dumps(result, indent=2))
