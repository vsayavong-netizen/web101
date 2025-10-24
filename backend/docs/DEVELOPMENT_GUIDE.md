# Final Project Management System - Development Guide

## Overview

This guide provides comprehensive instructions for setting up and developing the Final Project Management System. It covers local development, testing, debugging, and contribution guidelines.

## Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **Python**: 3.9 or later
- **Node.js**: 16.x or later (for frontend development)
- **Git**: 2.20 or later
- **Database**: PostgreSQL 12+ or SQLite 3.8+

### Development Tools

- **IDE**: VS Code, PyCharm, or any Python-compatible editor
- **Version Control**: Git
- **API Testing**: Postman, Insomnia, or curl
- **Database Client**: pgAdmin, DBeaver, or psql

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/final-project-management.git
cd final-project-management
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 3. Environment Configuration

Create `.env` file in the backend directory:

```env
# Django Settings
SECRET_KEY=your-development-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for development)
DATABASE_URL=sqlite:///db.sqlite3

# Redis (optional for development)
REDIS_URL=redis://localhost:6379/0

# Email Configuration (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# AI Integration (optional)
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Security (disabled for development)
SECURE_SSL_REDIRECT=False
SECURE_HSTS_SECONDS=0
```

### 4. Database Setup

```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data (optional)
python manage.py loaddata fixtures/sample_data.json
```

### 5. Start Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

### 6. Frontend Setup (Optional)

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000/`

## Development Workflow

### 1. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add your feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

### 2. Code Style

Follow PEP 8 for Python code:

```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run linting
flake8 .
black .
isort .
```

### 3. Testing

```bash
# Run all tests
python manage.py test

# Run specific test
python manage.py test tests.test_authentication

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

### 4. Database Management

```bash
# Create migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (development only)
python manage.py flush
```

## API Development

### 1. Creating New Endpoints

```python
# views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class YourViewSet(viewsets.ModelViewSet):
    queryset = YourModel.objects.all()
    serializer_class = YourSerializer
    
    @action(detail=True, methods=['post'])
    def custom_action(self, request, pk=None):
        # Your custom logic here
        return Response({'message': 'Success'})
```

### 2. Serializers

```python
# serializers.py
from rest_framework import serializers

class YourSerializer(serializers.ModelSerializer):
    class Meta:
        model = YourModel
        fields = '__all__'
    
    def validate_field(self, value):
        # Custom validation
        if not value:
            raise serializers.ValidationError("Field is required")
        return value
```

### 3. Permissions

```python
# permissions.py
from rest_framework import permissions

class YourPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # Your permission logic
        return request.user.is_authenticated
```

### 4. URL Configuration

```python
# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'your-endpoint', views.YourViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

## Database Development

### 1. Model Development

```python
# models.py
from django.db import models
from .base import BaseModel

class YourModel(BaseModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'your_table'
        indexes = [
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return self.name
```

### 2. Migrations

```bash
# Create migration
python manage.py makemigrations your_app

# Apply migration
python manage.py migrate

# Check migration status
python manage.py showmigrations
```

### 3. Database Queries

```python
# Using Django ORM
from django.db.models import Q, Count, Avg

# Basic queries
objects = YourModel.objects.filter(name__icontains='search')
objects = YourModel.objects.select_related('foreign_key')
objects = YourModel.objects.prefetch_related('many_to_many')

# Aggregations
stats = YourModel.objects.aggregate(
    total=Count('id'),
    average=Avg('score')
)

# Complex queries
objects = YourModel.objects.filter(
    Q(name__icontains='search') | Q(description__icontains='search')
).annotate(
    item_count=Count('related_items')
)
```

## Testing

### 1. Unit Tests

```python
# tests.py
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class YourTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_your_functionality(self):
        # Your test logic
        self.assertEqual(1 + 1, 2)
```

### 2. API Tests

```python
# test_api.py
from rest_framework.test import APITestCase
from rest_framework import status

class YourAPITestCase(APITestCase):
    def test_api_endpoint(self):
        url = '/api/your-endpoint/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
```

### 3. Integration Tests

```python
# test_integration.py
from django.test import TestCase
from django.urls import reverse

class IntegrationTestCase(TestCase):
    def test_complete_workflow(self):
        # Test complete user workflow
        pass
```

### 4. Performance Tests

```python
# test_performance.py
import time
from django.test import TestCase

class PerformanceTestCase(TestCase):
    def test_query_performance(self):
        start_time = time.time()
        # Your performance test
        end_time = time.time()
        self.assertLess(end_time - start_time, 1.0)
```

## Debugging

### 1. Django Debug Toolbar

```bash
# Install
pip install django-debug-toolbar

# Add to settings
INSTALLED_APPS = [
    'debug_toolbar',
]

MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Add to urls.py
if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
```

### 2. Logging

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### 3. Database Debugging

```python
# Enable query logging
from django.db import connection
from django.test.utils import override_settings

@override_settings(DEBUG=True)
def debug_queries():
    # Your code here
    print(connection.queries)
```

## Security Development

### 1. Input Validation

```python
# validators.py
from django.core.exceptions import ValidationError

def validate_input(value):
    if not value:
        raise ValidationError("Input is required")
    # Additional validation
    return value
```

### 2. Authentication

```python
# authentication.py
from rest_framework.authentication import BaseAuthentication

class CustomAuthentication(BaseAuthentication):
    def authenticate(self, request):
        # Your authentication logic
        return (user, token)
```

### 3. Permissions

```python
# permissions.py
from rest_framework import permissions

class CustomPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # Your permission logic
        return request.user.is_authenticated
```

## Frontend Integration

### 1. API Client

```javascript
// apiClient.js
class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('access_token');
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
            },
            ...options,
        };
        
        const response = await fetch(url, config);
        return response.json();
    }
}
```

### 2. Error Handling

```javascript
// errorHandler.js
export const handleApiError = (error) => {
    if (error.response) {
        // Server responded with error status
        console.error('API Error:', error.response.data);
    } else if (error.request) {
        // Request was made but no response
        console.error('Network Error:', error.request);
    } else {
        // Something else happened
        console.error('Error:', error.message);
    }
};
```

## AI Integration Development

### 1. AI Service Integration

```python
# ai_services.py
import google.generativeai as genai

