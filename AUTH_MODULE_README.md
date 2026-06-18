# Authentication & Role-Based Access Control (RBAC) Module

Complete authentication and authorization module for the Brighter Future Foundation (BFF) NGO Management System.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Features](#features)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [API Endpoints](#api-endpoints)
7. [Database Models](#database-models)
8. [Usage Guide](#usage-guide)
9. [Role & Permission System](#role--permission-system)
10. [Testing](#testing)
11. [Security Considerations](#security-considerations)

---

## Architecture Overview

The authentication system uses a **Multi-tier architecture** with Django backend and Next.js frontend:

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Pages (Login, Register, Dashboard, etc.)             │ │
│  │  Auth Context (Global State Management)               │ │
│  │  API Utilities (fetchWithAuth, apiCall, etc.)         │ │
│  │  API Routes (Proxy to Django Backend)                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                  Django REST API                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  JWT Authentication (SimpleJWT)                        │ │
│  │  Serializers (Custom, Validation)                      │ │
│  │  Views (ViewSets, GenericAPIViews)                     │ │
│  │  Permissions (Custom Permission Classes)              │ │
│  │  Models (User, Role, Email/Password Tokens)           │ │
│  │  Email Service (Verification, Password Reset)         │ │
│  │  Audit Logging (Track Auth Events)                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  User (Custom User Model with Auth Fields)            │ │
│  │  Role (Role Definition with Permissions)              │ │
│  │  UserRole (User-Role Mapping)                         │ │
│  │  EmailVerificationToken (Email Verification)          │ │
│  │  PasswordResetToken (Password Reset)                  │ │
│  │  AuditLog (Authentication Event Tracking)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

### Django Backend

```
backend/
├── accounts/                          # Authentication App
│   ├── migrations/                    # Database migrations
│   ├── admin.py                       # Django admin configuration
│   ├── api_urls.py                    # API URL routing
│   ├── apps.py                        # App configuration
│   ├── email_service.py               # Email service (NEW)
│   ├── models.py                      # Database models (ENHANCED)
│   │   ├── Role                       # Role model with permissions
│   │   ├── User                       # Custom user model with auth fields
│   │   ├── UserRole                   # Through model for user roles
│   │   ├── EmailVerificationToken     # Email verification
│   │   ├── PasswordResetToken         # Password reset
│   │   └── AuditLog                   # Authentication audit log
│   ├── permissions.py                 # Permission classes (ENHANCED)
│   │   ├── IsSuperAdmin               # Super admin permission
│   │   ├── IsAdmin                    # Admin permission
│   │   ├── IsCoordinator              # Coordinator permission
│   │   ├── IsActiveUser               # Active user check
│   │   ├── IsEmailVerified            # Email verification check
│   │   ├── HasRole                    # Role-based permission
│   │   ├── IsOwnerOrReadOnly          # Owner or read-only
│   │   └── CanManageUsers             # User management permission
│   ├── serializers.py                 # Serializers (ENHANCED)
│   │   ├── RoleSerializer             # Role serialization
│   │   ├── UserDetailSerializer       # Detailed user info
│   │   ├── UserListSerializer         # User list view
│   │   ├── UserRegistrationSerializer # Registration
│   │   ├── CustomTokenObtainPairSerializer # JWT login
│   │   ├── ChangePasswordSerializer   # Password change
│   │   ├── RequestPasswordResetSerializer # Request reset
│   │   ├── ResetPasswordSerializer    # Reset password
│   │   ├── VerifyEmailSerializer      # Email verification
│   │   └── UserUpdateSerializer       # Profile update
│   ├── tests.py                       # Unit tests (COMPREHENSIVE)
│   ├── urls.py                        # URL routing
│   ├── views.py                       # API views (ENHANCED)
│   │   ├── CustomTokenObtainPairView  # JWT login
│   │   ├── UserRegistrationView       # User registration
│   │   ├── VerifyEmailView            # Email verification
│   │   ├── RequestPasswordResetView   # Request password reset
│   │   ├── ResetPasswordView          # Reset password
│   │   ├── CurrentUserView            # Get current user
│   │   ├── UserViewSet                # User management
│   │   └── RoleViewSet                # Role management
│   └── __init__.py
├── templates/
│   └── emails/                        # Email templates (NEW)
│       ├── welcome.html               # Welcome email
│       ├── verify_email.html          # Email verification
│       ├── password_reset.html        # Password reset
│       └── password_changed.html      # Password changed
├── bff/
│   ├── settings.py                    # ENHANCED with JWT & CORS
│   ├── urls.py                        # URL configuration
│   ├── wsgi.py
│   └── asgi.py
├── requirements.txt                   # ENHANCED with JWT packages
├── .env.example                       # Environment variables template
└── manage.py
```

### Next.js Frontend

```
app/
├── api/
│   └── auth/                          # Authentication API Routes (ENHANCED)
│       ├── login/
│       │   └── route.ts               # JWT login endpoint
│       ├── register/
│       │   └── route.ts               # User registration endpoint
│       ├── logout/
│       │   └── route.ts               # Logout endpoint
│       ├── me/
│       │   └── route.ts               # Current user endpoint
│       ├── refresh/
│       │   └── route.ts               # Token refresh endpoint (NEW)
│       ├── verify-email/
│       │   └── route.ts               # Email verification endpoint (NEW)
│       ├── request-password-reset/
│       │   └── route.ts               # Request password reset (NEW)
│       └── reset-password/
│           └── route.ts               # Reset password endpoint (NEW)
├── auth/                              # Auth pages (Optional)
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── verify-email/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
├── layout.tsx
├── page.tsx
└── ...
lib/
├── auth.ts                            # JWT utilities (ENHANCED)
│   ├── hashPassword()
│   ├── comparePassword()
│   ├── signToken()
│   ├── verifyToken()
│   ├── getAccessToken()
│   ├── getRefreshToken()
│   ├── isTokenExpired()
│   ├── refreshAccessToken()
│   └── decodeToken()
├── auth-context.tsx                   # Auth context provider (NEW)
│   ├── AuthProvider
│   ├── useAuth hook
│   └── AuthContextType
├── api.ts                             # API utilities (NEW)
│   ├── fetchWithAuth()
│   ├── apiCall()
│   ├── apiGet()
│   ├── apiPost()
│   ├── apiPut()
│   ├── apiPatch()
│   └── apiDelete()
├── prisma.ts
└── ...
.env.local.example                     # Frontend env template (NEW)
package.json                           # Dependencies
```

---

## Features

### Authentication Features
✅ **User Registration** - Email-based registration with validation
✅ **JWT Login** - Secure JWT token-based authentication
✅ **Email Verification** - Verify email before account activation
✅ **Password Reset** - Secure password reset with email verification
✅ **Token Refresh** - Automatic token refresh mechanism
✅ **Account Lockout** - Lock account after failed login attempts
✅ **Password Hashing** - Bcrypt password hashing
✅ **Session Management** - Track user sessions
✅ **Account Status** - Active/Inactive/Suspended/Archived states

### Role-Based Access Control (RBAC)
✅ **Role System** - Define custom roles with permissions
✅ **Permission Classes** - Fine-grained permission control
✅ **Role Assignment** - Assign multiple roles to users
✅ **Permission Inheritance** - Roles inherit permissions
✅ **Flexible Permissions** - Super Admin, Admin, Coordinator, Volunteer, Donor, Member

### Security Features
✅ **CORS Protection** - Configured CORS for frontend
✅ **HTTPS Support** - Ready for production with SSL
✅ **HTTP-Only Cookies** - Secure JWT storage
✅ **Password Validation** - Strong password requirements
✅ **Rate Limiting** - Built-in rate limiting ready
✅ **Audit Logging** - Track all auth events
✅ **IP Address Logging** - Log IP for security
✅ **User Agent Logging** - Log user agent for security

### Email Features
✅ **Email Verification** - Required email verification
✅ **Welcome Email** - Send welcome email on registration
✅ **Password Reset Email** - Password reset with verification link
✅ **Password Changed Notification** - Notify on password change
✅ **HTML Email Templates** - Professional email templates
✅ **Configurable Email Backend** - Support for multiple SMTP providers

---

## Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+
- pip & npm/yarn

### Backend Setup

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Create migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

3. **Create superuser:**
```bash
python manage.py createsuperuser
```

4. **Create default roles:**
```bash
python manage.py shell
```

```python
from accounts.models import Role

roles_data = [
    ('super_admin', 'Super Administrator'),
    ('admin', 'Administrator'),
    ('coordinator', 'Event Coordinator'),
    ('volunteer', 'Volunteer'),
    ('donor', 'Donor'),
    ('member', 'Member'),
]

for name, description in roles_data:
    Role.objects.get_or_create(name=name, defaults={'description': description})

exit()
```

5. **Run development server:**
```bash
python manage.py runserver
```

### Frontend Setup

1. **Install Node dependencies:**
```bash
npm install
# or
yarn install
```

2. **Create environment file:**
```bash
cp .env.local.example .env.local
```

3. **Configure environment variables** (see Configuration section)

4. **Run development server:**
```bash
npm run dev
# or
yarn dev
```

---

## Configuration

### Backend Configuration (.env)

```env
# Django
DJANGO_SECRET_KEY=your-super-secret-key-here-change-in-production
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com

# Database
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=bff_db
DATABASE_USER=bff_user
DATABASE_PASSWORD=secure_password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# JWT
JWT_ACCESS_TOKEN_LIFETIME=15
JWT_REFRESH_TOKEN_LIFETIME=7

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@brighterfuture.org

# Token Expiration (hours)
EMAIL_VERIFICATION_TOKEN_EXPIRATION=24
PASSWORD_RESET_TOKEN_EXPIRATION=24

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration (.env.local)

```env
NEXT_PUBLIC_DJANGO_API_URL=http://localhost:8000/api
JWT_SECRET=change-this-secret-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

---

## API Endpoints

### Authentication Endpoints

#### Login
```
POST /api/auth/login/
Content-Type: application/json

Request:
{
  "username": "user123",
  "password": "SecurePassword123!"
}

Response (200):
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid-here",
    "username": "user123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "status": "active",
    "email_verified": true,
    "roles": [{"id": "role-uuid", "name": "member"}],
    "role_names": ["member"],
    "is_super_admin": false,
    "is_admin": false
  }
}
```

#### Register
```
POST /api/auth/register/
Content-Type: application/json

Request:
{
  "username": "newuser",
  "email": "newuser@example.com",
  "full_name": "Jane Doe",
  "phone": "+1234567890",
  "password": "SecurePassword123!",
  "password2": "SecurePassword123!"
}

Response (201):
{
  "id": "uuid-here",
  "username": "newuser",
  "email": "newuser@example.com",
  "message": "Registration successful. Check your email to verify."
}
```

#### Verify Email
```
POST /api/auth/verify-email/
Content-Type: application/json

Request:
{
  "token": "email-verification-token"
}

Response (200):
{
  "detail": "Email verified successfully",
  "user": {...user data...}
}
```

#### Request Password Reset
```
POST /api/auth/request-password-reset/
Content-Type: application/json

Request:
{
  "email": "user@example.com"
}

Response (200):
{
  "detail": "Password reset link sent to email"
}
```

#### Reset Password
```
POST /api/auth/reset-password/
Content-Type: application/json

Request:
{
  "token": "password-reset-token",
  "new_password": "NewPassword123!",
  "new_password_confirm": "NewPassword123!"
}

Response (200):
{
  "detail": "Password reset successfully"
}
```

#### Get Current User
```
GET /api/auth/me/
Authorization: Bearer {access_token}

Response (200):
{
  "id": "uuid-here",
  "username": "user123",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "status": "active",
  "email_verified": true,
  "roles": [...],
  "role_names": ["member"],
  "is_super_admin": false,
  "is_admin": false,
  "created_at": "2026-06-11T10:00:00Z",
  "updated_at": "2026-06-11T10:00:00Z"
}
```

#### Refresh Token
```
POST /api/auth/token/refresh/
Content-Type: application/json

Request:
{
  "refresh": "refresh-token"
}

Response (200):
{
  "access": "new-access-token",
  "refresh": "refresh-token"
}
```

### User Management Endpoints

#### List Users
```
GET /api/users/
Authorization: Bearer {access_token}
Permission: Admin only

Response (200):
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [...]
}
```

#### Get User Details
```
GET /api/users/{user-id}/
Authorization: Bearer {access_token}
Permission: Admin or self

Response (200):
{
  ...user data...
}
```

#### Change Password
```
POST /api/users/change-password/
Authorization: Bearer {access_token}

Request:
{
  "old_password": "CurrentPassword123!",
  "new_password": "NewPassword123!",
  "new_password_confirm": "NewPassword123!"
}

Response (200):
{
  "detail": "Password changed successfully"
}
```

#### Update Profile
```
POST /api/users/update-profile/
Authorization: Bearer {access_token}

Request:
{
  "full_name": "Updated Name",
  "phone": "+9876543210"
}

Response (200):
{
  ...updated user data...
}
```

#### Assign Role
```
POST /api/users/{user-id}/assign-role/
Authorization: Bearer {access_token}
Permission: Admin only

Request:
{
  "role_id": "role-uuid"
}

Response (200):
{
  ...user data with new role...
}
```

#### Remove Role
```
POST /api/users/{user-id}/remove-role/
Authorization: Bearer {access_token}
Permission: Admin only

Request:
{
  "role_id": "role-uuid"
}

Response (200):
{
  ...user data without role...
}
```

#### Suspend User
```
POST /api/users/{user-id}/suspend-user/
Authorization: Bearer {access_token}
Permission: Admin only

Request:
{
  "reason": "Violation of terms"
}

Response (200):
{
  ...user data with suspended status...
}
```

#### Activate User
```
POST /api/users/{user-id}/activate-user/
Authorization: Bearer {access_token}
Permission: Admin only

Response (200):
{
  ...user data with active status...
}
```

### Role Management Endpoints

#### List Roles
```
GET /api/roles/
Authorization: Bearer {access_token}
Permission: Super Admin only

Response (200):
{
  "count": 6,
  "results": [...]
}
```

#### Create Role
```
POST /api/roles/
Authorization: Bearer {access_token}
Permission: Super Admin only

Request:
{
  "name": "new_role",
  "description": "New custom role"
}

Response (201):
{
  "id": "role-uuid",
  "name": "new_role",
  "description": "New custom role",
  "is_active": true,
  "permission_count": 0
}
```

---

## Database Models

### User Model

```python
class User(AbstractUser):
    id = UUIDField(primary_key=True)
    full_name = CharField(max_length=255)
    phone = CharField(max_length=20)
    status = CharField(choices=['active', 'inactive', 'suspended', 'archived'])
    email_verified = BooleanField(default=False)
    email_verified_at = DateTimeField(null=True)
    last_password_change = DateTimeField(null=True)
    failed_login_attempts = IntegerField(default=0)
    locked_until = DateTimeField(null=True)
    roles = ManyToManyField(Role, through=UserRole)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### Role Model

```python
class Role(models.Model):
    id = UUIDField(primary_key=True)
    name = CharField(max_length=120, unique=True)
    description = TextField()
    permissions = ManyToManyField(Permission)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### EmailVerificationToken Model

```python
class EmailVerificationToken(models.Model):
    id = UUIDField(primary_key=True)
    user = OneToOneField(User, on_delete=CASCADE)
    token = CharField(max_length=255, unique=True)
    created_at = DateTimeField(auto_now_add=True)
    is_used = BooleanField(default=False)
```

### PasswordResetToken Model

```python
class PasswordResetToken(models.Model):
    id = UUIDField(primary_key=True)
    user = ForeignKey(User, on_delete=CASCADE)
    token = CharField(max_length=255, unique=True)
    created_at = DateTimeField(auto_now_add=True)
    is_used = BooleanField(default=False)
```

### AuditLog Model

```python
class AuditLog(models.Model):
    id = UUIDField(primary_key=True)
    user = ForeignKey(User, on_delete=CASCADE)
    action = CharField(max_length=50, choices=[...])
    ip_address = GenericIPAddressField()
    user_agent = TextField()
    details = JSONField()
    created_at = DateTimeField(auto_now_add=True)
```

---

## Usage Guide

### Frontend Usage

#### 1. Using AuthProvider and useAuth Hook

```tsx
// app/layout.tsx
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

#### 2. Login Example

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials.username, credentials.password);
      // Redirect to dashboard
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

#### 3. Register Example

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function RegisterPage() {
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    password: '',
    password2: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      // Show success message and redirect
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
```

#### 4. Protected Page Example

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1>Welcome, {user?.full_name}!</h1>
      <p>Email: {user?.email}</p>
      <p>Roles: {user?.role_names.join(', ')}</p>
    </div>
  );
}
```

#### 5. Using API Utilities

```tsx
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// GET request
const users = await apiGet<User[]>('/users');

// POST request
const newUser = await apiPost<User>('/users', {
  username: 'newuser',
  email: 'user@example.com',
});

// PATCH request
const updatedUser = await apiPatch<User>('/users/user-id', {
  full_name: 'Updated Name',
});

// DELETE request
await apiDelete('/users/user-id');
```

---

## Role & Permission System

### Default Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| super_admin | Super Administrator | All permissions |
| admin | Administrator | Manage users, roles, view all data |
| coordinator | Event Coordinator | Manage events, volunteers |
| volunteer | Volunteer | View events, manage own profile |
| donor | Donor | View impact, manage donations |
| member | Member | View public data, manage profile |

### Permission Classes

```python
# Super Admin check
@permission_classes([IsSuperAdmin])
def admin_view(request):
    pass

# Admin check
@permission_classes([IsAdmin])
def admin_panel(request):
    pass

# Coordinator check
@permission_classes([IsCoordinator])
def coordinator_view(request):
    pass

# Active user check
@permission_classes([IsActiveUser])
def active_users_only(request):
    pass

# Email verified check
@permission_classes([IsEmailVerified])
def verified_users_only(request):
    pass

# Combined permissions
@permission_classes([IsAuthenticated, IsActiveUser, IsEmailVerified])
def protected_view(request):
    pass
```

---

## Testing

### Run All Tests

```bash
python manage.py test accounts
```

### Run Specific Test Class

```bash
python manage.py test accounts.tests.UserModelTestCase
```

### Run Specific Test Method

```bash
python manage.py test accounts.tests.UserModelTestCase.test_create_user
```

### Test Coverage

Generate test coverage report:

```bash
pip install coverage
coverage run --source='accounts' manage.py test accounts
coverage report
coverage html
```

---

## Security Considerations

### Best Practices Implemented

1. **Password Security**
   - Bcrypt hashing (10 rounds)
   - Password validation (length, complexity)
   - Password change tracking
   - Password reset via secure token

2. **Token Security**
   - JWT with HS256 algorithm
   - HTTP-Only cookies (httpOnly flag)
   - Secure flag for HTTPS
   - SameSite=Lax for CSRF protection
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)

3. **Account Security**
   - Account lockout after 5 failed attempts
   - Email verification required
   - Failed login tracking
   - IP address & user agent logging
   - Account status management (active/suspended)

4. **API Security**
   - CORS protection
   - Rate limiting ready
   - Request validation
   - Audit logging
   - Permission-based access control

### Additional Security Measures

1. **Environment Variables** - Never commit secrets
2. **HTTPS** - Always use HTTPS in production
3. **Secret Key** - Change Django SECRET_KEY in production
4. **Debug Mode** - Disable DEBUG in production
5. **Allowed Hosts** - Configure ALLOWED_HOSTS properly
6. **Database** - Use strong database passwords
7. **Email** - Use app-specific passwords for email
8. **Monitoring** - Monitor audit logs regularly

---

## Production Deployment Checklist

- [ ] Set `DJANGO_DEBUG=False`
- [ ] Update `DJANGO_SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up HTTPS/SSL
- [ ] Configure email backend (Gmail, SendGrid, etc.)
- [ ] Set up PostgreSQL database
- [ ] Configure CORS properly
- [ ] Set up logging and monitoring
- [ ] Configure backup strategy
- [ ] Run database migrations
- [ ] Collect static files
- [ ] Test JWT token refresh
- [ ] Set up rate limiting
- [ ] Monitor audit logs
- [ ] Regular security audits

---

## Support & Troubleshooting

### Common Issues

**Q: JWT token is not being set in cookies**
A: Ensure your frontend is using `credentials: 'include'` in fetch requests.

**Q: Email verification email not received**
A: Check your email backend configuration and spam folder.

**Q: Token refresh not working**
A: Ensure refresh token cookie is being set and not expired.

**Q: Permission denied error**
A: Check user roles and permissions using Django admin.

---

## License

This authentication module is part of the BFF NGO Management System.

---

**Last Updated:** June 2026
**Version:** 1.0.0
