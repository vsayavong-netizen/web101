"""
Main views for the final project management application.
"""

from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
import os


def index(request):
    """
    Serve the main frontend application.
    """
    # Try to serve the frontend index.html
    frontend_index = os.path.join(settings.STATIC_ROOT, 'index.html')
    
    if os.path.exists(frontend_index):
        with open(frontend_index, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    else:
        # Fallback to a simple HTML page
        return HttpResponse("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Final Project Management</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
            <h1>Final Project Management System</h1>
            <p>Loading...</p>
            <script>
                // Redirect to static files if available
                window.location.href = '/static/index.html';
            </script>
        </body>
        </html>
        """, content_type='text/html')
