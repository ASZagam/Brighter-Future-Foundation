from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .program_views import (
    ProgramBeneficiaryViewSet,
    ProgramCategoryViewSet,
    ProgramDocumentViewSet,
    ProgramGalleryViewSet,
    ProgramReportViewSet,
    ProgramViewSet,
    ProgramVolunteerAssignmentViewSet,
)
from .views import (
    ActivityLogViewSet,
    CountryViewSet,
    DashboardStatisticsView,
    DonationViewSet,
    EventViewSet,
    FileUploadViewSet,
    MemberViewSet,
    NotificationViewSet,
    NewsPostViewSet,
    OrganizationProfileView,
    OrganizationViewSet,
    SettingsViewSet,
    StateViewSet,
    PublicShowcaseView,
    SystemInfoView,
    VolunteerHourLogViewSet,
    VolunteerSkillViewSet,
    VolunteerViewSet,
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
router.register("volunteer-skills",VolunteerSkillViewSet)
router.register(r"programs", ProgramViewSet, basename="programs")
router.register(r"program-categories", ProgramCategoryViewSet, basename="program-category")
router.register(r"program-beneficiaries", ProgramBeneficiaryViewSet, basename="program-beneficiary")
router.register(r"program-documents", ProgramDocumentViewSet, basename="program-document")
router.register(r"program-gallery", ProgramGalleryViewSet, basename="program-gallery")
router.register(r"program-reports", ProgramReportViewSet, basename="program-report")
router.register(r"program-volunteer-assignments", ProgramVolunteerAssignmentViewSet, basename="program-volunteer-assignment")
router.register(r"donations", DonationViewSet, basename="donation")
router.register(r"events", EventViewSet, basename="event")
router.register(r"news", NewsPostViewSet, basename="news")


urlpatterns = [
    path('', include(router.urls)),
    path('programs/dashboard/', ProgramViewSet.as_view({'get': 'dashboard'}), name='program-dashboard'),
    path('dashboard-statistics/', DashboardStatisticsView.as_view(), name='dashboard-statistics'),
    path('system-info/', SystemInfoView.as_view(), name='system-info'),
    path('public-showcase/', PublicShowcaseView.as_view(), name='public-showcase'),
    path('organization/', OrganizationProfileView.as_view(), name='organization-profile'),
]


urlpatterns += router.urls