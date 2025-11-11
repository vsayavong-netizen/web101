"""
Management command to cleanup old monitoring data
Usage: python manage.py cleanup_monitoring_data --days=30
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from system_monitoring.models import (
    RequestLog, ErrorLog, SystemMetrics, PerformanceMetric, HealthCheck
)


class Command(BaseCommand):
    help = 'Cleanup old monitoring data to prevent database bloat'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to keep data (default: 30)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        cutoff_date = timezone.now() - timedelta(days=days)

        self.stdout.write(f"Cleaning up monitoring data older than {days} days...")
        self.stdout.write(f"Cutoff date: {cutoff_date}")

        # Cleanup RequestLogs
        request_logs = RequestLog.objects.filter(timestamp__lt=cutoff_date)
        request_count = request_logs.count()
        if not dry_run:
            request_logs.delete()
        self.stdout.write(
            self.style.SUCCESS(f"{'Would delete' if dry_run else 'Deleted'} {request_count} request logs")
        )

        # Cleanup SystemMetrics
        metrics = SystemMetrics.objects.filter(timestamp__lt=cutoff_date)
        metrics_count = metrics.count()
        if not dry_run:
            metrics.delete()
        self.stdout.write(
            self.style.SUCCESS(f"{'Would delete' if dry_run else 'Deleted'} {metrics_count} system metrics")
        )

        # Cleanup PerformanceMetrics
        perf_metrics = PerformanceMetric.objects.filter(timestamp__lt=cutoff_date)
        perf_count = perf_metrics.count()
        if not dry_run:
            perf_metrics.delete()
        self.stdout.write(
            self.style.SUCCESS(f"{'Would delete' if dry_run else 'Deleted'} {perf_count} performance metrics")
        )

        # Cleanup HealthChecks (keep only last 7 days)
        health_cutoff = timezone.now() - timedelta(days=7)
        health_checks = HealthCheck.objects.filter(timestamp__lt=health_cutoff)
        health_count = health_checks.count()
        if not dry_run:
            health_checks.delete()
        self.stdout.write(
            self.style.SUCCESS(f"{'Would delete' if dry_run else 'Deleted'} {health_count} health checks")
        )

        # Keep resolved errors, delete old unresolved errors (older than 90 days)
        error_cutoff = timezone.now() - timedelta(days=90)
        old_errors = ErrorLog.objects.filter(
            timestamp__lt=error_cutoff,
            resolved=True
        )
        error_count = old_errors.count()
        if not dry_run:
            old_errors.delete()
        self.stdout.write(
            self.style.SUCCESS(f"{'Would delete' if dry_run else 'Deleted'} {error_count} resolved errors")
        )

        if dry_run:
            self.stdout.write(self.style.WARNING("\nDRY RUN - No data was actually deleted"))
        else:
            self.stdout.write(self.style.SUCCESS("\nCleanup completed successfully!"))

