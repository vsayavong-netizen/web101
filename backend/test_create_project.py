#!/usr/bin/env python
"""Test creating a new project via API"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Login
print("1. Logging in...")
response = requests.post(
    f"{BASE_URL}/api/auth/login/",
    json={"username": "admin", "password": "admin123"}
)
if response.status_code != 200:
    print(f"   ERROR: Login failed - {response.status_code}")
    exit(1)

token = response.json()['access']
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
print("   [OK] Login successful")

# Get available students and advisors
print("\n2. Fetching available data...")
students_res = requests.get(f"{BASE_URL}/api/students/", headers=headers)
advisors_res = requests.get(f"{BASE_URL}/api/advisors/", headers=headers)

if students_res.status_code == 200:
    students = students_res.json()
    if isinstance(students, dict) and 'results' in students:
        students = students['results']
    print(f"   [OK] Found {len(students)} students")
    student_ids = [s.get('student_id', '') for s in students[:2] if s.get('student_id')]
else:
    print(f"   ERROR: Failed to get students - {students_res.status_code}")
    student_ids = []

if advisors_res.status_code == 200:
    advisors = advisors_res.json()
    if isinstance(advisors, dict) and 'results' in advisors:
        advisors = advisors['results']
    print(f"   [OK] Found {len(advisors)} advisors")
    advisor_id = advisors[0].get('id') if advisors else None
else:
    print(f"   ERROR: Failed to get advisors - {advisors_res.status_code}")
    advisor_id = None

# Create new project
print("\n3. Creating new project...")
# Get advisor ID
advisor_id = None
if advisors:
    advisor_id = advisors[0].get('id')

new_project_data = {
    "title": "Information Management System for Retail Stores",
    "description": "Development of an information management system for retail stores",
    "status": "Pending",
    "advisor": advisor_id,
    "topic_lao": "ການພັດທະນາລະບົບຈັດການຂໍ້ມູນສໍາລັບຮ້ານຄ້າ",
    "topic_eng": "Information Management System for Retail Stores",
    "advisor_name": "Ms. Souphap",
    "comment": "Test project created via API",
    "student_ids": student_ids[:2] if len(student_ids) >= 2 else student_ids,
    "academic_year": "2024-2025"
}

# Try to create via ProjectGroup endpoint first (if exists)
print(f"   Project data: {json.dumps(new_project_data, indent=2)}")

# Check if we can create via projects endpoint
create_response = requests.post(
    f"{BASE_URL}/api/projects/projects/",
    headers=headers,
    json=new_project_data
)

print(f"\n4. Create Project Response:")
print(f"   Status: {create_response.status_code}")
if create_response.status_code == 201:
    print("   [OK] Project created successfully!")
    project_data = create_response.json()
    print(f"   Project ID: {project_data.get('project_id', 'N/A')}")
    print(f"   Title: {project_data.get('topic_eng', project_data.get('title', 'N/A'))}")
elif create_response.status_code == 400:
    print("   [ERROR] Bad Request:")
    print(f"   {create_response.text[:500]}")
elif create_response.status_code == 500:
    print("   [ERROR] Server Error:")
    print(f"   {create_response.text[:500]}")
else:
    print(f"   Response: {create_response.text[:500]}")

# Verify project was created
print("\n5. Verifying project creation...")
projects_res = requests.get(f"{BASE_URL}/api/projects/projects/", headers=headers)
if projects_res.status_code == 200:
    projects = projects_res.json()
    if isinstance(projects, dict) and 'results' in projects:
        projects = projects['results']
    elif isinstance(projects, dict) and 'count' in projects:
        projects = projects.get('results', [])
    print(f"   [OK] Total projects: {len(projects)}")
    if projects:
        print(f"   Latest project: {projects[0].get('project_id', 'N/A')}")
else:
    print(f"   [ERROR] Failed to verify: {projects_res.status_code}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)

