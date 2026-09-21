# RBAC for the BFF backend

## Available roles

The shared role constants live in accounts.models.Roles and currently include:

- super_admin
- admin
- coordinator
- volunteer
- member
- donor

## Permission model

Use the reusable permissions from accounts.permissions:

- IsSuperAdmin
- IsAdmin
- IsCoordinator
- IsVolunteer
- IsMember
- IsAuthenticatedOrRole
- CanManageMember
- CanManageVolunteer

These classes work by checking the authenticated user and the assigned roles on the user model. Superusers and users with the super_admin role are always allowed.

## Protecting new ViewSets

For new DRF viewsets, add the permission class directly to the viewset:

```python
from accounts.permissions import IsAdmin

class ExampleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
```

For read-only endpoints, use IsAuthenticatedOrRole when the endpoint should be available to authenticated users and restricted for write actions.

## Object-level permissions

Use CanManageMember or CanManageVolunteer for object-level checks. These helpers allow admins and coordinators to manage records while letting volunteers edit only their own profile or related data.

## Creating future roles

1. Add the new role constant to accounts.models.Roles.
2. Add the corresponding display value in the Role model choices if needed.
3. Create a new permission class by subclassing HasRole when you need a dedicated rule.
