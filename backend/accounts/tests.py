"""
Comprehensive unit tests for authentication and authorization
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Role, UserRole, EmailVerificationToken, PasswordResetToken, AuditLog

User = get_user_model()


class UserModelTestCase(TestCase):
    """Test cases for User model"""

    def setUp(self):
        """Set up test data"""
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPass123!@#',
            'full_name': 'Test User',
            'phone': '+1234567890',
        }

    def test_create_user(self):
        """Test creating a user"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.username, self.user_data['username'])
        self.assertEqual(user.email, self.user_data['email'])
        self.assertTrue(user.check_password(self.user_data['password']))

    def test_user_string_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(**self.user_data)
        expected_str = f"{user.full_name} ({user.email})"
        self.assertEqual(str(user), expected_str)

    def test_user_is_super_admin(self):
        """Test is_super_admin property"""
        user = User.objects.create_user(**self.user_data)
        self.assertFalse(user.is_super_admin)

        user.is_superuser = True
        self.assertTrue(user.is_super_admin)

    def test_user_lock_account(self):
        """Test account locking"""
        user = User.objects.create_user(**self.user_data)
        self.assertFalse(user.is_locked)

        user.lock_account(minutes=30)
        self.assertTrue(user.is_locked)

    def test_user_failed_login_attempts(self):
        """Test failed login attempts tracking"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.failed_login_attempts, 0)

        user.increment_failed_login_attempts()
        user.refresh_from_db()
        self.assertEqual(user.failed_login_attempts, 1)

    def test_user_reset_failed_login_attempts(self):
        """Test resetting failed login attempts"""
        user = User.objects.create_user(**self.user_data)
        user.failed_login_attempts = 3
        user.save()

        user.reset_failed_login_attempts()
        self.assertEqual(user.failed_login_attempts, 0)


class RoleModelTestCase(TestCase):
    """Test cases for Role model"""

    def setUp(self):
        """Set up test data"""
        self.role = Role.objects.create(
            name='super_admin',
            description='Super administrator role'
        )

    def test_create_role(self):
        """Test creating a role"""
        self.assertEqual(self.role.name, 'super_admin')
        self.assertEqual(self.role.description, 'Super administrator role')

    def test_role_string_representation(self):
        """Test role string representation"""
        self.assertEqual(str(self.role), self.role.get_name_display())


class UserRegistrationAPITestCase(APITestCase):
    """Test cases for user registration API"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.registration_url = reverse('register')
        self.user_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'full_name': 'New User',
            'phone': '+1234567890',
            'password': 'TestPass123!@#',
            'password2': 'TestPass123!@#',
        }

    def test_user_registration_success(self):
        """Test successful user registration"""
        response = self.client.post(
            self.registration_url,
            self.user_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username=self.user_data['username']).exists())

    def test_user_registration_password_mismatch(self):
        """Test registration with mismatched passwords"""
        self.user_data['password2'] = 'DifferentPass123!@#'
        response = self.client.post(
            self.registration_url,
            self.user_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_duplicate_email(self):
        """Test registration with duplicate email"""
        User.objects.create_user(
            username='existinguser',
            email=self.user_data['email'],
            password='TestPass123!@#'
        )
        response = self.client.post(
            self.registration_url,
            self.user_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_duplicate_username(self):
        """Test registration with duplicate username"""
        User.objects.create_user(
            username=self.user_data['username'],
            email='existing@example.com',
            password='TestPass123!@#'
        )
        response = self.client.post(
            self.registration_url,
            self.user_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class JWTAuthenticationAPITestCase(APITestCase):
    """Test cases for JWT authentication"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.login_url = reverse('token_obtain_pair')
        self.user_data = {
            'username': 'testuser',
            'password': 'TestPass123!@#',
        }
        self.user = User.objects.create_user(
            username=self.user_data['username'],
            email='test@example.com',
            password=self.user_data['password'],
            email_verified=True,
            status='active',
        )

    def test_jwt_login_success(self):
        """Test successful JWT login"""
        response = self.client.post(
            self.login_url,
            self.user_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_jwt_login_invalid_credentials(self):
        """Test JWT login with invalid credentials"""
        invalid_data = {
            'username': 'testuser',
            'password': 'WrongPassword',
        }
        response = self.client.post(
            self.login_url,
            invalid_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_login_account_locked(self):
        """Test JWT login with locked account"""
        self.user.lock_account()
        response = self.client.post(
            self.login_url,
            self.user_data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_access_protected_endpoint(self):
        """Test accessing protected endpoint with JWT token"""
        # Get token
        response = self.client.post(
            self.login_url,
            self.user_data,
            format='json'
        )
        token = response.data['access']

        # Access protected endpoint
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        me_url = reverse('current_user')
        response = self.client.get(me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_jwt_access_without_token(self):
        """Test accessing protected endpoint without token"""
        me_url = reverse('current_user')
        response = self.client.get(me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PasswordManagementAPITestCase(APITestCase):
    """Test cases for password management"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='OldPass123!@#',
            email_verified=True,
            status='active',
        )

    def test_change_password_success(self):
        """Test successful password change"""
        self.client.force_authenticate(user=self.user)
        change_password_url = reverse('change_password')

        data = {
            'old_password': 'OldPass123!@#',
            'new_password': 'NewPass123!@#',
            'new_password_confirm': 'NewPass123!@#',
        }

        response = self.client.post(change_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewPass123!@#'))

    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password"""
        self.client.force_authenticate(user=self.user)
        change_password_url = reverse('change_password')

        data = {
            'old_password': 'WrongPass123!@#',
            'new_password': 'NewPass123!@#',
            'new_password_confirm': 'NewPass123!@#',
        }

        response = self.client.post(change_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_request_password_reset(self):
        """Test requesting password reset"""
        request_reset_url = reverse('request_password_reset')

        data = {'email': self.user.email}
        response = self.client.post(request_reset_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify reset token was created
        self.assertTrue(
            PasswordResetToken.objects.filter(user=self.user).exists()
        )


class EmailVerificationAPITestCase(APITestCase):
    """Test cases for email verification"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!@#',
            email_verified=False,
            status='inactive',
        )
        self.email_token = EmailVerificationToken.objects.create(
            user=self.user,
            token='test_token_123'
        )

    def test_verify_email_success(self):
        """Test successful email verification"""
        verify_url = reverse('verify_email')

        data = {'token': self.email_token.token}
        response = self.client.post(verify_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify user email was verified
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verified)
        self.assertEqual(self.user.status, 'active')

    def test_verify_email_invalid_token(self):
        """Test email verification with invalid token"""
        verify_url = reverse('verify_email')

        data = {'token': 'invalid_token'}
        response = self.client.post(verify_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AuditLogTestCase(TestCase):
    """Test cases for audit logging"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123!@#',
        )

    def test_audit_log_creation(self):
        """Test audit log creation"""
        AuditLog.objects.create(
            user=self.user,
            action='login',
            ip_address='192.168.1.1',
        )

        self.assertTrue(AuditLog.objects.filter(user=self.user).exists())

    def test_audit_log_retrieval(self):
        """Test retrieving audit logs for user"""
        AuditLog.objects.create(
            user=self.user,
            action='login',
            ip_address='192.168.1.1',
        )
        AuditLog.objects.create(
            user=self.user,
            action='password_change',
        )

        logs = AuditLog.objects.filter(user=self.user)
        self.assertEqual(logs.count(), 2)
