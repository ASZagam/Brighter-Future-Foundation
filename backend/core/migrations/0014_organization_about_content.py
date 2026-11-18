from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0013_program_coordinator_assignment_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="organizationprofile",
            name="about_intro",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="organizationprofile",
            name="about_disciplines",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="organizationprofile",
            name="disciplines_intro",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="organizationprofile",
            name="about_draft",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="organizationprofile",
            name="about_draft_banner",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="organization/banner/drafts/",
            ),
        ),
        migrations.AddField(
            model_name="organizationprofile",
            name="contact_intro",
            field=models.TextField(blank=True),
        ),
    ]
