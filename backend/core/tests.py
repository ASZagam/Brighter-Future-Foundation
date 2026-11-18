from datetime import date, timedelta

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import AuditLog as AccountAuditLog, Role, Roles, UserRole

from .models import (
    Organization,
    Settings,
    Country,
    State,
    Notification,
    ActivityLog,
    FileUpload,
    Member,
    Program,
    ProgramCategory,
    ProgramStaffAssignment,
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
        # Management endpoints are role-gated, so the acting user needs a role.
        role, _ = Role.objects.get_or_create(
            name=Roles.ADMIN, defaults={'description': 'Administrator role'}
        )
        UserRole.objects.get_or_create(user=self.user, role=role)
        self.client.force_authenticate(user=self.user)

    def test_management_endpoints_reject_roleless_user(self):
        """A signed-in user with no role must not reach management endpoints."""
        from rest_framework.test import APIClient as _APIClient

        roleless = User.objects.create_user(
            username='roleless',
            email='roleless@example.com',
            password='TestPass123!@#',
            full_name='Roleless',
        )
        client = _APIClient()
        client.force_authenticate(user=roleless)
        for name in ('dashboard-statistics', 'volunteer-dashboard'):
            with self.subTest(endpoint=name):
                response = client.get(reverse(name))
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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

    def test_program_dashboard_rejects_member(self):
        member = User.objects.create_user(
            username='member_dashboard_user',
            email='member-dashboard@example.com',
            password='TestPass123!@#',
        )
        role, _ = Role.objects.get_or_create(
            name=Roles.MEMBER, defaults={'description': 'Member role'}
        )
        UserRole.objects.get_or_create(user=member, role=role)
        self.client.force_authenticate(user=member)

        response = self.client.get(reverse('program-dashboard'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_program_creation_accepts_assigned_team(self):
        assignee = User.objects.create_user(
            username='program_assignee',
            email='program-assignee@example.com',
            password='TestPass123!@#',
            full_name='Program Assignee',
        )

        response = self.client.post(
            '/api/core/programs/',
            {
                'title': 'Community Learning Program',
                'description': 'Learning support in local schools.',
                'status': 'planning',
                'priority': 'medium',
                'start_date': '2026-12-01',
                'end_date': '2026-12-20',
                'address': '12 Community Road',
                'lga': 'Central District',
                'budget': '1000',
                'team_assignments': [
                    {'user': str(assignee.pk), 'role_in_program': 'team_lead', 'notes': 'Coordinate the field team.'},
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        program = Program.objects.get(pk=response.data['id'])
        assignment = ProgramStaffAssignment.objects.get(program=program, user=assignee)
        self.assertEqual(assignment.role_in_program, 'team_lead')
        self.assertEqual(assignment.assigned_by, self.user)
        assigned_user_notification = Notification.objects.get(user=assignee)
        self.assertIn('assigned as Team Lead', assigned_user_notification.message)

    def test_assigned_program_endpoint_returns_only_current_users_assignments(self):
        assignee = User.objects.create_user(
            username='assigned_user',
            email='assigned-user@example.com',
            password='TestPass123!@#',
            full_name='Assigned User',
        )
        program = Program.objects.create(
            title='Assigned Community Program',
            slug='assigned-community-program',
            description='Program details for assigned staff.',
            start_date='2026-12-01',
            end_date='2026-12-20',
            state=self.state,
            lga='Central District',
            address='12 Community Road',
            budget=1000,
        )
        ProgramStaffAssignment.objects.create(
            program=program,
            user=assignee,
            role_in_program='team_lead',
            assigned_by=self.user,
        )
        self.client.force_authenticate(user=assignee)

        response = self.client.get('/api/core/programs/assigned-to-me/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        assignment = response.data[0]
        self.assertEqual(assignment['assigned_role'], 'Team Lead')
        self.assertEqual(assignment['program']['address'], '12 Community Road')
        self.assertEqual(assignment['program']['state_name'], self.state.name)
        self.assertEqual(assignment['program']['team_lead'], 'Assigned User')
        self.assertNotIn('budget', assignment['program'])

    def test_program_manager_sees_program_in_assigned_programs(self):
        program = Program.objects.create(
            title='Managed Community Program',
            slug='managed-community-program',
            start_date='2026-12-01',
            manager=self.user,
        )

        response = self.client.get('/api/core/programs/assigned-to-me/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['assigned_role'], 'Program Manager')
        self.assertEqual(response.data[0]['program']['id'], str(program.pk))

    def test_organization_about_draft_stays_private_until_published(self):
        from .models import OrganizationProfile

        payload = {
            'name': 'Brighter Future Foundation',
            'slogan': 'Toward A Brighter Future.',
            'about_intro': 'Our introduction.',
            'disciplines_intro': 'Our programme areas.',
            'mission': 'Our mission.',
            'vision': 'Our vision.',
            'history': 'Our history.',
            'founder_name': '',
            'founder_title': '',
            'email': 'hello@example.org',
            'phone': '+234 800 000 0000',
            'address': 'Abuja, Nigeria',
            'contact_intro': 'Contact us to work together.',
            'disciplines': [
                {
                    'id': 'education',
                    'name': 'Education and Human Capital Development',
                    'description': 'Learning and skills.',
                    'display_order': 0,
                    'is_published': True,
                },
                {
                    'id': 'health',
                    'name': 'Health and Community Well-being',
                    'description': 'Health awareness.',
                    'display_order': 1,
                    'is_published': False,
                },
            ],
        }

        saved = self.client.patch('/api/core/organization/about/', payload, format='json')
        self.assertEqual(saved.status_code, status.HTTP_200_OK, saved.data)
        profile = OrganizationProfile.objects.get(name='Brighter Future Foundation')
        self.assertEqual(profile.mission, '')
        self.assertEqual(profile.about_draft['mission'], 'Our mission.')

        unpublished = self.client.get('/api/v2/public/organization/')
        self.assertEqual(unpublished.status_code, status.HTTP_404_NOT_FOUND)

        published = self.client.post('/api/core/organization/about/publish/', format='json')
        self.assertEqual(published.status_code, status.HTTP_200_OK, published.data)
        profile.refresh_from_db()
        self.assertEqual(profile.mission, 'Our mission.')

        public_profile = self.client.get('/api/v2/public/organization/')
        self.assertEqual(public_profile.status_code, status.HTTP_200_OK)
        self.assertEqual(public_profile.data['about_intro'], 'Our introduction.')
        self.assertEqual(public_profile.data['disciplines_intro'], 'Our programme areas.')
        self.assertEqual(len(public_profile.data['about_disciplines']), 1)
        self.assertEqual(public_profile.data['about_disciplines'][0]['name'], 'Education and Human Capital Development')

    def test_organization_banner_upload_is_staged_until_about_content_is_published(self):
        from io import BytesIO
        from tempfile import TemporaryDirectory

        from django.test import override_settings
        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        from .models import OrganizationProfile

        payload = {
            'name': 'Brighter Future Foundation',
            'slogan': 'Toward A Brighter Future.',
            'about_intro': 'Our introduction.',
            'disciplines_intro': 'Our programme areas.',
            'mission': 'Our mission.',
            'vision': 'Our vision.',
            'history': 'Our history.',
            'founder_name': '',
            'founder_title': '',
            'email': 'hello@example.org',
            'phone': '',
            'address': '',
            'contact_intro': '',
            'disciplines': [],
        }
        image_buffer = BytesIO()
        Image.new('RGB', (2, 2), color='green').save(image_buffer, format='PNG')

        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            saved = self.client.patch('/api/core/organization/about/', payload, format='json')
            self.assertEqual(saved.status_code, status.HTTP_200_OK, saved.data)

            upload = self.client.post(
                '/api/core/organization/about/banner/',
                {'hero_banner': SimpleUploadedFile(
                    'home-banner.png',
                    image_buffer.getvalue(),
                    content_type='image/png',
                )},
                format='multipart',
            )
            self.assertEqual(upload.status_code, status.HTTP_201_CREATED, upload.data)
            profile = OrganizationProfile.objects.get(name='Brighter Future Foundation')
            self.assertTrue(profile.about_draft_banner)
            self.assertFalse(profile.hero_banner)

            published = self.client.post('/api/core/organization/about/publish/', format='json')
            self.assertEqual(published.status_code, status.HTTP_200_OK, published.data)
            profile.refresh_from_db()
            self.assertTrue(profile.hero_banner)
            self.assertFalse(profile.about_draft_banner)
            public_profile = self.client.get('/api/v2/public/organization/')
            self.assertEqual(public_profile.status_code, status.HTTP_200_OK)
            self.assertIn('home-banner', public_profile.data['hero_banner'])

    def test_program_coordinator_can_update_status_and_remind_assigned_team(self):
        coordinator = User.objects.create_user(
            username='assigned_program_coordinator',
            email='assigned-coordinator@example.com',
            password='TestPass123!@#',
            full_name='Assigned Coordinator',
        )
        teammate = User.objects.create_user(
            username='program_teammate',
            email='program-teammate@example.com',
            password='TestPass123!@#',
            full_name='Program Teammate',
        )
        program = Program.objects.create(
            title='Coordinator Managed Program',
            slug='coordinator-managed-program',
            start_date='2026-12-01',
            status='active',
        )
        ProgramStaffAssignment.objects.create(
            program=program,
            user=coordinator,
            role_in_program='program_coordinator',
            assigned_by=self.user,
        )
        ProgramStaffAssignment.objects.create(
            program=program,
            user=teammate,
            role_in_program='team_lead',
            assigned_by=self.user,
        )
        self.client.force_authenticate(user=coordinator)

        assignments = self.client.get('/api/core/programs/assigned-to-me/')
        self.assertEqual(assignments.status_code, status.HTTP_200_OK)
        self.assertTrue(assignments.data[0]['can_manage'])

        update = self.client.post(
            f'/api/core/programs/{program.pk}/team-status/',
            {'status': 'completed'},
            format='json',
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK, update.data)
        program.refresh_from_db()
        self.assertEqual(program.status, 'completed')
        self.assertEqual(
            Notification.objects.filter(user=teammate, category='Programs').count(),
            1,
        )

        reminder = self.client.post(
            f'/api/core/programs/{program.pk}/remind-team/',
            {'message': 'Please submit your final field notes.'},
            format='json',
        )
        self.assertEqual(reminder.status_code, status.HTTP_201_CREATED, reminder.data)
        self.assertEqual(reminder.data['recipient_count'], 1)
        notification = Notification.objects.filter(user=teammate, category='Programs').latest('sent_at')
        self.assertEqual(notification.message, 'Please submit your final field notes.')

    def test_program_team_member_cannot_use_coordinator_actions(self):
        teammate = User.objects.create_user(
            username='ordinary_program_teammate',
            email='ordinary-program-teammate@example.com',
            password='TestPass123!@#',
        )
        program = Program.objects.create(
            title='Restricted Program',
            slug='restricted-program',
            start_date='2026-12-01',
            status='active',
        )
        ProgramStaffAssignment.objects.create(
            program=program,
            user=teammate,
            role_in_program='team_lead',
            assigned_by=self.user,
        )
        self.client.force_authenticate(user=teammate)

        status_response = self.client.post(
            f'/api/core/programs/{program.pk}/team-status/',
            {'status': 'completed'},
            format='json',
        )
        gallery_response = self.client.post(
            '/api/core/program-gallery/',
            {'program': str(program.pk), 'caption': 'Not authorized'},
            format='multipart',
        )

        self.assertEqual(status_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(gallery_response.status_code, status.HTTP_403_FORBIDDEN)
        program.refresh_from_db()
        self.assertEqual(program.status, 'active')

    def test_staff_member_record_actions_create_notifications(self):
        member_account = User.objects.create_user(
            username='notified_member',
            email='notified-member@example.com',
            password='TestPass123!@#',
        )
        create = self.client.post(
            reverse('members-list'),
            {
                'user': member_account.pk,
                'first_name': 'Notified',
                'last_name': 'Member',
                'email': 'notified-member@example.com',
                'phone': '',
                'gender': '',
                'state': '',
                'lga': '',
            },
            format='json',
        )
        self.assertEqual(create.status_code, status.HTTP_201_CREATED, create.data)
        member = Member.objects.get(pk=create.data['id'])
        self.assertEqual(Notification.objects.filter(user=member_account).count(), 1)

        update = self.client.patch(
            reverse('members-detail', kwargs={'pk': member.pk}),
            {'phone': '08012345678'},
            format='json',
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(user=member_account).count(), 2)

        status_response = self.client.post(
            reverse('members-set-status', kwargs={'pk': member.pk}),
            {'status': 'active'},
            format='json',
        )
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(user=member_account).count(), 3)

        delete = self.client.delete(reverse('members-detail', kwargs={'pk': member.pk}))
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        notifications = Notification.objects.filter(user=member_account, category='Membership')
        self.assertEqual(notifications.count(), 4)
        self.assertEqual(notifications.filter(title='Membership record created').count(), 1)
        self.assertEqual(notifications.filter(title='Membership record removed').count(), 1)

    def test_admin_member_create_records_origin_and_creator(self):
        response = self.client.post(
            reverse('members-list'),
            {
                'first_name': 'Admin',
                'last_name': 'Added',
                'email': 'admin-added@example.com',
                'phone': '',
                'gender': '',
                'state': '',
                'lga': '',
                'membership_type': 'regular',
                'status': 'pending',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        member = Member.objects.get(pk=response.data['id'])
        self.assertEqual(member.registration_source, Member.RegistrationSource.ADMIN)
        self.assertEqual(member.created_by, self.user)

    def test_member_stats_count_registration_sources(self):
        Member.objects.create(
            first_name='Self', last_name='Registered', email='self-source@example.com',
            phone='', gender='', state='', lga='',
            registration_source=Member.RegistrationSource.SELF_SERVICE,
        )
        Member.objects.create(
            first_name='Admin', last_name='Added', email='admin-source@example.com',
            phone='', gender='', state='', lga='', created_by=self.user,
            registration_source=Member.RegistrationSource.ADMIN,
        )

        response = self.client.get(reverse('members-member-stats'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['kpis']['self_registered'], 1)
        self.assertEqual(response.data['kpis']['admin_added'], 1)

    def test_member_self_profile_can_edit_only_personal_fields(self):
        member = Member.objects.create(
            user=self.user,
            first_name='Original',
            last_name='Name',
            email=self.user.email,
            phone='5551000',
            gender='other',
            state='Test State',
            lga='Test LGA',
            notes='Internal staff note',
            registration_source=Member.RegistrationSource.ADMIN,
            created_by=self.user,
        )

        response = self.client.patch(
            reverse('members-me'),
            {
                'first_name': 'Updated',
                'phone': '5552000',
                'email': 'changed@example.com',
                'status': 'active',
                'registration_source': 'self_service',
                'notes': 'Changed note',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        member.refresh_from_db()
        self.user.refresh_from_db()
        self.assertEqual(member.first_name, 'Updated')
        self.assertEqual(member.phone, '5552000')
        self.assertEqual(member.email, 'api@example.com')
        self.assertEqual(member.status, 'pending')
        self.assertEqual(member.registration_source, Member.RegistrationSource.ADMIN)
        self.assertEqual(member.notes, 'Internal staff note')
        self.assertEqual(self.user.full_name, member.full_name)
        self.assertNotIn('notes', response.data)
        self.assertNotIn('registration_source', response.data)

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

    def test_admin_can_broadcast_to_one_active_role_and_audit_it(self):
        member_role, _ = Role.objects.get_or_create(
            name=Roles.MEMBER, defaults={'description': 'Member role'}
        )
        member = User.objects.create_user(
            username='broadcast_member',
            email='broadcast-member@example.com',
            password='TestPass123!@#',
        )
        UserRole.objects.create(user=member, role=member_role)
        inactive_member = User.objects.create_user(
            username='inactive_broadcast_member',
            email='inactive-broadcast-member@example.com',
            password='TestPass123!@#',
            status='inactive',
        )
        UserRole.objects.create(user=inactive_member, role=member_role)

        payload = {
            'audience': Roles.MEMBER,
            'title': 'Foundation update',
            'message': 'The next member meeting is scheduled.',
        }
        preview = self.client.get(
            reverse('notification-broadcast-preview'),
            {'audience': Roles.MEMBER},
        )
        self.assertEqual(preview.status_code, status.HTTP_200_OK)
        self.assertEqual(preview.data['recipient_count'], 1)
        all_preview = self.client.get(
            reverse('notification-broadcast-preview'),
            {'audience': 'all'},
        )
        self.assertEqual(all_preview.status_code, status.HTTP_200_OK)
        self.assertEqual(all_preview.data['recipient_count'], 2)

        response = self.client.post(
            reverse('notification-broadcast'), payload, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['recipient_count'], 1)
        self.assertEqual(
            list(Notification.objects.filter(category='Broadcast').values_list('user_id', flat=True)),
            [member.id],
        )

        audit = AccountAuditLog.objects.get(action='notification_broadcast_sent')
        self.assertEqual(audit.user, self.user)
        self.assertEqual(audit.details['audience'], Roles.MEMBER)
        self.assertEqual(audit.details['recipient_count'], 1)

    def test_non_admin_cannot_preview_or_send_broadcasts(self):
        member_role, _ = Role.objects.get_or_create(
            name=Roles.MEMBER, defaults={'description': 'Member role'}
        )
        member = User.objects.create_user(
            username='broadcast_non_admin',
            email='broadcast-non-admin@example.com',
            password='TestPass123!@#',
        )
        UserRole.objects.create(user=member, role=member_role)
        self.client.force_authenticate(user=member)

        preview = self.client.get(
            reverse('notification-broadcast-preview'),
            {'audience': Roles.MEMBER},
        )
        send = self.client.post(
            reverse('notification-broadcast'),
            {'audience': 'all', 'title': 'Restricted', 'message': 'No'},
            format='json',
        )
        self.assertEqual(preview.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(send.status_code, status.HTTP_403_FORBIDDEN)

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
