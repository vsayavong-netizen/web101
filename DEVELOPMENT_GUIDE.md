# 🛠️ Frontend-Backend Integration Development Guide

## 🎯 Development Overview

This guide covers the complete development process for the University Final Project Management System, focusing on Frontend-Backend integration, best practices, and advanced features.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                             │
│  ├── Components (85+ components)                          │
│  │   ├── UI Components (40+)                             │
│  │   ├── Business Components (30+)                       │
│  │   └── Integration Components (15+)                    │
│  ├── Hooks (7 custom hooks)                              │
│  │   ├── useApiIntegration                               │
│  │   ├── useMockData                                     │
│  │   ├── useAuth                                         │
│  │   └── useAiStudentAnalysis                            │
│  ├── Context (3 context providers)                       │
│  │   ├── LanguageContext                                │
│  │   ├── ThemeContext                                   │
│  │   └── ToastContext                                   │
│  ├── Utils (3 utility modules)                           │
│  │   ├── apiClient                                      │
│  │   ├── colorUtils                                     │
│  │   └── timeUtils                                      │
│  └── Types (Complete type definitions)                   │
├─────────────────────────────────────────────────────────────┤
│  Backend (Django + DRF)                                    │
│  ├── Core Apps (12 apps)                                  │
│  │   ├── accounts (Authentication)                       │
│  │   ├── projects (Project Management)                   │
│  │   ├── students (Student Management)                   │
│  │   ├── advisors (Advisor Management)                  │
│  │   ├── majors (Academic Programs)                     │
│  │   ├── classrooms (Class Management)                  │
│  │   ├── milestones (Project Milestones)               │
│  │   ├── scoring (Evaluation System)                    │
│  │   ├── notifications (Alert System)                  │
│  │   ├── ai_services (AI Integration)                  │
│  │   ├── analytics (Data Analysis)                      │
│  │   └── settings (System Configuration)                │
│  ├── New Feature Apps (4 apps)                            │
│  │   ├── file_management (File Operations)              │
│  │   ├── communication (Messaging System)              │
│  │   ├── ai_enhancement (AI Tools)                      │
│  │   └── defense_management (Defense System)            │
│  ├── API Endpoints (18+ endpoints)                       │
│  ├── Authentication (JWT)                                 │
│  ├── Database Models (50+ models)                        │
│  └── Integration Layer (Complete API coverage)           │
├─────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL)                                     │
│  ├── User Management (5 tables)                          │
│  ├── Project Data (15 tables)                            │
│  ├── File Storage (8 tables)                             │
│  ├── Communication (6 tables)                            │
│  ├── AI Data (4 tables)                                  │
│  └── Analytics (3 tables)                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

#### Development Environment:
- **Node.js**: 18+ (Frontend)
- **Python**: 3.11+ (Backend)
- **PostgreSQL**: 14+ (Database)
- **Redis**: 6+ (Cache)
- **Git**: Version control
- **VS Code**: Recommended IDE

#### Required Tools:
```bash
# Frontend tools
npm install -g @vitejs/create-vite
npm install -g typescript
npm install -g eslint

# Backend tools
pip install django
pip install djangorestframework
pip install psycopg2-binary
pip install redis
pip install celery
```

### Project Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd bm23
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🎨 Frontend Development

### Component Architecture

#### Component Structure:
```
frontend/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   ├── modals/          # Modal dialogs
│   ├── tables/          # Data tables
│   └── charts/          # Data visualization
├── hooks/               # Custom React hooks
├── context/             # React context providers
├── utils/               # Utility functions
├── types/               # TypeScript definitions
└── config/              # Configuration files
```

#### Component Development Guidelines:

##### 1. Component Creation:
```typescript
// components/ExampleComponent.tsx
import React from 'react';
import { useApiIntegration } from '../hooks/useApiIntegration';
import { useToast } from '../hooks/useToast';

interface ExampleComponentProps {
  title: string;
  onAction?: () => void;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  onAction
}) => {
  const { data, loading, error } = useApiIntegration('/api/example/');
  const addToast = useToast();

  const handleAction = () => {
    addToast({ type: 'success', message: 'Action completed!' });
    onAction?.();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="example-component">
      <h2>{title}</h2>
      <button onClick={handleAction}>Action</button>
    </div>
  );
};
```

