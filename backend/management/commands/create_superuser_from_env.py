#!/usr/bin/env python
"""
Django Management Command สำหรับสร้าง superuser จาก .env file
"""

import os
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.conf import settings
from decouple import config

User = get_user_model()


class Command(BaseCommand):
    help = 'สร้าง superuser จาก environment variables ใน .env file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='บังคับสร้าง superuser ใหม่แม้ว่าจะมีอยู่แล้ว',
        )
        parser.add_argument(
            '--check-only',
            action='store_true',
            help='ตรวจสอบ superuser ที่มีอยู่เท่านั้น ไม่สร้างใหม่',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🔧 กำลังสร้าง superuser จาก .env file...')
        )
        self.stdout.write('=' * 60)

        # อ่านค่าจาก environment variables
        superuser_username = config('SUPERUSER_USERNAME', default='admin')
        superuser_email = config('SUPERUSER_EMAIL', default='admin@eduinfo.online')
        superuser_password = config('SUPERUSER_PASSWORD', default='admin123')
        superuser_first_name = config('SUPERUSER_FIRST_NAME', default='System')
        superuser_last_name = config('SUPERUSER_LAST_NAME', default='Administrator')

        self.stdout.write(f'📋 การตั้งค่า Superuser:')
        self.stdout.write(f'   Username: {superuser_username}')
        self.stdout.write(f'   Email: {superuser_email}')
        self.stdout.write(f'   First Name: {superuser_first_name}')
        self.stdout.write(f'   Last Name: {superuser_last_name}')
        self.stdout.write(f'   Password: {"*" * len(superuser_password)}')
        self.stdout.write('')

        # ตรวจสอบ superuser ที่มีอยู่
        existing_superusers = User.objects.filter(is_superuser=True)
        if existing_superusers.exists():
            self.stdout.write(
                self.style.WARNING(f'⚠️ พบ superuser ที่มีอยู่แล้ว: {existing_superusers.count()} users')
            )
            for user in existing_superusers:
                self.stdout.write(f'   - {user.username} ({user.email}) - Active: {user.is_active}')
            self.stdout.write('')

            if options['check_only']:
                self.stdout.write(
                    self.style.SUCCESS('✅ ตรวจสอบ superuser เสร็จสิ้น (check-only mode)')
                )
                return

            if not options['force']:
                self.stdout.write(
                    self.style.WARNING('⚠️ ใช้ --force เพื่อบังคับสร้าง superuser ใหม่')
                )
                return

        # สร้างหรืออัปเดต superuser
        try:
            if options['force'] or not existing_superusers.filter(username=superuser_username).exists():
                # สร้าง superuser ใหม่
                admin_user, created = User.objects.get_or_create(
                    username=superuser_username,
                    defaults={
                        'email': superuser_email,
                        'first_name': superuser_first_name,
                        'last_name': superuser_last_name,
                        'is_active': True,
                        'is_staff': True,
                        'is_superuser': True
                    }
                )

                if created:
                    admin_user.set_password(superuser_password)
                    admin_user.save()
                    self.stdout.write(
                        self.style.SUCCESS('✅ สร้าง superuser สำเร็จ!')
                    )
                else:
                    # อัปเดต superuser ที่มีอยู่
                    admin_user.email = superuser_email
                    admin_user.first_name = superuser_first_name
                    admin_user.last_name = superuser_last_name
                    admin_user.set_password(superuser_password)
                    admin_user.is_active = True
                    admin_user.is_staff = True
                    admin_user.is_superuser = True
                    admin_user.save()
                    self.stdout.write(
                        self.style.SUCCESS('✅ อัปเดต superuser สำเร็จ!')
                    )

                self.stdout.write(f'   Username: {admin_user.username}')
                self.stdout.write(f'   Email: {admin_user.email}')
                self.stdout.write(f'   First Name: {admin_user.first_name}')
                self.stdout.write(f'   Last Name: {admin_user.last_name}')
                self.stdout.write(f'   Password: {"*" * len(superuser_password)}')
                self.stdout.write(f'   Active: {admin_user.is_active}')
                self.stdout.write(f'   Staff: {admin_user.is_staff}')
                self.stdout.write(f'   Superuser: {admin_user.is_superuser}')

            else:
                self.stdout.write(
                    self.style.WARNING('⚠️ Superuser นี้มีอยู่แล้ว ใช้ --force เพื่ออัปเดต')
                )

        except Exception as e:
            raise CommandError(f'❌ เกิดข้อผิดพลาด: {e}')

        # ทดสอบ login
        self.stdout.write('\n🧪 ทดสอบ login...')
        from django.contrib.auth import authenticate
        test_user = authenticate(username=superuser_username, password=superuser_password)
        if test_user:
            self.stdout.write(
                self.style.SUCCESS('✅ ทดสอบ login สำเร็จ!')
            )
            self.stdout.write(f'   User: {test_user.username}')
            self.stdout.write(f'   Active: {test_user.is_active}')
            self.stdout.write(f'   Staff: {test_user.is_staff}')
            self.stdout.write(f'   Superuser: {test_user.is_superuser}')
        else:
            self.stdout.write(
                self.style.ERROR('❌ ทดสอบ login ล้มเหลว!')
            )
            raise CommandError('การทดสอบ login ล้มเหลว')

        self.stdout.write('\n🎉 การสร้าง superuser เสร็จสิ้น!')
        self.stdout.write('\n📋 ข้อมูลการเข้าสู่ระบบ:')
        self.stdout.write(f'   Username: {superuser_username}')
        self.stdout.write(f'   Password: {superuser_password}')
        self.stdout.write(f'   URL: {getattr(settings, "FRONTEND_URL", "http://localhost:3000")}/login')
