"""
Performance testing with Locust
Install: pip install locust
Run: locust -f locustfile.py
"""
from locust import HttpUser, task, between
import random
import json


class ProjectManagementUser(HttpUser):
    """
    Simulate user behavior for performance testing
    """
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Login and get authentication token"""
        # Login
        login_data = {
            "username": "admin@example.com",
            "password": "password123"
        }
        response = self.client.post("/api/auth/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access') or data.get('token')
            self.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
        else:
            self.token = None
            self.headers = {}
    
    @task(3)
    def get_projects(self):
        """Get projects list - most common operation"""
        self.client.get("/api/projects/", headers=self.headers)
    
    @task(2)
    def search_projects(self):
        """Search projects - common operation"""
        query_params = {
            "query": random.choice(["AI", "Machine Learning", "Web", "Database"]),
            "status": random.choice(["Pending", "Approved", "Rejected"]),
            "page": 1,
            "page_size": 20
        }
        self.client.get("/api/projects/search/", params=query_params, headers=self.headers)
    
    @task(1)
    def get_project_details(self):
        """Get specific project details"""
        # Use a known project ID or get from list first
        project_id = "2024-001"  # Adjust based on your data
        self.client.get(f"/api/projects/{project_id}/", headers=self.headers)
    
    @task(1)
    def get_students(self):
        """Get students list"""
        self.client.get("/api/students/", headers=self.headers)
    
    @task(1)
    def get_advisors(self):
        """Get advisors list"""
        self.client.get("/api/advisors/", headers=self.headers)
    
    @task(1)
    def get_notifications(self):
        """Get notifications"""
        self.client.get("/api/notifications/", headers=self.headers)
    
    @task(1)
    def get_statistics(self):
        """Get project statistics"""
        self.client.get("/api/projects/statistics/", headers=self.headers)
    
    @task(1)
    def export_projects(self):
        """Export projects to CSV"""
        self.client.get("/api/projects/export/?format=csv", headers=self.headers)
    
    @task(1)
    def get_academic_years(self):
        """Get academic years"""
        self.client.get("/api/settings/academic-years/available/", headers=self.headers)


class HighLoadUser(HttpUser):
    """
    Simulate high load scenario
    """
    wait_time = between(0.5, 1.5)  # Faster requests
    
    def on_start(self):
        """Login"""
        login_data = {
            "username": "admin@example.com",
            "password": "password123"
        }
        response = self.client.post("/api/auth/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access') or data.get('token')
            self.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
        else:
            self.token = None
            self.headers = {}
    
    @task(5)
    def rapid_search(self):
        """Rapid search requests"""
        query_params = {
            "query": random.choice(["AI", "ML", "Web", "DB"]),
            "page": random.randint(1, 5),
            "page_size": 20
        }
        self.client.get("/api/projects/search/", params=query_params, headers=self.headers)
    
    @task(3)
    def rapid_list(self):
        """Rapid list requests"""
        self.client.get("/api/projects/", headers=self.headers)


class ReadOnlyUser(HttpUser):
    """
    Simulate read-only user (student)
    """
    wait_time = between(2, 5)  # Slower, more thoughtful
    
    def on_start(self):
        """Login as student"""
        login_data = {
            "username": "student@example.com",
            "password": "password123"
        }
        response = self.client.post("/api/auth/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access') or data.get('token')
            self.headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
        else:
            self.token = None
            self.headers = {}
    
    @task(3)
    def view_my_projects(self):
        """View own projects"""
        self.client.get("/api/projects/", headers=self.headers)
    
    @task(2)
    def view_notifications(self):
        """View notifications"""
        self.client.get("/api/notifications/", headers=self.headers)
    
    @task(1)
    def view_project_details(self):
        """View project details"""
        project_id = "2024-001"
        self.client.get(f"/api/projects/{project_id}/", headers=self.headers)

