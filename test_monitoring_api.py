"""
Test script for Monitoring API endpoints
Run this script to test the monitoring API
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/monitoring"

# Test credentials
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

def test_health_check():
    """Test health check endpoint (public)"""
    print("\n" + "=" * 60)
    print("🧪 Testing Health Check Endpoint")
    print("=" * 60)
    
    url = f"{API_BASE}/health/"
    print(f"\n📥 Testing GET {url}...")
    
    try:
        response = requests.get(url)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"   Status: {data.get('status')}")
            print(f"   Database: {data.get('checks', {}).get('database')}")
            print(f"   Cache: {data.get('checks', {}).get('cache')}")
            print(f"   Redis: {data.get('checks', {}).get('redis')}")
            if data.get('system'):
                print(f"   Disk Usage: {data.get('system', {}).get('disk_usage')}%")
                print(f"   Memory Usage: {data.get('system', {}).get('memory_usage')}%")
                print(f"   CPU Usage: {data.get('system', {}).get('cpu_usage')}%")
            return True
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def test_system_metrics(token):
    """Test system metrics endpoint (admin)"""
    print("\n" + "=" * 60)
    print("🧪 Testing System Metrics Endpoint")
    print("=" * 60)
    
    url = f"{API_BASE}/system-metrics/?hours=24"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"\n📥 Testing GET {url}...")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success!")
            print(f"   Period: {data.get('period_hours')} hours")
            print(f"   Metrics: {len(data.get('metrics', {}))} types")
            print(f"   Total Requests: {data.get('requests', {}).get('total_requests', 0)}")
            print(f"   Total Errors: {data.get('errors', {}).get('total_errors', 0)}")
            return True
        elif response.status_code == 403:
            print(f"   ⚠️  Permission denied (need admin access)")
            return False
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def test_request_logs(token):
    """Test request logs endpoint (admin)"""
    print("\n" + "=" * 60)
    print("🧪 Testing Request Logs Endpoint")
    print("=" * 60)
    
    url = f"{API_BASE}/request-logs/"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"\n📥 Testing GET {url}...")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logs = data.get('results', data) if isinstance(data, dict) else data
            print(f"   ✅ Success!")
            print(f"   Total Logs: {len(logs) if isinstance(logs, list) else 'N/A'}")
            if isinstance(logs, list) and len(logs) > 0:
                print(f"   Latest: {logs[0].get('method')} {logs[0].get('path')} - {logs[0].get('status_code')}")
            return True
        elif response.status_code == 403:
            print(f"   ⚠️  Permission denied (need admin access)")
            return False
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def test_error_logs(token):
    """Test error logs endpoint (admin)"""
    print("\n" + "=" * 60)
    print("🧪 Testing Error Logs Endpoint")
    print("=" * 60)
    
    url = f"{API_BASE}/error-logs/"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"\n📥 Testing GET {url}...")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logs = data.get('results', data) if isinstance(data, dict) else data
            print(f"   ✅ Success!")
            print(f"   Total Errors: {len(logs) if isinstance(logs, list) else 'N/A'}")
            if isinstance(logs, list) and len(logs) > 0:
                unresolved = [log for log in logs if not log.get('resolved', False)]
                print(f"   Unresolved: {len(unresolved)}")
            return True
        elif response.status_code == 403:
            print(f"   ⚠️  Permission denied (need admin access)")
            return False
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def test_performance_metrics(token):
    """Test performance metrics endpoint (admin)"""
    print("\n" + "=" * 60)
    print("🧪 Testing Performance Metrics Endpoint")
    print("=" * 60)
    
    url = f"{API_BASE}/performance/"
    headers = {"Authorization": f"Bearer {token}"}
    print(f"\n📥 Testing GET {url}...")
    
    try:
        response = requests.get(url, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            metrics = data.get('results', data) if isinstance(data, dict) else data
            print(f"   ✅ Success!")
            print(f"   Total Metrics: {len(metrics) if isinstance(metrics, list) else 'N/A'}")
            if isinstance(metrics, list) and len(metrics) > 0:
                avg_time = sum(m.get('response_time', 0) for m in metrics) / len(metrics)
                print(f"   Average Response Time: {avg_time:.2f}ms")
            return True
        elif response.status_code == 403:
            print(f"   ⚠️  Permission denied (need admin access)")
            return False
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 Testing Monitoring API Endpoints")
    print("=" * 60)
    
    # Test health check (no auth required)
    health_result = test_health_check()
    
    # Get authentication token for admin endpoints
    print("\n🔐 Authenticating...")
    token = get_auth_token()
    if not token:
        print("\n⚠️  Authentication failed. Skipping admin endpoint tests.")
        print("✅ Health check test completed!")
        sys.exit(0)
    print("✅ Authentication successful!")
    
    # Test admin endpoints
    results = []
    results.append(('Health Check', health_result))
    results.append(('System Metrics', test_system_metrics(token)))
    results.append(('Request Logs', test_request_logs(token)))
    results.append(('Error Logs', test_error_logs(token)))
    results.append(('Performance Metrics', test_performance_metrics(token)))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name:30} {status}")
    
    all_passed = all(result for _, result in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the output above.")
    print("=" * 60)

if __name__ == "__main__":
    main()

