#!/usr/bin/env python
"""Check advisor specializations"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from advisors.models import Advisor, AdvisorSpecialization
from majors.models import Major

print("=" * 60)
print("ADVISOR SPECIALIZATIONS CHECK")
print("=" * 60)

advisors = Advisor.objects.all()
majors = Major.objects.all()

print(f"\nTotal Advisors: {advisors.count()}")
print(f"Total Majors: {majors.count()}")

print("\nAdvisor Specializations:")
for advisor in advisors:
    specs = AdvisorSpecialization.objects.filter(advisor=advisor)
    print(f"  {advisor.advisor_id} ({advisor.user.get_full_name()}): {specs.count()} specializations")
    for spec in specs:
        print(f"    - {spec.major} (Level: {spec.expertise_level})")

print("\n" + "=" * 60)
print("RECOMMENDATION:")
print("=" * 60)
if AdvisorSpecialization.objects.count() == 0:
    print("No specializations found. Creating default specializations...")
    for advisor in advisors:
        for major in majors:
            AdvisorSpecialization.objects.get_or_create(
                advisor=advisor,
                major=major.name,
                defaults={'expertise_level': 5}
            )
    print("Default specializations created!")
else:
    print("Specializations exist. System should work correctly.")

