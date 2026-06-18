from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemberViewSet, MembershipTypeViewSet, MembershipPaymentViewSet

router = DefaultRouter()
router.register(r'members', MemberViewSet, basename='member')
router.register(r'membership-types', MembershipTypeViewSet, basename='membership-type')
router.register(r'membership-payments', MembershipPaymentViewSet, basename='membership-payment')

urlpatterns = [
    path('', include(router.urls)),
]
