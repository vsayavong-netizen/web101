#!/usr/bin/env python
"""
Simple script to create Django superuser non-interactively
"""
import os
import sys
import django

# Add backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_superuser():
    username = 'admin'
    email = 'admin@example.com'
    password = 'admin123'
    
    if User.objects.filter(username=username).exists():
        print(f'[WARNING] User "{username}" already exists!')
        user = User.objects.get(username=username)
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()
        print(f'[SUCCESS] Updated existing user "{username}" to superuser')
    else:
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print(f'[SUCCESS] Created superuser "{username}"')
    
    print(f'\nLogin credentials:')
    print(f'   Username: {username}')
    print(f'   Password: {password}')
    print(f'   Email: {email}')

if __name__ == '__main__':
    create_superuser()

