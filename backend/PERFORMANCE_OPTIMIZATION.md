# BM23 - Performance Optimization Guide

## 🚀 คู่มือการปรับปรุงประสิทธิภาพระบบ

### 1. Database Optimization

#### 1.1 Database Indexing
```sql
-- สร้าง indexes สำหรับ tables หลัก
CREATE INDEX idx_users_email ON users_user(email);
CREATE INDEX idx_users_username ON users_user(username);
CREATE INDEX idx_users_role ON users_user(role);
CREATE INDEX idx_users_is_active ON users_user(is_active);

CREATE INDEX idx_projects_status ON projects_projectgroup(status);
CREATE INDEX idx_projects_advisor ON projects_projectgroup(advisor_id);
CREATE INDEX idx_projects_created_at ON projects_projectgroup(created_at);

CREATE INDEX idx_students_major ON students_student(major_id);
CREATE INDEX idx_students_classroom ON students_student(classroom_id);
CREATE INDEX idx_students_academic_year ON students_student(academic_year);

CREATE INDEX idx_advisors_department ON advisors_advisor(department);
CREATE INDEX idx_advisors_specialization ON advisors_advisor(specialization);

-- Composite indexes สำหรับ queries ที่ซับซ้อน
CREATE INDEX idx_projects_status_advisor ON projects_projectgroup(status, advisor_id);
CREATE INDEX idx_students_major_classroom ON students_student(major_id, classroom_id);
```

#### 1.2 Query Optimization
```python
# ใช้ select_related สำหรับ foreign keys
projects = ProjectGroup.objects.select_related('advisor', 'major').all()

# ใช้ prefetch_related สำหรับ many-to-many relationships
projects = ProjectGroup.objects.prefetch_related('students', 'committee_members').all()

# ใช้ only() เพื่อเลือกเฉพาะ fields ที่ต้องการ
users = User.objects.only('id', 'username', 'email', 'role').all()

# ใช้ defer() เพื่อไม่ load fields ที่ไม่ต้องการ
users = User.objects.defer('password', 'last_login').all()

# ใช้ values() เพื่อได้ dictionary แทน model instances
users = User.objects.values('id', 'username', 'email').all()

# ใช้ annotate() สำหรับ aggregate functions
from django.db.models import Count, Avg
projects = ProjectGroup.objects.annotate(
    student_count=Count('students'),
    avg_score=Avg('scores__score')
)
```

#### 1.3 Database Connection Optimization
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'final_project_management',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'MIN_CONNS': 5,
            'CONN_MAX_AGE': 600,  # 10 minutes
        },
    }
}
```

### 2. Caching Optimization

#### 2.1 Redis Configuration
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://localhost:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'bm23',
        'TIMEOUT': 300,  # 5 minutes
        'VERSION': 1,
    }
}
```

#### 2.2 View Caching
```python
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers

@cache_page(60 * 15)  # Cache for 15 minutes
@vary_on_headers('Authorization')
def project_list(request):
    # View logic here
    pass

# Template fragment caching
{% load cache %}
{% cache 500 sidebar %}
    <!-- Sidebar content -->
{% endcache %}
```

#### 2.3 Model Caching
```python
from django.core.cache import cache

def get_user_projects(user_id):
    cache_key = f'user_projects_{user_id}'
    projects = cache.get(cache_key)
    
    if projects is None:
        projects = ProjectGroup.objects.filter(students__user_id=user_id)
        cache.set(cache_key, projects, 300)  # Cache for 5 minutes
    
    return projects
```

### 3. Static Files Optimization

#### 3.1 Static Files Configuration
```python
# settings.py
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Compression
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
    'compressor.finders.CompressorFinder',
]

# WhiteNoise for serving static files
MIDDLEWARE = [
    'whitenoise.middleware.WhiteNooiseMiddleware',
    # ... other middleware
]
```

#### 3.2 Nginx Configuration
```nginx
# nginx.conf
server {
    # Static files with caching
    location /static/ {
        alias /app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }
    
    # Media files with caching
    location /media/ {
        alias /app/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

### 4. Application Performance

#### 4.1 Middleware Optimization
```python
# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

