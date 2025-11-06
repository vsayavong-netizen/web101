#!/usr/bin/env python
"""Quick script to check database data"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from accounts.models import User
from students.models import Student
from advisors.models import Advisor
from majors.models import Major
from classrooms.models import Classroom

print("=== DATABASE SUMMARY ===")
print(f"Users: {User.objects.count()}")
print(f"  - Students: {User.objects.filter(role='Student').count()}")
print(f"  - Advisors: {User.objects.filter(role='Advisor').count()}")
print(f"  - Dept Admins: {User.objects.filter(role='DepartmentAdmin').count()}")
print(f"  - Admins: {User.objects.filter(is_superuser=True).count()}")
print(f"Students: {Student.objects.count()}")
print(f"Advisors: {Advisor.objects.count()}")
print(f"Majors: {Major.objects.count()}")
print(f"Classrooms: {Classroom.objects.count()}")

print("\n=== SAMPLE DATA ===")
print("\nMajors:")
for major in Major.objects.all()[:5]:
    print(f"  - {major.name} ({major.abbreviation})")

print("\nClassrooms:")
for classroom in Classroom.objects.all()[:5]:
    print(f"  - {classroom.name} - {classroom.major.abbreviation}")

print("\nAdvisors:")
for advisor in Advisor.objects.all()[:5]:
    print(f"  - {advisor.user.get_full_name()} ({advisor.advisor_id})")

print("\nStudents:")
for student in Student.objects.all()[:5]:
    print(f"  - {student.student_id} - {student.user.get_full_name()}")

