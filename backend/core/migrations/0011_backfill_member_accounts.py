from django.db import migrations
from django.utils import timezone


def backfill_member_accounts(apps, schema_editor):
    database = schema_editor.connection.alias
    Member = apps.get_model("core", "Member")
    UserRole = apps.get_model("accounts", "UserRole")
    members = Member.objects.using(database)
    member_roles = (
        UserRole.objects.using(database)
        .filter(role__name__iexact="member")
        .select_related("user")
        .order_by("user_id")
    )

    year_prefix = f"BFF-{timezone.now().year}-"
    next_number = 1
    existing_ids = members.filter(member_id__startswith=year_prefix).values_list(
        "member_id", flat=True
    )
    for member_id in existing_ids:
        try:
            next_number = max(next_number, int(member_id.rsplit("-", 1)[1]) + 1)
        except (IndexError, ValueError):
            continue

    for assignment in member_roles:
        user = assignment.user
        if members.filter(user_id=user.pk).exists():
            continue
        member = members.filter(email__iexact=user.email).first()
        if member:
            if member.user_id is None:
                member.user_id = user.pk
                member.save(using=database, update_fields=["user"])
            continue

        name_parts = (user.full_name or "").strip().split(maxsplit=1)
        first_name = user.first_name or (name_parts[0] if name_parts else user.username)
        last_name = user.last_name or (name_parts[1] if len(name_parts) > 1 else "")
        members.create(
            member_id=f"{year_prefix}{next_number:05d}",
            user_id=user.pk,
            first_name=first_name,
            last_name=last_name,
            email=user.email,
            phone=user.phone or "",
            gender="",
            state="",
            lga="",
            membership_type="regular",
            status="pending",
            registration_source="self_service",
        )
        next_number += 1


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_seed_canonical_roles"),
        ("core", "0010_member_created_by_member_registration_source"),
    ]

    operations = [
        migrations.RunPython(backfill_member_accounts, migrations.RunPython.noop),
    ]