##### 2. Custom Hook Development:
```typescript
// hooks/useExampleData.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/apiClient';

export const useExampleData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/api/example/');
      setData(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
```

##### 3. Context Provider Development:
```typescript
// context/ExampleContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ExampleContextType {
  value: string;
  setValue: (value: string) => void;
}

const ExampleContext = createContext<ExampleContextType | undefined>(undefined);

export const ExampleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [value, setValue] = useState('');

  return (
    <ExampleContext.Provider value={{ value, setValue }}>
      {children}
    </ExampleContext.Provider>
  );
};

export const useExample = () => {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error('useExample must be used within ExampleProvider');
  }
  return context;
};
```

### API Integration

#### 1. API Client Usage:
```typescript
// Using the API client
import { apiClient } from '../utils/apiClient';

// GET request
const data = await apiClient.get('/api/projects/');

// POST request
const newProject = await apiClient.post('/api/projects/', {
  title: 'New Project',
  description: 'Project description'
});

// File upload
const file = document.getElementById('file').files[0];
const uploadResult = await apiClient.uploadFile(file, 'project-id');
```

#### 2. Integration Hook Usage:
```typescript
// Using integration hooks
import { useProjects, useStudents, useAuth } from '../hooks/useApiIntegration';

const ProjectList = () => {
  const { data: projects, loading, create, update, remove } = useProjects();
  const { user, isAuthenticated } = useAuth();

  const handleCreateProject = async (projectData) => {
    try {
      await create(projectData);
      // Project created successfully
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {loading ? (
        <div>Loading projects...</div>
      ) : (
        <div>
          {projects?.map(project => (
            <div key={project.id}>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### State Management

#### 1. Local State:
```typescript
// Component-level state
const [isOpen, setIsOpen] = useState(false);
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
```

#### 2. Context State:
```typescript
// Global state with context
const { language, setLanguage } = useLanguage();
const { theme, toggleTheme } = useTheme();
const addToast = useToast();
```

#### 3. Server State:
```typescript
// Server state with hooks
const { data, loading, error, refetch } = useApiIntegration('/api/endpoint/');
```

## 🔧 Backend Development

### Django App Structure

#### App Development:
```python
# apps/example/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ExampleModel(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Example'
        verbose_name_plural = 'Examples'

    def __str__(self):
        return self.title
```

#### Serializer Development:
```python
# apps/example/serializers.py
from rest_framework import serializers
from .models import ExampleModel

class ExampleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ExampleModel
        fields = ['id', 'title', 'description', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ExampleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExampleModel
        fields = ['title', 'description']

class ExampleUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExampleModel
        fields = ['title', 'description']
```

#### View Development:
```python
# apps/example/views.py
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import ExampleModel
from .serializers import ExampleSerializer, ExampleCreateSerializer, ExampleUpdateSerializer

class ExampleListView(generics.ListCreateAPIView):
    queryset = ExampleModel.objects.all()
    serializer_class = ExampleSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ExampleCreateSerializer
        return ExampleSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ExampleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExampleModel.objects.all()
    serializer_class = ExampleSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ExampleUpdateSerializer
        return ExampleSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def example_statistics(request):
    """Get example statistics"""
    total_count = ExampleModel.objects.count()
    user_count = ExampleModel.objects.filter(created_by=request.user).count()
    
    return Response({
        'total_count': total_count,
        'user_count': user_count,
        'percentage': (user_count / total_count * 100) if total_count > 0 else 0
    })
```

#### URL Configuration:
```python
# apps/example/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.ExampleListView.as_view(), name='example-list'),
    path('<int:pk>/', views.ExampleDetailView.as_view(), name='example-detail'),
    path('statistics/', views.example_statistics, name='example-statistics'),
]
```

### API Development Best Practices

#### 1. Error Handling:
```python
# utils/error_handling.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'error': {
                'status_code': response.status_code,
                'message': 'An error occurred',
                'details': response.data
            }
        }
        response.data = custom_response_data
        
        # Log the error
        logger.error(f"API Error: {exc}", exc_info=True)
    
    return response
