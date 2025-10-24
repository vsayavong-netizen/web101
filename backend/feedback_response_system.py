"""
Feedback Response System
Automated response system for user feedback
"""

import os
import django
from datetime import datetime

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')
django.setup()

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

def send_feedback_acknowledgment(feedback_data):
    """Send acknowledgment email for feedback"""
    try:
        context = {
            'user_name': feedback_data.get('user_name', 'User'),
            'feedback_type': feedback_data.get('feedback_type', 'feedback'),
            'subject': feedback_data.get('subject', 'Your feedback'),
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        html_content = render_to_string('emails/feedback_acknowledgment.html', context)
        
        send_mail(
            subject='Thank you for your feedback',
            message='Thank you for your feedback. We will review it and get back to you soon.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[feedback_data.get('contact_email', '')],
            html_message=html_content,
            fail_silently=False
        )
        
        print(f"OK Feedback acknowledgment sent to {feedback_data.get('contact_email')}")
        return True
        
    except Exception as e:
        print(f"FAIL Failed to send feedback acknowledgment: {e}")
        return False

def process_feedback(feedback_data):
    """Process user feedback"""
    print(f"Processing feedback: {feedback_data.get('subject')}")
    
    # Send acknowledgment
    acknowledgment_sent = send_feedback_acknowledgment(feedback_data)
    
    # Log feedback
    print(f"Feedback logged: {feedback_data.get('feedback_type')} - {feedback_data.get('subject')}")
    
    # Categorize feedback
    feedback_type = feedback_data.get('feedback_type')
    if feedback_type == 'bug_report':
        print("Action: Forward to development team")
    elif feedback_type == 'feature_request':
        print("Action: Forward to product team")
    elif feedback_type == 'improvement':
        print("Action: Forward to system team")
    else:
        print("Action: Forward to general feedback team")
    
    return acknowledgment_sent

if __name__ == '__main__':
    # Example feedback processing
    sample_feedback = {
        'user_name': 'John Doe',
        'feedback_type': 'bug_report',
        'subject': 'Login issue',
        'message': 'Unable to login with correct credentials',
        'contact_email': 'john.doe@university.edu'
    }
    
    process_feedback(sample_feedback)
