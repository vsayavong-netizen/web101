#!/usr/bin/env python
"""Create specializations for all advisors and majors"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from advisors.models import Advisor, AdvisorSpecialization
from majors.models import Major

print("=" * 60)
print("CREATING ADVISOR SPECIALIZATIONS")
print("=" * 60)

advisors = Advisor.objects.all()
majors = Major.objects.all()

print(f"\nAdvisors: {advisors.count()}")
print(f"Majors: {majors.count()}")

created = 0
for advisor in advisors:
    for major in majors:
        spec, new = AdvisorSpecialization.objects.get_or_create(
            advisor=advisor,
            major=major.name,
            defaults={'expertise_level': 5}
        )
        if new:
            created += 1
            print(f"  Created: {advisor.advisor_id} -> {major.name}")

print(f"\n{'=' * 60}")
print(f"Created {created} new specializations")
print(f"Total specializations: {AdvisorSpecialization.objects.count()}")
print("=" * 60)

