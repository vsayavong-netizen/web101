#!/usr/bin/env python
"""Test frontend-backend integration"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("FRONTEND-BACKEND INTEGRATION TEST")
print("=" * 60)

# Login
print("\n1. Authentication Test...")
response = requests.post(
    f"{BASE_URL}/api/auth/login/",
    json={"username": "admin", "password": "admin123"}
)
if response.status_code != 200:
    print(f"   [ERROR] Login failed: {response.status_code}")
    exit(1)

token = response.json()['access']
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
print("   [OK] Login successful")

# Test all endpoints that frontend uses
print("\n2. Testing API Endpoints Used by Frontend...")

endpoints = [
    ("/api/students/", "Students"),
    ("/api/advisors/", "Advisors"),
    ("/api/majors/", "Majors"),
    ("/api/classrooms/", "Classrooms"),
    ("/api/projects/projects/", "Projects"),
]

results = {}
for endpoint, name in endpoints:
    try:
        res = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, list):
                count = len(data)
            elif isinstance(data, dict) and 'results' in data:
                count = len(data['results'])
            elif isinstance(data, dict) and 'count' in data:
                count = data['count']
            else:
                count = 0
            results[name] = {"status": "OK", "count": count}
            print(f"   [OK] {name}: {count} items")
        else:
            results[name] = {"status": "ERROR", "code": res.status_code}
            print(f"   [ERROR] {name}: Status {res.status_code}")
    except Exception as e:
        results[name] = {"status": "ERROR", "error": str(e)}
        print(f"   [ERROR] {name}: {str(e)[:50]}")

# Test project data structure
print("\n3. Testing Project Data Structure...")
try:
    res = requests.get(f"{BASE_URL}/api/projects/projects/", headers=headers)
    if res.status_code == 200:
        projects = res.json()
        if isinstance(projects, list) and len(projects) > 0:
            project = projects[0]
            print(f"   [OK] Sample project structure:")
            print(f"      - project_id: {project.get('project_id', 'N/A')}")
            print(f"      - topic_eng: {project.get('topic_eng', 'N/A')}")
            print(f"      - student_count: {project.get('student_count', 'N/A')}")
            print(f"      - status: {project.get('status', 'N/A')}")
        elif isinstance(projects, dict) and 'results' in projects and len(projects['results']) > 0:
            project = projects['results'][0]
            print(f"   [OK] Sample project structure:")
            print(f"      - project_id: {project.get('project_id', 'N/A')}")
            print(f"      - topic_eng: {project.get('topic_eng', 'N/A')}")
        else:
            print(f"   [INFO] No projects found")
    else:
        print(f"   [ERROR] Failed to get projects: {res.status_code}")
except Exception as e:
    print(f"   [ERROR] Exception: {str(e)[:100]}")

# Summary
print("\n" + "=" * 60)
print("INTEGRATION TEST SUMMARY")
print("=" * 60)
for name, result in results.items():
    status = result.get('status', 'UNKNOWN')
    if status == "OK":
        print(f"   {name}: OK ({result.get('count', 0)} items)")
    else:
        print(f"   {name}: ERROR")
print("=" * 60)

