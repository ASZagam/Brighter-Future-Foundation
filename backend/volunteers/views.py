from rest_framework import viewsets, permissions
from .models import Volunteer, VolunteerSkill, VolunteerAssignment
from .serializers import VolunteerSerializer, VolunteerSkillSerializer, VolunteerAssignmentSerializer


class VolunteerViewSet(viewsets.ModelViewSet):
    queryset = Volunteer.objects.select_related('user').prefetch_related('skills')
    serializer_class = VolunteerSerializer
    permission_classes = [permissions.IsAuthenticated]


class VolunteerSkillViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VolunteerSkill.objects.all()
    serializer_class = VolunteerSkillSerializer
    permission_classes = [permissions.IsAuthenticated]


class VolunteerAssignmentViewSet(viewsets.ModelViewSet):
    queryset = VolunteerAssignment.objects.select_related('volunteer', 'volunteer__user')
    serializer_class = VolunteerAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
