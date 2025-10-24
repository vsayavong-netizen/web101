#!/usr/bin/env python
import os
import django
from django.core.management import execute_from_command_line

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.contrib.auth.models import User
from accounts.models import User as CustomUser

# Create admin user
admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@example.com',
        'first_name': 'Admin',
        'last_name': 'User',
        'is_active': True,
        'is_staff': True,
        'is_superuser': True
    }
)

if created:
    admin_user.set_password('admin123')
    admin_user.save()
    print("Admin user created successfully!")
else:
    print("Admin user already exists!")

# Create Custom User for admin
custom_admin, created = CustomUser.objects.get_or_create(
    user=admin_user,
    defaults={
        'role': 'Admin',
        'is_active': True
    }
)

if created:
    print("Custom admin user created successfully!")
else:
    print("Custom admin user already exists!")

print("Admin credentials: admin / admin123")
