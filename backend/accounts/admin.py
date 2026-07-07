from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from .models import AuditLog


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = ("email", "username", "email_verified", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active", "email_verified")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("username",)}),
        ("Permissions", {"fields": ("is_staff", "is_active", "email_verified", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2"),
        }),
    )

    search_fields = ("email", "username")
    ordering = ("email",)




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