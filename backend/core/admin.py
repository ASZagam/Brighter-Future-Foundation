from django.contrib import admin
from .models import (
    Organization,
    Settings,
    Country,
    State,
    Notification,
    ActivityLog,
    FileUpload,
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
