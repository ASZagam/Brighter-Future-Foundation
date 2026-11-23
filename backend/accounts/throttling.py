import hashlib

from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.throttling import ScopedRateThrottle


class LoginRateThrottle(ScopedRateThrottle):
    """Throttle login attempts per account and source IP."""

    def _identity(self, request):
        data = getattr(request, "data", None) or {}
        email = data.get("email")
        username = data.get("username")

        users = get_user_model().objects
        if email:
            account_id = users.filter(email__iexact=str(email).strip()).values_list("pk", flat=True).first()
        elif username:
            account_id = users.filter(username=str(username).strip()).values_list("pk", flat=True).first()
        else:
            account_id = None

        if account_id:
            return str(account_id)

        identifier = str(email or username or "").strip().lower()
        return hashlib.sha256(identifier.encode("utf-8")).hexdigest()

    def get_cache_key(self, request, view):
        scope = getattr(self, "scope", None) or getattr(view, self.scope_attr, None)
        if not scope:
            return None
        return self.cache_format % {
            "scope": scope,
            "ident": f"{self.get_ident(request)}_{self._identity(request)}",
        }

    @classmethod
    def clear(cls, request, view):
        throttle = cls()
        throttle.scope = getattr(view, cls.scope_attr, None)
        key = throttle.get_cache_key(request, view)
        if key:
            cache.delete(key)
