from django.test import TestCase, Client
from django.contrib.auth import get_user_model
import uuid


User = get_user_model()


class DefensePermissionsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin = User.objects.create_user(username='admin_user', password='pass', role='Admin')
        self.dep_admin = User.objects.create_user(username='dep_admin_user', password='pass', role='DepartmentAdmin')
        self.advisor = User.objects.create_user(username='advisor_user', password='pass', role='Advisor')
        self.student = User.objects.create_user(username='student_user', password='pass', role='Student')

    def auth(self, user):
        self.client.force_login(user)

    def test_schedule_defense_forbidden_for_student(self):
        # Student must be forbidden
        self.auth(self.student)
        resp = self.client.post('/api/defense/schedules/create/', data={})
        self.assertIn(resp.status_code, (401, 403))

        # Advisor is allowed to attempt (may fail validation but not auth)
        self.client.logout(); self.auth(self.advisor)
        resp2 = self.client.post('/api/defense/schedules/create/', data={})
        self.assertNotIn(resp2.status_code, (401, 403))

    def test_start_complete_evaluation_result_forbidden_for_student(self):
        some_schedule_id = uuid.uuid4()
        some_session_id = uuid.uuid4()

        # Student must be forbidden at auth layer (before 404)
        self.auth(self.student)
        r1 = self.client.post(f'/api/defense/sessions/{some_schedule_id}/start/', data={})
        self.assertIn(r1.status_code, (401, 403))
        r2 = self.client.post(f'/api/defense/sessions/{some_session_id}/complete/', data={})
        self.assertIn(r2.status_code, (401, 403))
        r3 = self.client.post('/api/defense/evaluations/submit/', data={})
        self.assertIn(r3.status_code, (401, 403))
        r4 = self.client.post('/api/defense/results/submit/', data={})
        self.assertIn(r4.status_code, (401, 403))

        # Advisor allowed past auth (may return 404/400 but not 401/403)
        self.client.logout(); self.auth(self.advisor)
        a1 = self.client.post(f'/api/defense/sessions/{some_schedule_id}/start/', data={})
        self.assertNotIn(a1.status_code, (401, 403))
        a2 = self.client.post(f'/api/defense/sessions/{some_session_id}/complete/', data={})
        self.assertNotIn(a2.status_code, (401, 403))
        a3 = self.client.post('/api/defense/evaluations/submit/', data={})
        self.assertNotIn(a3.status_code, (401, 403))
        a4 = self.client.post('/api/defense/results/submit/', data={})
        self.assertNotIn(a4.status_code, (401, 403))

    def test_rooms_settings_reminders_permissions(self):
        # Student should be forbidden
        self.auth(self.student)
        r_rooms = self.client.get('/api/defense/rooms/')
        self.assertIn(r_rooms.status_code, (401, 403))
        r_settings = self.client.get('/api/defense/settings/')
        self.assertIn(r_settings.status_code, (401, 403))
        r_reminder = self.client.post('/api/defense/reminders/send/', data={})
        self.assertIn(r_reminder.status_code, (401, 403))

        # DepartmentAdmin allowed (auth), may fail validation but should not be 401/403
        self.client.logout(); self.auth(self.dep_admin)
        d_rooms = self.client.get('/api/defense/rooms/')
        self.assertNotIn(d_rooms.status_code, (401, 403))
        d_settings = self.client.get('/api/defense/settings/')
        self.assertNotIn(d_settings.status_code, (401, 403))
        d_reminder = self.client.post('/api/defense/reminders/send/', data={})
        self.assertNotIn(d_reminder.status_code, (401, 403))


