#!/usr/bin/env python
"""Manually create a project for testing"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from accounts.models import User
from students.models import Student
from advisors.models import Advisor
from projects.models import Project, ProjectGroup, ProjectStudent

print("=" * 60)
print("MANUAL PROJECT CREATION TEST")
print("=" * 60)

# Get available students and advisor
students = Student.objects.filter(is_active=True)[:2]
advisor = Advisor.objects.first()

if not students.exists():
    print("ERROR: No active students found")
    exit(1)

if not advisor:
    print("ERROR: No advisor found")
    exit(1)

print(f"\n1. Selected Advisor: {advisor.user.get_full_name()}")
print(f"2. Selected Students:")
for student in students:
    print(f"   - {student.student_id}: {student.user.get_full_name()}")

# Create project
project_id = '2024-2025-P004'
print(f"\n3. Creating project: {project_id}")

# Check if project already exists
if Project.objects.filter(project_id=project_id).exists():
    print(f"   Project {project_id} already exists, skipping...")
    project = Project.objects.get(project_id=project_id)
else:
    project = Project.objects.create(
        project_id=project_id,
        title='E-Commerce Platform Development',
        description='Development of an e-commerce platform with payment integration',
        status='Pending',
        advisor=advisor
    )
    print(f"   [OK] Created Project: {project.project_id}")

# Create project group
if ProjectGroup.objects.filter(project_id=project_id).exists():
    print(f"   ProjectGroup {project_id} already exists, skipping...")
    project_group = ProjectGroup.objects.get(project_id=project_id)
else:
    project_group = ProjectGroup.objects.create(
        project_id=project_id,
        topic_lao='ການພັດທະນາແພລດຟອມອີຄອມເມີຊ',
        topic_eng='E-Commerce Platform Development',
        advisor_name=advisor.user.get_full_name(),
        status='Pending',
        comment='Test project created manually'
    )
    print(f"   [OK] Created ProjectGroup: {project_group.project_id}")

# Link students
print(f"\n4. Linking students to project...")
for student in students:
    ps, created = ProjectStudent.objects.get_or_create(
        project_group=project_group,
        student=student.user,
        defaults={'is_primary': students[0] == student if students else False}
    )
    if created:
        print(f"   [OK] Linked {student.student_id} to project")
    else:
        print(f"   Already linked: {student.student_id}")

# Verify
print(f"\n5. Verification:")
print(f"   Project: {project.project_id} - {project.title}")
print(f"   ProjectGroup: {project_group.project_id} - {project_group.topic_eng}")
print(f"   Students: {ProjectStudent.objects.filter(project_group=project_group).count()}")
print(f"   Advisor: {project.advisor.user.get_full_name() if project.advisor else 'N/A'}")

print("\n" + "=" * 60)
print("PROJECT CREATION COMPLETE")
print("=" * 60)

