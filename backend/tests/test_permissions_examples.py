from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse


User = get_user_model()


class RolePermissionsSmokeTests(TestCase):
    def setUp(self):
        self.client = Client()
        # Create users for each role
        self.admin = User.objects.create_user(username='adminu', password='pass', role='Admin')
        self.dep_admin = User.objects.create_user(username='depu', password='pass', role='DepartmentAdmin')
        self.advisor = User.objects.create_user(username='advu', password='pass', role='Advisor')
        self.student = User.objects.create_user(username='stuu', password='pass', role='Student')

    def auth(self, user):
        self.client.force_login(user)

    def test_reports_admin_only(self):
        # reports: admin only
        self.auth(self.admin)
        resp_ok = self.client.get('/api/reports/')
        self.assertNotIn(resp_ok.status_code, (401, 403))

        for u in (self.dep_admin, self.advisor, self.student):
            self.client.logout(); self.auth(u)
            resp_forbidden = self.client.get('/api/reports/')
            self.assertIn(resp_forbidden.status_code, (401, 403))

    def test_settings_update_admin_only(self):
        self.auth(self.admin)
        resp_ok = self.client.post('/api/settings/update/', data={})
        self.assertNotIn(resp_ok.status_code, (401, 403))

        for u in (self.dep_admin, self.advisor, self.student):
            self.client.logout(); self.auth(u)
            resp_forbidden = self.client.post('/api/settings/update/', data={})
            self.assertIn(resp_forbidden.status_code, (401, 403))

    def test_projects_bulk_update_requires_admin_or_dep_admin(self):
        for u in (self.admin, self.dep_admin):
            self.client.logout(); self.auth(u)
            resp_ok = self.client.post('/api/projects/bulk-update-status/', data={'project_ids': [], 'status': 'Approved'})
            self.assertNotIn(resp_ok.status_code, (401, 403))

        for u in (self.advisor, self.student):
            self.client.logout(); self.auth(u)
            resp_forbidden = self.client.post('/api/projects/bulk-update-status/', data={'project_ids': [], 'status': 'Approved'})
            self.assertIn(resp_forbidden.status_code, (401, 403))


