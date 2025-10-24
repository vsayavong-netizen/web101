#!/usr/bin/env python3
"""
Script to start Django server and run login tests
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_server_running(url, timeout=5):
    """Check if server is running"""
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code == 200
    except:
        return False

def start_django_server():
    """Start Django server"""
    print("Starting Django server...")
    
    # Change to backend directory
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    # Start Django server in background
    try:
        process = subprocess.Popen([
            sys.executable, "manage.py", "runserver", "8000"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for server to start
        print("Waiting for Django server to start...")
        time.sleep(5)
        
        # Check if server is running
        if check_server_running("http://localhost:8000"):
            print("Django server started successfully")
            return process
        else:
            print("Django server failed to start")
            process.terminate()
            return None
            
    except Exception as e:
        print(f"Error starting Django server: {e}")
        return None

def run_login_tests():
    """Run login tests"""
    print("\nRunning login tests...")
    
    # Change to backend directory
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    try:
        # Run test script
        result = subprocess.run([
            sys.executable, "test_login_english.py"
        ], capture_output=True, text=True)
        
        print("Test Results:")
        print(result.stdout)
        
        if result.stderr:
            print("Test Errors:")
            print(result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"Error running tests: {e}")
        return False

def main():
    """Main function"""
    print("Automated Test for Real Login from Frontend")
    print("=" * 60)
    
    django_process = None
    
    try:
        # Check if server is already running
        if check_server_running("http://localhost:8000"):
            print("Django server is already running")
        else:
            # Start Django server
            django_process = start_django_server()
            if not django_process:
                print("Cannot start Django server")
                return False
        
        # Wait for server to be ready
        print("Waiting for server to be ready...")
        time.sleep(3)
        
        # Run tests
        success = run_login_tests()
        
        # Print results
        print("\n" + "=" * 60)
        print("Test Results Summary")
        print("=" * 60)
        
        if success:
            print("All tests passed!")
        else:
            print("Some tests failed")
        
        return success
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
        return False
        
    except Exception as e:
        print(f"\nError during testing: {e}")
        return False
        
    finally:
        # Stop Django server if we started it
        if django_process:
            print("Stopping Django server...")
            django_process.terminate()
            django_process.wait()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
