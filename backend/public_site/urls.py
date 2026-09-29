from django.urls import path

from public_site import views

urlpatterns = [
    path("organization/", views.PublicOrganizationView.as_view(), name="public-organization"),
    path("impact-summary/", views.ImpactSummaryView.as_view(), name="public-impact-summary"),
    path("capabilities/", views.PublicCapabilityListView.as_view(), name="public-capabilities"),
    path("programs/", views.PublicProgramListView.as_view(), name="public-programs"),
    path("programs/<slug:slug>/", views.PublicProgramDetailView.as_view(), name="public-program-detail"),
    path("field-reports/", views.PublicFieldReportListView.as_view(), name="public-field-reports"),
    path("newsroom/", views.PublicNewsListView.as_view(), name="public-newsroom"),
    path("events/", views.PublicEventListView.as_view(), name="public-events"),
    path("gallery/", views.PublicGalleryListView.as_view(), name="public-gallery"),
    path("allocation/", views.PublicAllocationListView.as_view(), name="public-allocation"),
    path("transparency/", views.TransparencyView.as_view(), name="public-transparency"),
    path("newsletter/subscribe/", views.NewsletterSubscribeView.as_view(), name="public-newsletter-subscribe"),
    path("donations/", views.PublicDonationCreateView.as_view(), name="public-donation-create"),
]
