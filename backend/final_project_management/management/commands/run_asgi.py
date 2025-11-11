"""
Django management command to run ASGI server with Daphne
"""
import os
import sys
from django.core.management.base import BaseCommand
from daphne.cli import CommandLineInterface


class Command(BaseCommand):
    help = 'Run ASGI server with Daphne for WebSocket support'

    def add_arguments(self, parser):
        parser.add_argument(
            '--host',
            default='0.0.0.0',
            help='Host to bind to'
        )
        parser.add_argument(
            '--port',
            type=int,
            default=8000,
            help='Port to bind to'
        )

    def handle(self, *args, **options):
        # Set up Django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'final_project_management.settings')

        # Import Django and setup
        import django
        django.setup()

        # Prepare Daphne arguments
        daphne_args = [
            '-b', options['host'],
            '-p', str(options['port']),
            'final_project_management.asgi:application'
        ]

        # Run Daphne
        cli = CommandLineInterface()
        cli.run(daphne_args)
