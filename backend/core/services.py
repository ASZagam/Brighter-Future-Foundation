from django.db.models import Count
from accounts.models import AuditLog
from .models import Organization, Settings, Country, State, Notification, ActivityLog, FileUpload


def get_dashboard_statistics(user=None):
    organization = None
    if user is not None and hasattr(user, 'notifications'):
        notifications = Notification.objects.filter(user=user)
    else:
        notifications = Notification.objects.none()

    return {
        'organizations': Organization.objects.count(),
        'countries': Country.objects.filter(active=True).count(),
        'states': State.objects.filter(active=True).count(),
        'active_uploads': FileUpload.objects.filter(is_active=True).count(),
        'pending_notifications': notifications.filter(read=False).count(),
        'activity_logs': AuditLog.objects.count(),
        'settings_count': Settings.objects.count(),
        'uploads_by_type': FileUpload.objects.values('upload_type').annotate(total=Count('id')).order_by('upload_type'),
    }
