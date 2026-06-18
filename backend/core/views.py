from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Organization, Settings, Country, State, Notification, ActivityLog, FileUpload
from .serializers import (
    OrganizationSerializer,
    SettingsSerializer,
    CountrySerializer,
    StateSerializer,
    NotificationSerializer,
    ActivityLogSerializer,
    FileUploadSerializer,
)
from .services import get_dashboard_statistics


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]


class SettingsViewSet(viewsets.ModelViewSet):
    queryset = Settings.objects.select_related('organization').all()
    serializer_class = SettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def current(self, request):
        organization = Organization.objects.first()
        if not organization:
            return Response({'detail': 'No organization configured.'}, status=status.HTTP_404_NOT_FOUND)
        settings_instance, _ = Settings.objects.get_or_create(organization=organization)
        serializer = self.get_serializer(settings_instance)
        return Response(serializer.data)


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Country.objects.filter(active=True)
    serializer_class = CountrySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class StateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = State.objects.filter(active=True)
    serializer_class = StateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        country_id = self.request.query_params.get('country')
        if country_id:
            queryset = queryset.filter(country_id=country_id)
        return queryset


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.read = True
        notification.save(update_fields=['read'])
        return Response({'status': 'read'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(read=False).update(read=True)
        return Response({'status': 'all_read'})


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]


class FileUploadViewSet(viewsets.ModelViewSet):
    queryset = FileUpload.objects.filter(is_active=True)
    serializer_class = FileUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset


class DashboardStatisticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        stats = get_dashboard_statistics(user=request.user)
        return Response(stats, status=status.HTTP_200_OK)
