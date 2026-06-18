import uuid
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser, Permission, UserManager
from django.db import models
from django.utils import timezone


class Role(models.Model):
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    name = models.CharField(
        max_length=120,
        unique=True,
        choices=[
            ("super_admin", "Super Admin"),
            ("admin", "Administrator"),
            ("coordinator", "Coordinator"),
            ("volunteer", "Volunteer"),
            ("donor", "Donor"),
            ("member", "Member"),
        ],
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    permissions = models.ManyToManyField(Permission, blank=True)

    class Meta:
        verbose_name = "Role"
        verbose_name_plural = "Roles"
        ordering = ["name"]

    def __str__(self):
        return self.name


class User(AbstractUser):
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    full_name = models.CharField(blank=True, max_length=255)
    phone = models.CharField(blank=True, max_length=20)
    status = models.CharField(
        max_length=20,
        choices=[
            ("active", "Active"),
            ("inactive", "Inactive"),
            ("suspended", "Suspended"),
            ("archived", "Archived"),
        ],
        default="active",
    )
    email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(blank=True, null=True)
    last_password_change = models.DateTimeField(blank=True, null=True)
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    roles = models.ManyToManyField(
        Role,
        through="UserRole",
        through_fields=("user", "role"),
        blank=True,
    )

    objects = UserManager()

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_locked(self):
        return self.locked_until and self.locked_until > timezone.now()

    def lock_account(self, minutes: int = 30):
        self.locked_until = timezone.now() + timedelta(minutes=minutes)
        self.save(update_fields=["locked_until"])

    def increment_failed_login_attempts(self):
        self.failed_login_attempts += 1
        self.save(update_fields=["failed_login_attempts"])

    def reset_failed_login_attempts(self):
        self.failed_login_attempts = 0
        self.save(update_fields=["failed_login_attempts"])

    @property
    def is_super_admin(self):
        return self.is_superuser or self.roles.filter(name__iexact="super_admin").exists()

    def __str__(self):
        return self.full_name or self.username or self.email


class EmailVerificationToken(models.Model):
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    token = models.CharField(max_length=255, unique=True, default=lambda: str(uuid.uuid4()))
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_token",
    )

    class Meta:
        verbose_name = "Email Verification Token"
        verbose_name_plural = "Email Verification Tokens"

    def __str__(self):
        return f"EmailVerificationToken({self.user}, {self.token})"


class PasswordResetToken(models.Model):
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    token = models.CharField(max_length=255, unique=True, default=lambda: str(uuid.uuid4()))
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
    )

    class Meta:
        verbose_name = "Password Reset Token"
        verbose_name_plural = "Password Reset Tokens"
        ordering = ["-created_at"]

    def __str__(self):
        return f"PasswordResetToken({self.user}, {self.token})"


class AuditLog(models.Model):
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    ACTION_CHOICES = [
        ("login", "Login"),
        ("logout", "Logout"),
        ("password_change", "Password Change"),
        ("password_reset", "Password Reset"),
        ("email_verified", "Email Verified"),
        ("role_assigned", "Role Assigned"),
        ("role_removed", "Role Removed"),
        ("account_locked", "Account Locked"),
        ("account_unlocked", "Account Unlocked"),
        ("failed_login", "Failed Login"),
    ]
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    details = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="audit_logs",
    )

    class Meta:
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="accounts_au_user_id_14f360_idx"),
            models.Index(fields=["action", "-created_at"], name="accounts_au_action_f18cdc_idx"),
        ]

    def __str__(self):
        return f"AuditLog({self.user}, {self.action})"


class UserRole(models.Model):
    id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_roles",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "role")
        verbose_name = "User Role"
        verbose_name_plural = "User Roles"
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.user} → {self.role}"
