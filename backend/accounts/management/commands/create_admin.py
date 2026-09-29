"""
Create (or repair) an administrator account that can actually sign in.

`createsuperuser` alone is not enough for this project: `AuthLoginView` rejects any
account whose `email_verified` is False, so a plain superuser is unable to log in.
This command creates the user, marks the email as verified, and attaches the `admin`
(or `super_admin`) role that the permission classes check for.

Usage:
    python manage.py create_admin
    python manage.py create_admin --username admin --email admin@bff.org
    python manage.py create_admin --username lead --email lead@bff.org --role super_admin
    python manage.py create_admin --username admin --password 'S3cret!pass'  # non-interactive
    python manage.py create_admin --username admin --superuser

Re-running on an existing username resets its password, re-verifies the email and
ensures the role, so it doubles as a repair tool.
"""

from getpass import getpass

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from accounts.models import Role

VALID_ROLES = ["super_admin", "admin", "coordinator", "volunteer", "member", "donor"]


class Command(BaseCommand):
    help = "Create or repair an admin account with a verified email and the admin role."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="admin", help="Username (default: admin)")
        parser.add_argument(
            "--email",
            default="admin@bff.org",
            help="Email address (default: admin@bff.org)",
        )
        parser.add_argument(
            "--role",
            default="admin",
            choices=VALID_ROLES,
            help="Role to attach (default: admin)",
        )
        parser.add_argument(
            "--password",
            default=None,
            help="Password. Omit to be prompted without echo.",
        )
        parser.add_argument(
            "--superuser",
            action="store_true",
            help="Also set is_superuser/is_staff (bypasses every role check).",
        )

    def _resolve_password(self, provided):
        if provided:
            return provided
        password = getpass("Password: ")
        if not password:
            raise CommandError("A password is required.")
        if password != getpass("Confirm password: "):
            raise CommandError("Passwords did not match.")
        return password

    def handle(self, *args, **options):
        User = get_user_model()
        username = options["username"].strip()
        email = options["email"].strip()
        role_name = options["role"]
        password = self._resolve_password(options["password"])

        role, _ = Role.objects.get_or_create(
            name=role_name,
            defaults={"description": f"Attached by the create_admin management command."},
        )

        user = User.objects.filter(username=username).first()
        if user is None:
            user = User(username=username, email=email)
            action = "created"
        else:
            action = "updated"
            user.email = email

        user.set_password(password)
        user.status = "active"
        user.email_verified = True
        user.email_verified_at = timezone.now()
        user.failed_login_attempts = 0
        user.locked_until = None
        if options["superuser"]:
            user.is_superuser = True
            user.is_staff = True
        user.save()

        user.roles.add(role)

        verb = "Created" if action == "created" else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} {user.username} <{user.email}>"))
        self.stdout.write(f"  role(s):  {', '.join(r.name for r in user.roles.all())}")
        self.stdout.write(f"  verified: {user.email_verified}")
        self.stdout.write(f"  superuser: {user.is_superuser}")
        self.stdout.write("")
        self.stdout.write(f"Sign in at /auth/login with username '{user.username}'.")
