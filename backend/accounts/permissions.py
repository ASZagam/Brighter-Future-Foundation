from typing import Iterable

from django.db.models import Model
from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Roles


class HasRole(BasePermission):
    """Strict role gate.

    Requires authentication and, unless the user is a Django superuser or holds
    the ``super_admin`` role, membership of one of ``allowed_roles``. Unlike the
    previous implementation this does NOT grant a blanket read bypass: read
    access is decided by the same role list, so sensitive resources stay
    restricted. Resources that are safe for every authenticated user to read
    should use :class:`AuthenticatedReadAdminWrite` instead.
    """

    allowed_roles: Iterable[str] = ()

    def _is_privileged(self, user) -> bool:
        return bool(getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False))

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if self._is_privileged(user):
            return True
        return user.has_any_role(*self.allowed_roles)

    def has_object_permission(self, request, view, obj: Model) -> bool:
        return self.has_permission(request, view)


class IsSuperAdmin(HasRole):
    allowed_roles = (Roles.SUPER_ADMIN,)


class IsAdmin(HasRole):
    """Administrator only (superusers/super_admins bypass). Strict for reads too."""

    allowed_roles = (Roles.ADMIN,)


class IsAdminOrCoordinator(HasRole):
    allowed_roles = (Roles.ADMIN, Roles.COORDINATOR)


class IsCoordinator(HasRole):
    allowed_roles = (Roles.COORDINATOR,)


class IsVolunteer(HasRole):
    allowed_roles = (Roles.VOLUNTEER,)


class IsMember(HasRole):
    allowed_roles = (Roles.MEMBER,)


class AuthenticatedReadAdminWrite(HasRole):
    """Any authenticated user may read; only admins (or super users) may write."""

    allowed_roles = (Roles.ADMIN,)

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if self._is_privileged(user):
            return True
        if request.method in SAFE_METHODS:
            return True
        return user.has_any_role(*self.allowed_roles)


class AuthenticatedReadAdminCoordinatorWrite(AuthenticatedReadAdminWrite):
    """Any authenticated user may read; admins/coordinators may write."""

    allowed_roles = (Roles.ADMIN, Roles.COORDINATOR)


class IsAuthenticatedOrRole(AuthenticatedReadAdminCoordinatorWrite):
    """Deprecated alias.

    Historically this class let *every* authenticated user write. It now maps to
    the safe default (authenticated read, admin/coordinator write). Kept so that
    any un-migrated viewset fails closed rather than open.
    """


class CanManageMember(BasePermission):
    """Organisation-wide member management: admin/coordinator only.

    Members read their own record through ``GET /api/core/members/me/`` which is
    gated by plain authentication.
    """

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False):
            return True
        return user.has_any_role(Roles.ADMIN, Roles.COORDINATOR)

    def has_object_permission(self, request, view, obj: Model) -> bool:
        return self.has_permission(request, view)


class CanManageVolunteer(BasePermission):
    """Volunteer management.

    Org-wide reads and all create/delete/privileged actions require
    admin/coordinator. A volunteer may read and update *their own* record (used
    by the self-service profile), but cannot create, delete, or perform
    administrative actions on it.
    """

    PRIVILEGED_ACTIONS = {
        "create",
        "destroy",
        "batch_log_hours",
        "export",
        "suspend",
        "reactivate",
        "reassign",
        "dashboard",
        "stats",
    }

    def _is_privileged(self, user) -> bool:
        return bool(getattr(user, "is_superuser", False) or getattr(user, "is_super_admin", False))

    def _is_manager(self, user) -> bool:
        return user.has_any_role(Roles.ADMIN, Roles.COORDINATOR)

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if self._is_privileged(user):
            return True
        if self._is_manager(user):
            return True

        action = getattr(view, "action", None)
        if request.method in SAFE_METHODS:
            return False
        if action in self.PRIVILEGED_ACTIONS:
            return False
        # update/partial_update may be permitted for the object owner below.
        return action in {"update", "partial_update"}

    def has_object_permission(self, request, view, obj: Model) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if self._is_privileged(user) or self._is_manager(user):
            return True
        return self._is_owner(obj, user)

    @staticmethod
    def _is_owner(obj: Model, user) -> bool:
        volunteer_user = getattr(obj, "user", None)
        if getattr(obj, "member", None) is not None:
            volunteer_user = getattr(obj.member, "user", None)
        return volunteer_user is not None and volunteer_user == user
