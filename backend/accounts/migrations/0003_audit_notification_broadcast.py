from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_seed_canonical_roles"),
    ]

    operations = [
        migrations.AlterField(
            model_name="auditlog",
            name="action",
            field=models.CharField(
                choices=[
                    ("login", "Login"),
                    ("logout", "Logout"),
                    ("password_change", "Password Change"),
                    ("password_reset", "Password Reset"),
                    ("email_verified", "Email Verified"),
                    ("role_assigned", "Role Assigned"),
                    ("role_removed", "Role Removed"),
                    ("notification_broadcast_sent", "Notification Broadcast Sent"),
                    ("account_locked", "Account Locked"),
                    ("account_unlocked", "Account Unlocked"),
                    ("failed_login", "Failed Login"),
                ],
                max_length=50,
            ),
        ),
    ]
