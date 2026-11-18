from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0012_programstaffassignment"),
    ]

    operations = [
        migrations.AlterField(
            model_name="programstaffassignment",
            name="role_in_program",
            field=models.CharField(
                choices=[
                    ("program_coordinator", "Program Coordinator"),
                    ("team_lead", "Team Lead"),
                    ("volunteer", "Volunteer"),
                    ("field_officer", "Field Officer"),
                    ("medical_officer", "Medical Officer"),
                    ("logistics", "Logistics Officer"),
                    ("finance", "Finance Officer"),
                    ("communication", "Communication Officer"),
                    ("monitoring", "M&E Officer"),
                    ("other", "Other"),
                ],
                default="other",
                max_length=50,
            ),
        ),
    ]