class AIService:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def analyze_text(self, text):
        response = self.model.generate_content(text)
        return response.text
```

### 2. AI Feature Testing

```python
# test_ai.py
from unittest.mock import patch
from django.test import TestCase

class AITestCase(TestCase):
    @patch('your_app.ai_services.AIService')
    def test_ai_feature(self, mock_ai_service):
        mock_ai_service.return_value.analyze_text.return_value = "AI response"
        # Your test logic
```

## Performance Optimization

### 1. Database Optimization

```python
# Use select_related for foreign keys
objects = Model.objects.select_related('foreign_key')

# Use prefetch_related for many-to-many
objects = Model.objects.prefetch_related('many_to_many')

# Use only() to limit fields
objects = Model.objects.only('field1', 'field2')

# Use defer() to exclude fields
objects = Model.objects.defer('large_field')
```

### 2. Caching

```python
# views.py
from django.core.cache import cache
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # Cache for 15 minutes
def expensive_view(request):
    # Your expensive logic
    pass
```

### 3. Async Operations

```python
# async_views.py
import asyncio
from django.http import JsonResponse

async def async_view(request):
    # Your async logic
    result = await some_async_operation()
    return JsonResponse({'result': result})
```

## Documentation

### 1. API Documentation

```python
# views.py
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

@swagger_auto_schema(
    method='post',
    request_body=YourSerializer,
    responses={200: YourSerializer}
)
def your_view(request):
    # Your view logic
    pass
```

### 2. Code Documentation

```python
def your_function(param1, param2):
    """
    Brief description of the function.
    
    Args:
        param1 (str): Description of param1
        param2 (int): Description of param2
    
    Returns:
        dict: Description of return value
    
    Raises:
        ValueError: Description of when this exception is raised
    """
    # Your function logic
    pass
```

## Deployment Preparation

### 1. Environment Configuration

```python
# settings/production.py
import os

DEBUG = False
ALLOWED_HOSTS = ['your-domain.com']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT'),
    }
}
```

### 2. Static Files

```bash
# Collect static files
python manage.py collectstatic

# Configure static file serving
# In production, use nginx or CDN
```

### 3. Database Migration

```bash
# Run migrations in production
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   - Check virtual environment activation
   - Verify package installation
   - Check Python path

2. **Database Connection Issues**
   - Verify database credentials
   - Check database server status
   - Verify network connectivity

3. **Permission Errors**
   - Check file permissions
   - Verify user permissions
   - Check SELinux/AppArmor settings

4. **Memory Issues**
   - Monitor memory usage
   - Optimize database queries
   - Use pagination for large datasets

### Debug Tools

```bash
# Django shell
python manage.py shell

# Database shell
python manage.py dbshell

# Check migrations
python manage.py showmigrations

# Check settings
python manage.py diffsettings
```

## Contributing

### 1. Code Standards

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Write comprehensive docstrings
- Include type hints where appropriate

### 2. Testing Requirements

- Write unit tests for new features
- Maintain test coverage above 80%
- Include integration tests for complex workflows
- Test error conditions and edge cases

### 3. Documentation

- Update API documentation for new endpoints
- Include code examples in docstrings
- Update README for new features
- Document breaking changes

### 4. Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Update documentation
6. Submit pull request

## Resources

### Documentation

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Tools

- [Django Debug Toolbar](https://django-debug-toolbar.readthedocs.io/)
- [Django Extensions](https://django-extensions.readthedocs.io/)
- [Postman](https://www.postman.com/)

### Community

- [Django Forum](https://forum.djangoproject.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/django)
- [Reddit r/django](https://www.reddit.com/r/django/)

This development guide provides comprehensive instructions for setting up and developing the Final Project Management System. Follow these guidelines to ensure consistent, high-quality code and smooth development workflow.
