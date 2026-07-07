from django.contrib import admin
from .models import (
    Organization,
    Settings,
    Country,
    State,
    Notification,
    ActivityLog,
    FileUpload,
    OrganizationProfile,
    Member,
    Volunteer,
    VolunteerHourLog,
    Program
)



@admin.register(OrganizationProfile)
class OrganizationProfileAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "founder_name",
        "email",
        "phone",
        "is_active",
    )

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'legal_name', 'email', 'phone', 'website', 'created_at')
    search_fields = ('name', 'legal_name', 'email', 'phone')
    list_filter = ('country',)


@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    list_display = ('organization', 'maintenance_mode', 'enable_file_uploads', 'max_upload_size_mb')
    search_fields = ('organization__name', 'support_email')
    raw_id_fields = ('organization',)


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'iso_code', 'calling_code', 'active')
    search_fields = ('name', 'iso_code', 'iso3_code')
    list_filter = ('active',)


@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'code', 'active')
    search_fields = ('name', 'code', 'country__name')
    list_filter = ('country', 'active')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'read', 'sent_at')
    search_fields = ('title', 'message', 'user__username', 'user__email')
    list_filter = ('notification_type', 'read', 'sent_at')


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'user', 'category', 'ip_address', 'created_at')
    search_fields = ('action', 'category', 'user__username')
    list_filter = ('category',)
    readonly_fields = ('created_at',)


@admin.register(FileUpload)
class FileUploadAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'organization', 'upload_type', 'content_type', 'size', 'is_active', 'created_at')
    search_fields = ('title', 'description', 'user__username', 'organization__name')
    list_filter = ('upload_type', 'is_active', 'created_at')
    readonly_fields = ('content_type', 'size', 'created_at', 'updated_at')


# core/admin.py

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):

    list_display = (
        "member_id",
        "full_name",
        "membership_type",
        "status",
        "phone",
    )

    search_fields = (
        "member_id",
        "first_name",
        "last_name",
        "email",
    )

    list_filter = (
        "membership_type",
        "status",
        "state",
    )


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):

    list_display = (
        "volunteer_id",
        "member",
        "status",
        "volunteer_hours",
    )

    search_fields = (
        "volunteer_id",
        "member__first_name",
        "member__last_name",
    )

    list_filter = (
        "status",
    )


@admin.register(VolunteerHourLog)
class VolunteerHourLogAdmin(admin.ModelAdmin):

    list_display = (
        "volunteer",
        "hours",
        "activity",
        "activity_date",
    )


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):

    list_display = (
        "program_id",
        "title",
        "status",
        "start_date",
        "budget",
    )

    search_fields = (
        "title",
        "program_id",
    )

    list_filter = (
        "status",
        "is_featured",
    )

    prepopulated_fields = {
        "slug": ("title",)
    }