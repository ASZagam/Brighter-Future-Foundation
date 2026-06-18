from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VolunteerViewSet, VolunteerSkillViewSet, VolunteerAssignmentViewSet

router = DefaultRouter()
router.register(r'volunteers', VolunteerViewSet, basename='volunteer')
router.register(r'volunteer-skills', VolunteerSkillViewSet, basename='volunteer-skill')
router.register(r'volunteer-assignments', VolunteerAssignmentViewSet, basename='volunteer-assignment')

urlpatterns = [
    path('', include(router.urls)),
]
