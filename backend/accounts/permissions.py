from typing import Iterable

from django.db.models import Model
from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Roles


class HasRole(BasePermission):
    allowed_roles: Iterable[str] = ()

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_super_admin:
            return True
        if request.method in SAFE_METHODS:
            return True

        return request.user.has_any_role(*self.allowed_roles)


class IsSuperAdmin(HasRole):
    allowed_roles = (Roles.SUPER_ADMIN,)


class IsAdmin(HasRole):
    allowed_roles = (Roles.ADMIN,)


class IsCoordinator(HasRole):
    allowed_roles = (Roles.COORDINATOR,)


class IsVolunteer(HasRole):
    allowed_roles = (Roles.VOLUNTEER,)


class IsMember(HasRole):
    allowed_roles = (Roles.MEMBER,)


class IsAuthenticatedOrRole(HasRole):
    allowed_roles = ()

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_super_admin:
            return True
        if request.method in SAFE_METHODS:
            return True
        return True


class CanManageVolunteer(BasePermission):
    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_super_admin:
            return True
        if request.method in SAFE_METHODS:
            return True
        return request.user.has_any_role(Roles.ADMIN, Roles.COORDINATOR)

    def has_object_permission(self, request, view, obj: Model) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_super_admin:
            return True
        if request.method in SAFE_METHODS:
            return True
        if request.user.has_any_role(Roles.ADMIN, Roles.COORDINATOR):
            return True

        volunteer_user = getattr(obj, "user", None)
        if hasattr(obj, "member") and getattr(obj, "member", None):
            volunteer_user = getattr(obj.member, "user", None)

        return volunteer_user is not None and volunteer_user == request.user


class CanManageMember(BasePermission):
    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_super_admin:
            return True
        if request.method in SAFE_METHODS:
            return True
        return request.user.has_any_role(Roles.ADMIN, Roles.COORDINATOR)

    def has_object_permission(self, request, view, obj: Model) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or request.user.is_super_admin:
            return True
        if request.method in SAFE_METHODS:
            return True
        return request.user.has_any_role(Roles.ADMIN, Roles.COORDINATOR)