#### 4.2 Session Optimization
```python
# settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_SAVE_EVERY_REQUEST = False
```

#### 4.3 Logging Optimization
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/django.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
```

### 5. API Performance

#### 5.1 Pagination
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'PAGE_SIZE_QUERY_PARAM': 'page_size',
    'MAX_PAGE_SIZE': 100,
}
```

#### 5.2 API Caching
```python
from django.core.cache import cache
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def project_list(request):
    cache_key = f'project_list_{request.GET.get("page", 1)}'
    cached_data = cache.get(cache_key)
    
    if cached_data is None:
        projects = ProjectGroup.objects.all()
        # ... processing logic
        cached_data = {
            'results': projects,
            'count': projects.count()
        }
        cache.set(cache_key, cached_data, 300)  # Cache for 5 minutes
    
    return Response(cached_data)
```

#### 5.3 Database Query Optimization
```python
# ใช้ select_related และ prefetch_related
class ProjectViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return ProjectGroup.objects.select_related(
            'advisor', 'major'
        ).prefetch_related(
            'students', 'committee_members'
        ).all()
```

### 6. Frontend Performance

#### 6.1 React Optimization
```typescript
// ใช้ React.memo สำหรับ components ที่ไม่เปลี่ยนบ่อย
const ProjectCard = React.memo(({ project }) => {
  return (
    <div className="project-card">
      <h3>{project.title}</h3>
      <p>{project.description}</p>
    </div>
  );
});

// ใช้ useMemo สำหรับ expensive calculations
const ProjectList = ({ projects }) => {
  const filteredProjects = useMemo(() => {
    return projects.filter(project => project.status === 'active');
  }, [projects]);
  
  return (
    <div>
      {filteredProjects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

// ใช้ useCallback สำหรับ event handlers
const ProjectForm = () => {
  const handleSubmit = useCallback((data) => {
    // Submit logic
  }, []);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

#### 6.2 Bundle Optimization
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
});
```

### 7. Monitoring Performance

#### 7.1 Performance Monitoring
```python
# monitoring.py
import time
from django.db import connection
from django.core.cache import cache

def monitor_performance():
    # Database query monitoring
    start_time = time.time()
    queries_before = len(connection.queries)
    
    # Your code here
    
    queries_after = len(connection.queries)
    query_count = queries_after - queries_before
    execution_time = time.time() - start_time
    
    # Log performance metrics
    if execution_time > 1.0:  # Log slow queries
        logger.warning(f"Slow query detected: {execution_time:.2f}s, {query_count} queries")
    
    return {
        'execution_time': execution_time,
        'query_count': query_count,
        'queries': connection.queries[-query_count:] if query_count > 0 else []
    }
```

#### 7.2 Database Query Monitoring
```python
# settings.py
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['console'],
        },
    },
}

# เปิด query logging ใน development
if DEBUG:
    LOGGING['loggers']['django.db.backends']['level'] = 'DEBUG'
```

### 8. Production Optimization

#### 8.1 Gunicorn Configuration
```python
# gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
```

#### 8.2 Nginx Configuration
```nginx
# nginx.conf
upstream django {
    server web:8000;
}

server {
    listen 80;
    server_name _;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Static files
    location /static/ {
        alias /app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /app/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API requests
    location /api/ {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

### 9. Performance Testing

#### 9.1 Load Testing
```python
# load_test.py
import requests
import time
import concurrent.futures
from threading import Thread

def make_request(url):
    start_time = time.time()
    try:
        response = requests.get(url)
        end_time = time.time()
        return {
            'status_code': response.status_code,
            'response_time': end_time - start_time,
            'success': response.status_code == 200
        }
    except Exception as e:
        return {
            'status_code': 0,
            'response_time': 0,
            'success': False,
            'error': str(e)
        }

def run_load_test(url, num_requests=100, num_threads=10):
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [executor.submit(make_request, url) for _ in range(num_requests)]
        results = [future.result() for future in futures]
    
    successful_requests = sum(1 for r in results if r['success'])
    avg_response_time = sum(r['response_time'] for r in results) / len(results)
    
    print(f"Load Test Results:")
    print(f"Total Requests: {num_requests}")
    print(f"Successful Requests: {successful_requests}")
    print(f"Success Rate: {successful_requests/num_requests*100:.1f}%")
    print(f"Average Response Time: {avg_response_time:.3f}s")
    
    return results
