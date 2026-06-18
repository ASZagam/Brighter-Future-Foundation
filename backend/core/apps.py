from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"
    verbose_name = "Core Foundation"

    def ready(self):
        # Import signal handlers to ensure ActivityLogs are created on changes
        try:
            import core.signals  # noqa: F401
        except Exception:
            pass
