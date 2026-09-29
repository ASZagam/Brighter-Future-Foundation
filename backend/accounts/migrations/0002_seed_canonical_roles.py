from django.db import migrations

CANONICAL_ROLES = [
    ("super_admin", "Super administrator with unrestricted access."),
    ("admin", "Administrator with full operational and configuration access."),
    ("coordinator", "Manages programs, volunteers, members and operational records."),
    ("volunteer", "Volunteer with access to their own assignments and shift logs."),
    ("member", "Registered foundation member."),
    ("donor", "Donor with access to foundation updates and public events."),
]


def seed_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    for name, description in CANONICAL_ROLES:
        Role.objects.get_or_create(name=name, defaults={"description": description})


def unseed_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.filter(name__in=[name for name, _ in CANONICAL_ROLES]).delete()


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [migrations.RunPython(seed_roles, unseed_roles)]
