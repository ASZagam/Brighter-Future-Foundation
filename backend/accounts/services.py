from .models import AuditLog


class AuditService:

    @staticmethod
    def log(user, action, request=None, details=None):
        if not user:
            return None

        return AuditLog.objects.create(
            user=user,
            action=action,
            ip_address=(
                request.META.get("REMOTE_ADDR")
                if request else None
            ),
            user_agent=(
                request.META.get("HTTP_USER_AGENT", "")
                if request else ""
            ),
            details=details or {},
        )