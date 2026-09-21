from datetime import date, timedelta

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from .models import (
    Organization,
    Settings,
    Country,
    State,
    Notification,
    ActivityLog,
    FileUpload,
    Program,
    ProgramCategory,
    Volunteer,
    VolunteerSkill,
)

User = get_user_model()


class CoreModelTestCase(TestCase):
    def setUp(self):
        self.country = Country.objects.create(name='Testland', iso_code='TST', active=True)
        self.state = State.objects.create(name='Test State', country=self.country, code='TS', active=True)
        self.organization = Organization.objects.create(
            name='Brighter Future Foundation',
            legal_name='Brighter Future Foundation Ltd.',
            email='info@brighterfuture.org',
            phone='+1234567890',
            country=self.country,
            state=self.state,
        )
        self.settings = Settings.objects.create(
            organization=self.organization,
            support_email='support@brighterfuture.org',
        )

    def test_country_string(self):
        self.assertEqual(str(self.country), 'Testland')

    def test_state_string(self):
        self.assertEqual(str(self.state), 'Test State, TST')

    def test_organization_string(self):
        self.assertEqual(str(self.organization), 'Brighter Future Foundation')

    def test_settings_string(self):
        self.assertEqual(str(self.settings), 'Brighter Future Foundation Settings')

    def test_file_upload_validation(self):
        upload = FileUpload(
            title='Report',
            upload_type=FileUpload.UploadType.DOCUMENT,
            file=SimpleUploadedFile('report.pdf', b'PDF content', content_type='application/pdf'),
        )
        upload.full_clean()
        upload.save()
        upload.refresh_from_db()
        self.assertEqual(upload.size, 11)
        self.assertEqual(upload.content_type, 'application/pdf')

    def test_file_upload_invalid_type(self):
        upload = FileUpload(
            title='Wrong Type',
            upload_type=FileUpload.UploadType.IMAGE,
            file=SimpleUploadedFile('report.pdf', b'PDF content', content_type='application/pdf'),
        )
        with self.assertRaises(Exception):
            upload.full_clean()


class CoreAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            password='TestPass123!@#',
            full_name='API User',
        )
        self.organization = Organization.objects.create(name='BFF Org')
        self.settings = Settings.objects.create(organization=self.organization)
        self.country = Country.objects.create(name='Sample Country', iso_code='SMP', active=True)
        self.state = State.objects.create(name='Sample State', country=self.country, active=True)
        self.client.force_authenticate(user=self.user)

    def test_program_validation_rejects_invalid_budget(self):
        category = ProgramCategory.objects.create(name='Education', description='Education programs')
        program = Program(
            title='Youth Literacy',
            slug='youth-literacy',
            category=category,
            start_date='2026-01-01',
            end_date='2025-12-31',
            budget=100,
            amount_spent=200,
            funding_target=50,
        )
        with self.assertRaises(ValidationError):
            program.full_clean()

    def test_program_dashboard_endpoint(self):
        category = ProgramCategory.objects.create(name='Health', description='Health programs')
        Program.objects.create(
            title='Community Health',
            slug='community-health',
            category=category,
            start_date='2026-01-01',
            end_date='2026-12-31',
            budget=500,
            amount_spent=100,
            funding_target=300,
            status='active',
        )

        url = reverse('program-dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_programs'], 1)
        self.assertEqual(response.data['active_programs'], 1)

    def test_country_list(self):
        url = reverse('country-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_state_filter_by_country(self):
        url = reverse('state-list') + f'?country={self.country.id}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_notification_create_and_mark_read(self):
        url = reverse('notification-list')
        payload = {
            'title': 'Welcome',
            'message': 'Welcome to the platform.',
            'notification_type': 'info',
            'category': 'system',
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        notification_id = response.data['id']
        self.assertFalse(response.data['read'])

        mark_url = reverse('notification-mark-read', kwargs={'pk': notification_id})
        response = self.client.post(mark_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'read')

    def test_file_upload_endpoint(self):
        url = reverse('file-upload-list')
        upload_file = SimpleUploadedFile('avatar.png', b'PNG IMAGE', content_type='image/png')
        payload = {
            'title': 'Avatar',
            'upload_type': 'image',
            'file': upload_file,
        }
        response = self.client.post(url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['upload_type'], 'image')
        self.assertIn('file_url', response.data)

    def test_dashboard_statistics(self):
        url = reverse('dashboard-statistics')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('organizations', response.data)
        self.assertIn('pending_notifications', response.data)

    def test_volunteer_validation_rejects_future_joined_date(self):
        volunteer = Volunteer(
            first_name='Ada',
            last_name='Lovelace',
            email='ada@example.com',
            phone='+2348000000000',
            gender='female',
            joined_date=date.today() + timedelta(days=1),
            status='pending',
        )
        with self.assertRaises(ValidationError):
            volunteer.full_clean()

    def test_volunteer_dashboard_endpoint(self):
        VolunteerSkill.objects.create(name='Teaching', is_active=True)
        Volunteer.objects.create(
            first_name='Grace',
            last_name='Hopper',
            email='grace@example.com',
            phone='+2348000000001',
            gender='female',
            joined_date=date.today(),
            status='active',
        )

        url = reverse('volunteer-dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_volunteers'], 1)
        self.assertEqual(response.data['active_volunteers'], 1)
