"""
Test script for Settings API endpoints
Run this script to test the app-settings API endpoints
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/settings"

# Test credentials (adjust as needed)
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin123"

def get_auth_token():
    """Get authentication token"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login/",
            json={
                "username": TEST_USERNAME,
                "password": TEST_PASSWORD
            }
        )
        if response.status_code == 200:
            data = response.json()
            return data.get('access') or data.get('token')
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(response.text)
            return None
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure Django server is running.")
        return None
    except Exception as e:
        print(f"❌ Error during login: {e}")
        return None

def test_get_setting(token, setting_type, academic_year="2024"):
    """Test GET endpoint"""
    url = f"{API_BASE}/app-settings/{setting_type}/{academic_year}/"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n📥 Testing GET {setting_type} for {academic_year}...")
    try:
        response = requests.get(url, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"   Value: {json.dumps(data.get('value'), indent=2)[:200]}...")
            return True
        elif response.status_code == 404:
            print(f"   ⚠️  Setting not found (this is OK for new settings)")
            return True
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def test_create_setting(token, setting_type, value, academic_year="2024"):
    """Test POST endpoint"""
    url = f"{API_BASE}/app-settings/{setting_type}/{academic_year}/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"value": value}
    
    print(f"\n📤 Testing POST {setting_type} for {academic_year}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"   Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"   ✅ Success! Created: {data.get('created', False)}")
            return True
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def test_update_setting(token, setting_type, value, academic_year="2024"):
    """Test PUT endpoint"""
    url = f"{API_BASE}/app-settings/{setting_type}/{academic_year}/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"value": value}
    
    print(f"\n🔄 Testing PUT {setting_type} for {academic_year}...")
    try:
        response = requests.put(url, headers=headers, json=payload)
        print(f"   Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            print(f"   ✅ Success!")
            return True
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def test_delete_setting(token, setting_type, academic_year="2024"):
    """Test DELETE endpoint"""
    url = f"{API_BASE}/app-settings/{setting_type}/{academic_year}/"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n🗑️  Testing DELETE {setting_type} for {academic_year}...")
    try:
        response = requests.delete(url, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"   ✅ Success!")
            return True
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 Testing Settings API Endpoints")
    print("=" * 60)
    
    # Get authentication token
    print("\n🔐 Authenticating...")
    token = get_auth_token()
    if not token:
        print("\n❌ Authentication failed. Exiting.")
        sys.exit(1)
    print("✅ Authentication successful!")
    
    # Test data
    test_milestone_templates = [
        {
            "id": "TPL01",
            "name": "Standard 5-Chapter Final Project",
            "description": "A standard template for research-based projects",
            "tasks": [
                {"id": "TSK01", "name": "Chapter 1: Introduction", "durationDays": 30},
                {"id": "TSK02", "name": "Chapter 2: Literature Review", "durationDays": 30}
            ]
        }
    ]
    
    test_announcements = [
        {
            "id": "ANN01",
            "title": "Welcome to the New Academic Year!",
            "content": "Welcome everyone to the **2024 academic year**.",
            "audience": "All",
            "authorName": "Admin"
        }
    ]
    
    test_defense_settings = {
        "startDefenseDate": "2024-12-01",
        "timeSlots": "09:00-10:00,10:15-11:15,13:00-14:00,14:15-15:15",
        "rooms": ["Room A", "Room B"],
        "stationaryAdvisors": {},
        "timezone": "Asia/Bangkok"
    }
    
    test_scoring_settings = {
        "mainAdvisorWeight": 60,
        "committeeWeight": 40,
        "gradeBoundaries": [],
        "advisorRubrics": [],
        "committeeRubrics": []
    }
    
    academic_year = "2024"
    results = []
    
    # Test each setting type
    test_cases = [
        ("milestone_templates", test_milestone_templates),
        ("announcements", test_announcements),
        ("defense_settings", test_defense_settings),
        ("scoring_settings", test_scoring_settings),
    ]
    
    for setting_type, test_value in test_cases:
        print(f"\n{'=' * 60}")
        print(f"Testing: {setting_type}")
        print(f"{'=' * 60}")
        
        # Test GET (before creation)
        result1 = test_get_setting(token, setting_type, academic_year)
        
        # Test POST (create)
        result2 = test_create_setting(token, setting_type, test_value, academic_year)
        
        # Test GET (after creation)
        result3 = test_get_setting(token, setting_type, academic_year)
        
        # Test PUT (update)
        if isinstance(test_value, dict):
            updated_value = {**test_value, "updated": True}
        else:
            updated_value = test_value + [{"id": "UPDATED", "name": "Updated Item"}]
        result4 = test_update_setting(token, setting_type, updated_value, academic_year)
        
        # Test GET (after update)
        result5 = test_get_setting(token, setting_type, academic_year)
        
        # Optional: Test DELETE (comment out if you want to keep data)
        # result6 = test_delete_setting(token, setting_type, academic_year)
        
        results.append({
            "setting_type": setting_type,
            "get_before": result1,
            "create": result2,
            "get_after_create": result3,
            "update": result4,
            "get_after_update": result5,
        })
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    for result in results:
        print(f"\n{result['setting_type']}:")
        print(f"  GET (before):     {'✅' if result['get_before'] else '❌'}")
        print(f"  CREATE:           {'✅' if result['create'] else '❌'}")
        print(f"  GET (after):      {'✅' if result['get_after_create'] else '❌'}")
        print(f"  UPDATE:           {'✅' if result['update'] else '❌'}")
        print(f"  GET (after upd):  {'✅' if result['get_after_update'] else '❌'}")
    
    # Overall result
    all_passed = all(
        r['create'] and r['get_after_create'] and r['update'] and r['get_after_update']
        for r in results
    )
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the output above.")
    print("=" * 60)

if __name__ == "__main__":
    main()

