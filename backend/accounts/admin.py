from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, AuditLog, Role, UserRole


class RoleFilter(admin.SimpleListFilter):
    title = "role"
    parameter_name = "role"

    def lookups(self, request, model_admin):
        return [(role.name, role.get_name_display() or role.name) for role in Role.objects.all()]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(roles__name=self.value())
        return queryset


class UserRoleInline(admin.TabularInline):
    model = UserRole
    fk_name = "user"
    extra = 1


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    inlines = [UserRoleInline]

    list_display = ("email", "username", "email_verified", "is_staff", "is_active", "get_roles")
    list_filter = ("is_staff", "is_active", "email_verified", RoleFilter)
    search_fields = ("email", "username", "full_name", "roles__name")
    ordering = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("username", "full_name", "phone")}),
        ("Permissions", {"fields": ("is_staff", "is_active", "email_verified", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2"),
        }),
    )

    readonly_fields = ("date_joined",)

    def get_roles(self, obj):
        return ", ".join(role.name for role in obj.roles.all())

    get_roles.short_description = "Roles"


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "description")


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "assigned_by", "assigned_at")
    list_filter = ("role", "assigned_at")
    search_fields = ("user__email", "user__username", "role__name")




@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "action",
        "ip_address",
        "created_at",
    )

    list_filter = (
        "action",
        "created_at",
    )

    search_fields = (
        "user__username",
        "user__email",
    )

    readonly_fields = (
        "user",
        "action",
        "ip_address",
        "user_agent",
        "details",
        "created_at",
    )

    ordering = ("-created_at",)