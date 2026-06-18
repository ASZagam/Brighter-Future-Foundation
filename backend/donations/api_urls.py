from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DonorViewSet, CampaignViewSet, DonationViewSet, TransactionViewSet

router = DefaultRouter()
router.register(r'donors', DonorViewSet, basename='donor')
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'donations', DonationViewSet, basename='donation')
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('', include(router.urls)),
]
