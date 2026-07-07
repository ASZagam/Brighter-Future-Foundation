from rest_framework.routers import DefaultRouter
from django.urls import include, path
from .views import (
    OrganizationViewSet,
    SettingsViewSet,
    CountryViewSet,
    StateViewSet,
    NotificationViewSet,
    ActivityLogViewSet,
    FileUploadViewSet,
    DashboardStatisticsView,
    OrganizationProfileView,
    MemberViewSet,
    VolunteerViewSet,
    VolunteerHourLogViewSet,
    ProgramViewSet

)

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'settings', SettingsViewSet, basename='settings')
router.register(r'countries', CountryViewSet, basename='country')
router.register(r'states', StateViewSet, basename='state')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log')
router.register(r'file-uploads', FileUploadViewSet, basename='file-upload')
router.register(r"members",MemberViewSet,basename="members")
router.register("volunteers",VolunteerViewSet)
router.register("volunteer-hours",VolunteerHourLogViewSet)
router.register("programs",ProgramViewSet,basename="programs")


urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-statistics/', DashboardStatisticsView.as_view(), name='dashboard-statistics'),
    path("organization/",OrganizationProfileView.as_view(), name="organization-profile"),
]


urlpatterns += router.urls