```

#### 2. Pagination:
```python
# utils/pagination.py
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

#### 3. Filtering:
```python
# utils/filters.py
import django_filters
from .models import ExampleModel

class ExampleFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr='icontains')
    created_by = django_filters.NumberFilter()
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = ExampleModel
        fields = ['title', 'created_by', 'created_after', 'created_before']
```

### Database Development

#### 1. Model Relationships:
```python
# Complex model relationships
class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='projects')
    advisor = models.ForeignKey(Advisor, on_delete=models.CASCADE, related_name='advised_projects')
    status = models.CharField(max_length=50, choices=PROJECT_STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

class Milestone(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    description = models.TextField()
    due_date = models.DateTimeField()
    status = models.CharField(max_length=50, choices=MILESTONE_STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### 2. Custom Managers:
```python
# managers.py
from django.db import models

class ProjectManager(models.Manager):
    def active(self):
        return self.filter(status='active')
    
    def by_student(self, student):
        return self.filter(student=student)
    
    def by_advisor(self, advisor):
        return self.filter(advisor=advisor)
    
    def overdue(self):
        return self.filter(due_date__lt=timezone.now(), status='pending')
```

#### 3. Database Indexes:
```python
# models.py
class Project(models.Model):
    title = models.CharField(max_length=255, db_index=True)
    status = models.CharField(max_length=50, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['student', 'status']),
            models.Index(fields=['advisor', 'status']),
        ]
```

## 🔗 Frontend-Backend Integration

### API Integration Patterns

#### 1. Data Fetching:
```typescript
// Frontend data fetching
const useProjectData = (projectId: string) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/projects/${projectId}/`);
        setProject(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  return { project, loading, error };
};
```

