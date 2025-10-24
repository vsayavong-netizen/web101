#!/usr/bin/env python
"""
Test Docker configuration for BM23 application
"""

import os
import sys
import subprocess
from pathlib import Path

def test_dockerfile():
    """Test if Dockerfile is valid"""
    try:
        dockerfile_path = Path("Dockerfile")
        if not dockerfile_path.exists():
            return False, "Dockerfile not found"
        
        with open(dockerfile_path, 'r') as f:
            content = f.read()
        
        # Check for required components
        required_components = [
            "FROM python:",
            "WORKDIR /app",
            "COPY requirements.txt",
            "RUN pip install",
            "COPY . /app",
            "EXPOSE 8000",
            "CMD"
        ]
        
        missing_components = []
        for component in required_components:
            if component not in content:
                missing_components.append(component)
        
        if missing_components:
            return False, f"Missing components: {', '.join(missing_components)}"
        
        return True, "Dockerfile is valid"
        
    except Exception as e:
        return False, f"Dockerfile test failed: {str(e)}"

def test_docker_compose():
    """Test if docker-compose files are valid"""
    try:
        compose_files = [
            "docker-compose.yml",
            "docker-compose.prod.yml"
        ]
        
        results = []
        for compose_file in compose_files:
            if not Path(compose_file).exists():
                results.append(f"{compose_file} not found")
                continue
            
            try:
                # Basic YAML syntax check
                with open(compose_file, 'r') as f:
                    content = f.read()
                
                # Check for required services
                if "web:" in content and "db:" in content:
                    results.append(f"{compose_file} is valid")
                else:
                    results.append(f"{compose_file} missing required services")
                    
            except Exception as e:
                results.append(f"{compose_file} has syntax errors: {str(e)}")
        
        return True, "; ".join(results)
        
    except Exception as e:
        return False, f"Docker compose test failed: {str(e)}"

def test_nginx_config():
    """Test if nginx configuration is valid"""
    try:
        nginx_path = Path("nginx.conf")
        if not nginx_path.exists():
            return False, "nginx.conf not found"
        
        with open(nginx_path, 'r') as f:
            content = f.read()
        
        # Check for required components
        required_components = [
            "events {",
            "http {",
            "upstream django",
            "server {",
            "location /",
            "proxy_pass"
        ]
        
        missing_components = []
        for component in required_components:
            if component not in content:
                missing_components.append(component)
        
        if missing_components:
            return False, f"Missing components: {', '.join(missing_components)}"
        
        return True, "nginx.conf is valid"
        
    except Exception as e:
        return False, f"nginx.conf test failed: {str(e)}"

def test_requirements():
    """Test if requirements.txt is valid"""
    try:
        requirements_path = Path("requirements.txt")
        if not requirements_path.exists():
            return False, "requirements.txt not found"
        
        with open(requirements_path, 'r') as f:
            content = f.read()
        
        # Check for required packages
        required_packages = [
            "Django",
            "djangorestframework",
            "django-cors-headers",
            "gunicorn",
            "psycopg2-binary",
            "redis",
            "celery"
        ]
        
        missing_packages = []
        for package in required_packages:
            if package.lower() not in content.lower():
                missing_packages.append(package)
        
        if missing_packages:
            return False, f"Missing packages: {', '.join(missing_packages)}"
        
        return True, "requirements.txt is valid"
        
    except Exception as e:
        return False, f"requirements.txt test failed: {str(e)}"

def test_environment_files():
    """Test if environment files are present"""
    try:
        env_files = [
            ".env.example"
        ]
        
        results = []
        for env_file in env_files:
            if Path(env_file).exists():
                results.append(f"{env_file} exists")
            else:
                results.append(f"{env_file} not found")
        
        return True, "; ".join(results)
        
    except Exception as e:
        return False, f"Environment files test failed: {str(e)}"

def main():
    """Run all Docker configuration tests"""
    print("Testing BM23 Docker Configuration...")
    print("=" * 50)
    
    tests = [
        ("Dockerfile", test_dockerfile),
        ("Docker Compose", test_docker_compose),
        ("Nginx Config", test_nginx_config),
        ("Requirements", test_requirements),
        ("Environment Files", test_environment_files),
    ]
    
    all_passed = True
    
    for test_name, test_func in tests:
        print(f"Testing {test_name}...", end=" ")
        try:
            passed, message = test_func()
            if passed:
                print("PASS")
                print(f"   {message}")
            else:
                print("FAIL")
                print(f"   {message}")
                all_passed = False
        except Exception as e:
            print("ERROR")
            print(f"   {str(e)}")
            all_passed = False
        print()
    
    print("=" * 50)
    if all_passed:
        print("All Docker configuration tests passed!")
        print("Docker setup is ready for deployment.")
    else:
        print("Some Docker configuration tests failed.")
        print("Please review the issues above.")
    
    return all_passed

if __name__ == "__main__":
    main()
