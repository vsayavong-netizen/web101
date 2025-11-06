#!/usr/bin/env python
"""Comprehensive data check script"""
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
from majors.models import Major
from classrooms.models import Classroom

print("=" * 60)
print("COMPREHENSIVE DATABASE CHECK")
print("=" * 60)

# Users
print(f"\n1. USERS: {User.objects.count()}")
print(f"   - Students: {User.objects.filter(role='Student').count()}")
print(f"   - Advisors: {User.objects.filter(role='Advisor').count()}")
print(f"   - Dept Admins: {User.objects.filter(role='DepartmentAdmin').count()}")
print(f"   - Admins: {User.objects.filter(role='Admin').count()}")

# Students
print(f"\n2. STUDENTS: {Student.objects.count()}")
for student in Student.objects.all()[:5]:
    print(f"   - {student.student_id}: {student.user.get_full_name()} ({student.major})")

# Advisors
print(f"\n3. ADVISORS: {Advisor.objects.count()}")
for advisor in Advisor.objects.all():
    print(f"   - {advisor.advisor_id}: {advisor.user.get_full_name()} (Dept Admin: {advisor.is_department_admin})")

# Majors
print(f"\n4. MAJORS: {Major.objects.count()}")
for major in Major.objects.all():
    print(f"   - {major.name} ({major.abbreviation})")

# Classrooms
print(f"\n5. CLASSROOMS: {Classroom.objects.count()}")
for classroom in Classroom.objects.all()[:5]:
    print(f"   - {classroom.name} - {classroom.major.abbreviation} ({classroom.academic_year})")

# Projects
print(f"\n6. PROJECTS: {Project.objects.count()}")
for project in Project.objects.all():
    print(f"   - {project.project_id}: {project.title}")
    if project.advisor:
        print(f"     Advisor: {project.advisor.user.get_full_name()}")
    print(f"     Status: {project.status}")

# Project Groups
print(f"\n7. PROJECT GROUPS: {ProjectGroup.objects.count()}")
for pg in ProjectGroup.objects.all():
    print(f"   - {pg.project_id}: {pg.topic_eng[:50]}")
    print(f"     Status: {pg.status}")
    print(f"     Advisor: {pg.advisor_name}")

# Project Students
print(f"\n8. PROJECT-STUDENT LINKS: {ProjectStudent.objects.count()}")
for ps in ProjectStudent.objects.all():
    print(f"   - {ps.project_group.project_id} <-> {ps.student.get_full_name()} (Primary: {ps.is_primary})")

print("\n" + "=" * 60)
print("CHECK COMPLETE")
print("=" * 60)

