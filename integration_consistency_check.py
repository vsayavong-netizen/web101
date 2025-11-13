#!/usr/bin/env python3
"""
Integration Consistency Check Script for BM23 System
Checks consistency between frontend and backend, models, serializers, URLs, etc.
"""

import os
import sys
import django
import json
import re
from pathlib import Path

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.urls import get_resolver
from django.conf import settings
from django.apps import apps


class ConsistencyChecker:
    """Check consistency across the system"""
    
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.checks_passed = []
        self.base_dir = Path(__file__).parent
        self.backend_dir = self.base_dir / 'backend'
        self.frontend_dir = self.base_dir / 'frontend'
    
    def log_issue(self, category, issue, severity='error'):
        """Log an issue"""
        if severity == 'error':
            self.issues.append(f"[{category}] {issue}")
        else:
            self.warnings.append(f"[{category}] {issue}")
        print(f"   {'❌' if severity == 'error' else '⚠️'} [{category}] {issue}")
    
    def log_success(self, category, message):
        """Log a successful check"""
        self.checks_passed.append(f"[{category}] {message}")
        print(f"   ✅ [{category}] {message}")
    
    def check_url_patterns(self):
        """Check URL patterns consistency"""
        print("\n" + "="*60)
        print("Checking URL Patterns")
        print("="*60)
        
        try:
            resolver = get_resolver()
            all_urls = []
            
            def extract_urls(url_patterns, prefix=''):
                for pattern in url_patterns:
                    if hasattr(pattern, 'url_patterns'):
                        extract_urls(pattern.url_patterns, prefix + str(pattern.pattern))
                    else:
                        all_urls.append(prefix + str(pattern.pattern))
            
            extract_urls(resolver.url_patterns)
            
            # Check for common API endpoints
            api_endpoints = [
                '/api/auth/login/',
                '/api/auth/token/refresh/',
                '/api/projects/projects/',
                '/api/students/',
                '/api/advisors/',
                '/api/notifications/',
            ]
            
            for endpoint in api_endpoints:
                # Check if endpoint exists (simplified check)
                found = any(endpoint.replace('/', '') in url.replace('/', '') for url in all_urls)
                if found:
                    self.log_success('URL Patterns', f'Endpoint exists: {endpoint}')
                else:
                    self.log_issue('URL Patterns', f'Endpoint not found: {endpoint}', 'warning')
        
        except Exception as e:
            self.log_issue('URL Patterns', f'Error checking URLs: {str(e)}')
    
    def check_models_serializers(self):
        """Check models and serializers consistency"""
        print("\n" + "="*60)
        print("Checking Models and Serializers")
        print("="*60)
        
        try:
            # Check Project model and serializer
            from projects.models import Project, ProjectGroup
            from projects.serializers import ProjectSerializer
            
            # Check if serializer fields match model fields
            serializer_fields = ProjectSerializer().fields.keys()
            model_fields = [f.name for f in Project._meta.get_fields()]
            
            # Check common fields
            common_fields = ['project_id', 'status', 'created_at', 'updated_at']
            for field in common_fields:
                if field in serializer_fields or field in model_fields:
                    self.log_success('Models/Serializers', f'Field exists: {field}')
                else:
                    self.log_issue('Models/Serializers', f'Field missing: {field}', 'warning')
        
        except Exception as e:
            self.log_issue('Models/Serializers', f'Error checking models/serializers: {str(e)}')
    
    def check_frontend_backend_api(self):
        """Check frontend-backend API consistency"""
        print("\n" + "="*60)
        print("Checking Frontend-Backend API Consistency")
        print("="*60)
        
        try:
            # Read frontend API client
            api_client_path = self.frontend_dir / 'utils' / 'apiClient.ts'
            if api_client_path.exists():
                with open(api_client_path, 'r', encoding='utf-8') as f:
                    api_client_content = f.read()
                
                # Check for API endpoints in frontend
                api_endpoints = [
                    '/api/auth/login/',
                    '/api/auth/token/refresh/',
                    '/api/projects/',
                    '/api/students/',
                    '/api/advisors/',
                    '/api/notifications/',
                ]
                
                for endpoint in api_endpoints:
                    if endpoint in api_client_content:
                        self.log_success('Frontend-Backend', f'API endpoint found in frontend: {endpoint}')
                    else:
                        self.log_issue('Frontend-Backend', f'API endpoint not found in frontend: {endpoint}', 'warning')
            else:
                self.log_issue('Frontend-Backend', 'API client file not found', 'warning')
        
        except Exception as e:
            self.log_issue('Frontend-Backend', f'Error checking frontend-backend: {str(e)}')
    
    def check_error_handling(self):
        """Check error handling consistency"""
        print("\n" + "="*60)
        print("Checking Error Handling")
        print("="*60)
        
        try:
            # Check backend error handling
            from projects.views import ProjectViewSet
            from authentication.views import CustomTokenObtainPairView
            
            # Check if views have proper error handling
            views_to_check = [
                ('ProjectViewSet', ProjectViewSet),
                ('CustomTokenObtainPairView', CustomTokenObtainPairView),
            ]
            
            for view_name, view_class in views_to_check:
                # Check for try-except blocks (simplified)
                view_file = Path(view_class.__module__.replace('.', '/') + '.py')
                view_path = self.backend_dir / view_file
                
                if view_path.exists():
                    with open(view_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    if 'try:' in content and 'except' in content:
                        self.log_success('Error Handling', f'{view_name} has error handling')
                    else:
                        self.log_issue('Error Handling', f'{view_name} may lack error handling', 'warning')
        
        except Exception as e:
            self.log_issue('Error Handling', f'Error checking error handling: {str(e)}')
    
    def check_permissions(self):
        """Check permissions consistency"""
        print("\n" + "="*60)
        print("Checking Permissions")
        print("="*60)
        
        try:
            from projects.views import ProjectViewSet
            from students.views import StudentListView
            
            # Check if views have permission classes
            views_to_check = [
                ('ProjectViewSet', ProjectViewSet),
                ('StudentListView', StudentListView),
            ]
            
            for view_name, view_class in views_to_check:
                if hasattr(view_class, 'permission_classes'):
                    perms = view_class.permission_classes
                    if perms:
                        self.log_success('Permissions', f'{view_name} has permission classes: {[p.__name__ for p in perms]}')
                    else:
                        self.log_issue('Permissions', f'{view_name} has empty permission classes', 'warning')
                else:
                    self.log_issue('Permissions', f'{view_name} missing permission_classes', 'warning')
        
        except Exception as e:
            self.log_issue('Permissions', f'Error checking permissions: {str(e)}')
    
    def check_data_consistency(self):
        """Check data consistency"""
        print("\n" + "="*60)
        print("Checking Data Consistency")
        print("="*60)
        
        try:
            # Check Project and ProjectGroup relationship
            from projects.models import Project, ProjectGroup
            
            # Check if models are properly related
            if hasattr(Project, 'project_id'):
                self.log_success('Data Consistency', 'Project model has project_id field')
            else:
                self.log_issue('Data Consistency', 'Project model missing project_id field')
            
            if hasattr(ProjectGroup, 'project_id'):
                self.log_success('Data Consistency', 'ProjectGroup model has project_id field')
            else:
                self.log_issue('Data Consistency', 'ProjectGroup model missing project_id field')
            
            # Check LogEntry relationship
            from projects.models import LogEntry
            if hasattr(LogEntry, 'project'):
                self.log_success('Data Consistency', 'LogEntry has project relationship')
            else:
                self.log_issue('Data Consistency', 'LogEntry missing project relationship')
        
        except Exception as e:
            self.log_issue('Data Consistency', f'Error checking data consistency: {str(e)}')
    
    def check_imports(self):
        """Check import consistency"""
        print("\n" + "="*60)
        print("Checking Imports")
        print("="*60)
        
        try:
            # Check critical files for import issues
            critical_files = [
                'backend/projects/views.py',
                'backend/projects/serializers.py',
                'backend/students/views.py',
                'backend/authentication/views.py',
            ]
            
            for file_path in critical_files:
                full_path = self.base_dir / file_path
                if full_path.exists():
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Check for common import issues
                    if 'from .models import' in content or 'from projects.models import' in content:
                        self.log_success('Imports', f'{file_path} has proper model imports')
                    else:
                        self.log_issue('Imports', f'{file_path} may have import issues', 'warning')
        
        except Exception as e:
            self.log_issue('Imports', f'Error checking imports: {str(e)}')
    
    def check_code_quality(self):
        """Check code quality"""
        print("\n" + "="*60)
        print("Checking Code Quality")
        print("="*60)
        
        try:
            # Check for common code quality issues
            critical_files = [
                'backend/projects/views.py',
                'backend/projects/serializers.py',
            ]
            
            for file_path in critical_files:
                full_path = self.base_dir / file_path
                if full_path.exists():
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Check for TODO/FIXME
                    if 'TODO' in content or 'FIXME' in content:
                        todo_count = content.count('TODO') + content.count('FIXME')
                        self.log_issue('Code Quality', f'{file_path} has {todo_count} TODO/FIXME comments', 'warning')
                    
                    # Check for proper docstrings
                    if 'def ' in content:
                        functions = re.findall(r'def\s+(\w+)', content)
                        docstring_count = content.count('"""')
                        if docstring_count >= len(functions) * 0.5:  # At least 50% have docstrings
                            self.log_success('Code Quality', f'{file_path} has good docstring coverage')
                        else:
                            self.log_issue('Code Quality', f'{file_path} may need more docstrings', 'warning')
        
        except Exception as e:
            self.log_issue('Code Quality', f'Error checking code quality: {str(e)}')
    
    def run_all_checks(self):
        """Run all consistency checks"""
        print("\n" + "="*60)
        print("BM23 System Consistency Check")
        print("="*60)
        
        self.check_url_patterns()
        self.check_models_serializers()
        self.check_frontend_backend_api()
        self.check_error_handling()
        self.check_permissions()
        self.check_data_consistency()
        self.check_imports()
        self.check_code_quality()
        
        # Print summary
        self.print_summary()
        
        return len(self.issues) == 0
    
    def print_summary(self):
        """Print check summary"""
        print("\n" + "="*60)
        print("Consistency Check Summary")
        print("="*60)
        
        print(f"\n✅ Checks Passed: {len(self.checks_passed)}")
        print(f"❌ Issues Found: {len(self.issues)}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        
        if self.issues:
            print("\n❌ Critical Issues:")
            for issue in self.issues:
                print(f"  - {issue}")
        
        if self.warnings:
            print("\n⚠️  Warnings:")
            for warning in self.warnings[:10]:  # Show first 10
                print(f"  - {warning}")
            if len(self.warnings) > 10:
                print(f"  ... and {len(self.warnings) - 10} more warnings")
        
        print("\n" + "="*60)
        
        if len(self.issues) == 0:
            print("✅ All Critical Checks Passed!")
        else:
            print("❌ Some Issues Found - Review Required")
        print("="*60)


if __name__ == '__main__':
    checker = ConsistencyChecker()
    success = checker.run_all_checks()
    sys.exit(0 if success else 1)