#### 2. Real-time Updates:
```typescript
// WebSocket integration
import { useEffect, useState } from 'react';

const useRealtimeUpdates = (channel: string) => {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${channel}/`);
    
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
    };

    return () => ws.close();
  }, [channel]);

  return { data, connected };
};
```

#### 3. File Upload Integration:
```typescript
// File upload with progress
const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, projectId: string) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project', projectId);

      const response = await fetch(`/api/files/upload/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadFile, uploading, progress };
};
```

### Authentication Integration

#### 1. JWT Authentication:
```typescript
// Authentication hook
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      apiClient.get('/api/auth/me/')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/api/auth/login/', {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
};
```

#### 2. Protected Routes:
```typescript
// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};
```

## 🧪 Testing

### Frontend Testing

#### 1. Component Testing:
```typescript
// Component test
import { render, screen, fireEvent } from '@testing-library/react';
import { ExampleComponent } from './ExampleComponent';

describe('ExampleComponent', () => {
  it('renders title correctly', () => {
    render(<ExampleComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', () => {
    const mockAction = jest.fn();
    render(<ExampleComponent title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByText('Action'));
    expect(mockAction).toHaveBeenCalled();
  });
});
```

#### 2. Hook Testing:
```typescript
// Hook test
import { renderHook, act } from '@testing-library/react';
import { useExampleData } from './useExampleData';

describe('useExampleData', () => {
  it('fetches data on mount', async () => {
    const { result } = renderHook(() => useExampleData());
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
  });
});
```

### Backend Testing

#### 1. Model Testing:
```python
# Model test
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import ExampleModel

User = get_user_model()

class ExampleModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_model_creation(self):
        example = ExampleModel.objects.create(
            title='Test Title',
            description='Test Description',
            created_by=self.user
        )
        
        self.assertEqual(example.title, 'Test Title')
        self.assertEqual(example.created_by, self.user)
        self.assertIsNotNone(example.created_at)
```

#### 2. API Testing:
```python
# API test
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import ExampleModel

User = get_user_model()

class ExampleAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_example(self):
        url = reverse('example-list')
        data = {
            'title': 'Test Title',
            'description': 'Test Description'
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ExampleModel.objects.count(), 1)
    
    def test_list_examples(self):
        ExampleModel.objects.create(
            title='Test Title',
            description='Test Description',
            created_by=self.user
        )
        
        url = reverse('example-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
```

## 🚀 Deployment

### Development Deployment

#### 1. Local Development:
```bash
# Backend
cd backend
python manage.py runserver

# Frontend
cd frontend
npm run dev
```

#### 2. Docker Development:
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: final_project_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
  
  redis:
    image: redis:6
    ports:
      - "6379:6379"
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/final_project_management
      - REDIS_URL=redis://redis:6379/0
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

### Production Deployment

#### 1. Environment Configuration:
```bash
# .env.production
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DATABASE_URL=postgresql://user:password@localhost:5432/production_db
REDIS_URL=redis://localhost:6379/0
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

#### 2. Production Settings:
```python
# settings_production.py
import os
from .settings import *

DEBUG = False
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Database
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

# Security
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

## 📊 Performance Optimization

### Frontend Optimization

#### 1. Code Splitting:
```typescript
// Lazy loading components
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <LazyComponent />
  </Suspense>
);
```

#### 2. Memoization:
```typescript
// Memoized components
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true
    }));
  }, [data]);

  const handleAction = useCallback((id) => {
    onAction(id);
  }, [onAction]);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleAction(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
});
```

### Backend Optimization

#### 1. Database Optimization:
```python
# Query optimization
from django.db import models
from django.db.models import Prefetch

# Use select_related for foreign keys
projects = Project.objects.select_related('student', 'advisor').all()

# Use prefetch_related for many-to-many
projects = Project.objects.prefetch_related('milestones').all()

# Use only() to limit fields
projects = Project.objects.only('title', 'status').all()
```

#### 2. Caching:
```python
# Redis caching
from django.core.cache import cache

def get_project_data(project_id):
    cache_key = f'project_{project_id}'
    data = cache.get(cache_key)
    
    if data is None:
        data = Project.objects.get(id=project_id)
        cache.set(cache_key, data, 300)  # Cache for 5 minutes
    
    return data
```

## 🔒 Security

### Frontend Security

#### 1. Input Validation:
```typescript
// Input validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};
```

#### 2. XSS Prevention:
```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html);
};
```

### Backend Security

#### 1. Input Validation:
```python
# Serializer validation
from rest_framework import serializers

class ProjectSerializer(serializers.ModelSerializer):
    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long")
        return value
    
    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        return data
```

#### 2. Permission Classes:
```python
# Custom permissions
from rest_framework.permissions import BasePermission

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return obj.created_by == request.user
```

## 📈 Monitoring and Logging

### Frontend Monitoring

#### 1. Error Tracking:
```typescript
// Error boundary
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }

  public render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

### Backend Monitoring

#### 1. Logging Configuration:
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}
```

## 🎯 Best Practices

### Development Best Practices

#### 1. Code Organization:
- **Single Responsibility**: Each component/function should have one purpose
- **DRY Principle**: Don't repeat yourself
- **Consistent Naming**: Use clear, descriptive names
- **Documentation**: Comment complex logic

#### 2. Git Workflow:
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Create pull request
# Review and merge
```

#### 3. Testing Strategy:
- **Unit Tests**: Test individual functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user flows
- **Performance Tests**: Test system performance

### Deployment Best Practices

#### 1. Environment Management:
- **Separate Environments**: Development, staging, production
- **Environment Variables**: Use .env files
- **Secrets Management**: Never commit secrets
- **Configuration Management**: Use configuration files

#### 2. Monitoring:
- **Health Checks**: Monitor system health
- **Performance Metrics**: Track system performance
- **Error Tracking**: Monitor and log errors
- **User Analytics**: Track user behavior

---

## 🎉 Development Complete!

You now have a comprehensive understanding of the Frontend-Backend Integration development process. This system provides:

- ✅ **Complete Integration**: Frontend and Backend working seamlessly
- ✅ **Scalable Architecture**: Ready for growth and expansion
- ✅ **Best Practices**: Following industry standards
- ✅ **Security**: Comprehensive security measures
- ✅ **Performance**: Optimized for speed and efficiency
- ✅ **Maintainability**: Easy to maintain and extend

**Happy Coding!** 🚀💻