```

#### 9.2 Database Performance Testing
```python
# db_performance_test.py
from django.test import TestCase
from django.db import connection
import time

class DatabasePerformanceTest(TestCase):
    def test_query_performance(self):
        # Test user creation performance
        start_time = time.time()
        for i in range(100):
            User.objects.create_user(
                username=f'testuser{i}',
                email=f'test{i}@example.com',
                password='testpass123'
            )
        creation_time = time.time() - start_time
        
        # Test query performance
        start_time = time.time()
        users = User.objects.all()
        query_time = time.time() - start_time
        
        print(f"User creation time: {creation_time:.3f}s")
        print(f"Query time: {query_time:.3f}s")
        print(f"Query count: {len(connection.queries)}")
        
        # Assertions
        self.assertLess(creation_time, 5.0)  # Should create 100 users in < 5s
        self.assertLess(query_time, 1.0)      # Should query in < 1s
```

### 10. Performance Metrics

#### 10.1 Key Performance Indicators
- **Response Time**: < 2 seconds for API requests
- **Database Query Time**: < 100ms for simple queries
- **Memory Usage**: < 80% of available memory
- **CPU Usage**: < 70% of available CPU
- **Cache Hit Rate**: > 90% for frequently accessed data
- **Error Rate**: < 1% of total requests

#### 10.2 Monitoring Tools
```python
# performance_monitor.py
import psutil
import time
from django.core.cache import cache

def get_performance_metrics():
    # System metrics
    cpu_percent = psutil.cpu_percent()
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Application metrics
    cache_stats = cache._cache.get_client().info()
    
    return {
        'timestamp': time.time(),
        'cpu_percent': cpu_percent,
        'memory_percent': memory.percent,
        'disk_percent': disk.percent,
        'cache_hits': cache_stats.get('keyspace_hits', 0),
        'cache_misses': cache_stats.get('keyspace_misses', 0),
    }
```

### 11. Optimization Checklist

#### 11.1 Database Optimization
- [ ] Add appropriate indexes
- [ ] Optimize queries with select_related/prefetch_related
- [ ] Use database connection pooling
- [ ] Monitor slow queries
- [ ] Regular database maintenance

#### 11.2 Caching Optimization
- [ ] Configure Redis properly
- [ ] Implement view caching
- [ ] Use template fragment caching
- [ ] Cache expensive calculations
- [ ] Monitor cache hit rates

#### 11.3 Static Files Optimization
- [ ] Configure static files serving
- [ ] Enable gzip compression
- [ ] Set appropriate cache headers
- [ ] Use CDN if possible
- [ ] Optimize images

#### 11.4 Application Optimization
- [ ] Optimize middleware stack
- [ ] Use efficient session storage
- [ ] Optimize logging
- [ ] Monitor memory usage
- [ ] Profile application code

#### 11.5 API Optimization
- [ ] Implement pagination
- [ ] Use API caching
- [ ] Optimize serializers
- [ ] Monitor API performance
- [ ] Rate limiting

#### 11.6 Frontend Optimization
- [ ] Optimize React components
- [ ] Use code splitting
- [ ] Optimize bundle size
- [ ] Implement lazy loading
- [ ] Monitor frontend performance

---

**💡 Performance Tips:**

1. **Monitor First**: Always measure before optimizing
2. **Database First**: Database optimization usually gives the biggest gains
3. **Cache Strategically**: Cache expensive operations and frequently accessed data
4. **Profile Regularly**: Use profiling tools to identify bottlenecks
5. **Test Performance**: Include performance tests in your test suite
6. **Monitor in Production**: Set up monitoring and alerting for performance metrics

**📊 Performance Targets:**
- **API Response Time**: < 2 seconds
- **Database Query Time**: < 100ms
- **Page Load Time**: < 3 seconds
- **Memory Usage**: < 80%
- **CPU Usage**: < 70%
- **Cache Hit Rate**: > 90%
