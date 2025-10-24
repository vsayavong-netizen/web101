from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from communication.models import CommunicationChannel, Message


User = get_user_model()


class CommunicationPermissionsTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin = User.objects.create_user(username='adminc', password='pass', role='Admin')
        self.dep_admin = User.objects.create_user(username='depc', password='pass', role='DepartmentAdmin')
        self.advisor = User.objects.create_user(username='advc', password='pass', role='Advisor')
        self.student = User.objects.create_user(username='stuc', password='pass', role='Student')

        self.channel = CommunicationChannel.objects.create(
            name='Test Channel',
            created_by=self.advisor,
            is_public=False,
        )
        self.channel.participants.add(self.advisor)

    def auth(self, user):
        self.client.force_login(user)

    def test_invite_requires_owner_or_admin(self):
        # Student cannot invite
        self.auth(self.student)
        resp = self.client.post('/api/communication/channels/invite/', data={'channel_id': str(self.channel.id), 'user_ids': []})
        self.assertIn(resp.status_code, (401, 403))

        # Advisor owner can invite
        self.client.logout(); self.auth(self.advisor)
        resp2 = self.client.post('/api/communication/channels/invite/', data={'channel_id': str(self.channel.id), 'user_ids': []})
        self.assertNotIn(resp2.status_code, (401, 403))

    def test_mark_read_requires_participant(self):
        # Not a participant
        self.auth(self.student)
        resp = self.client.post(f'/api/communication/channels/{self.channel.id}/mark-read/', data={})
        self.assertIn(resp.status_code, (401, 403))

        # Add student as participant then allowed
        self.channel.participants.add(self.student)
        resp2 = self.client.post(f'/api/communication/channels/{self.channel.id}/mark-read/', data={})
        self.assertNotIn(resp2.status_code, (401, 403))

    def test_channel_update_delete_requires_owner_or_admin(self):
        # Student cannot update/delete
        self.auth(self.student)
        upd = self.client.put(f'/api/communication/channels/{self.channel.id}/', data={'name': 'New Name'}, content_type='application/json')
        self.assertIn(upd.status_code, (401, 403))
        dele = self.client.delete(f'/api/communication/channels/{self.channel.id}/')
        self.assertIn(dele.status_code, (401, 403))

        # Owner can update/delete
        self.client.logout(); self.auth(self.advisor)
        upd2 = self.client.put(f'/api/communication/channels/{self.channel.id}/', data={'name': 'New Name'}, content_type='application/json')
        self.assertNotIn(upd2.status_code, (401, 403))

    def test_send_message_and_add_reaction_require_participant(self):
        # Prepare another user and a private channel where they are not a participant
        outsider = User.objects.create_user(username='outsider', password='pass', role='Student')
        self.client.logout(); self.auth(outsider)
        # Attempt to send message to channel without being a participant
        resp_send = self.client.post('/api/communication/messages/send/', data={'channel': str(self.channel.id), 'content': 'hi'})
        self.assertIn(resp_send.status_code, (401, 403))

        # Make outsider a participant then allowed
        self.channel.participants.add(outsider)
        resp_send2 = self.client.post('/api/communication/messages/send/', data={'channel': str(self.channel.id), 'content': 'hi'})
        self.assertNotIn(resp_send2.status_code, (401, 403))

        # Create a message by advisor
        self.client.logout(); self.auth(self.advisor)
        ok_msg = self.client.post('/api/communication/messages/send/', data={'channel': str(self.channel.id), 'content': 'advisor msg'})
        self.assertNotIn(ok_msg.status_code, (401, 403))
        # Extract created message id via DB (simpler than parsing response)
        msg_obj = Message.objects.filter(channel=self.channel).order_by('-created_at').first()
        self.assertIsNotNone(msg_obj)

        # Switch to non-participant (create a third user) and try to react
        third = User.objects.create_user(username='third', password='pass', role='Student')
        self.client.logout(); self.auth(third)
        resp_react = self.client.post(f'/api/communication/messages/{msg_obj.id}/reactions/add/', data={'reaction_type': 'like'})
        self.assertIn(resp_react.status_code, (401, 403))
        # Add as participant and try again
        self.channel.participants.add(third)
        resp_react2 = self.client.post(f'/api/communication/messages/{msg_obj.id}/reactions/add/', data={'reaction_type': 'like'})
        self.assertNotIn(resp_react2.status_code, (401, 403))

    def test_send_direct_message_ensures_both_participants(self):
        # Create recipient and pre-existing direct channel without participants
        recipient = User.objects.create_user(username='rcp', password='pass', role='Student')
        name = f"DM: {self.advisor.get_full_name()} & {recipient.get_full_name()}"
        dm_channel = CommunicationChannel.objects.create(channel_type='direct', name=name, created_by=self.advisor, is_public=False)
        # Ensure no participants yet
        self.assertEqual(dm_channel.participants.count(), 0)

        # Send direct message as advisor
        self.client.logout(); self.auth(self.advisor)
        resp = self.client.post('/api/communication/direct-messages/send/', data={'recipient_id': str(recipient.id), 'content': 'hello'})
        self.assertNotIn(resp.status_code, (401, 403))

        # Reload channel and verify both participants included now
        dm_channel.refresh_from_db()
        part_ids = set(dm_channel.participants.values_list('id', flat=True))
        self.assertIn(self.advisor.id, part_ids)
        self.assertIn(recipient.id, part_ids)

