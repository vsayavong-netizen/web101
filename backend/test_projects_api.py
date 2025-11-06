#!/usr/bin/env python
"""Test Projects API specifically"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Login
response = requests.post(
    f"{BASE_URL}/api/auth/login/",
    json={"username": "admin", "password": "admin123"}
)
token = response.json()['access']
headers = {"Authorization": f"Bearer {token}"}

# Test Projects API
print("Testing Projects API...")
response = requests.get(f"{BASE_URL}/api/projects/projects/", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code != 200:
    print(f"Error Response:")
    print(response.text[:1000])
else:
    data = response.json()
    print(f"Success! Count: {len(data) if isinstance(data, list) else data.get('count', 0)}")

