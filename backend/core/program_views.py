from django.db.models import Count, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsAdmin, IsAuthenticatedOrRole
from .models import Program, ProgramBeneficiary, ProgramCategory, ProgramDocument, ProgramGallery, ProgramReport, ProgramVolunteerAssignment
from .serializers import (
    ProgramBeneficiarySerializer,
    ProgramCategorySerializer,
    ProgramDocumentSerializer,
    ProgramGallerySerializer,
    ProgramReportSerializer,
    ProgramSerializer,
    ProgramVolunteerAssignmentSerializer,
)


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.select_related("category", "country", "state", "manager", "coordinator").exclude(is_deleted=True)
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticatedOrRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "category", "state", "manager", "coordinator", "priority"]
    search_fields = ["title", "description", "objectives", "category__name", "manager__full_name", "state__name", "lga"]
    ordering_fields = ["created_at", "start_date", "budget", "updated_at", "title"]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update"}:
            if self.request.user.is_authenticated and (
                self.request.user.is_superuser
                or self.request.user.is_super_admin
                or self.request.user.is_admin
                or self.request.user.is_coordinator
            ):
                return [permissions.IsAuthenticated()]
            return [IsAuthenticatedOrRole()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticatedOrRole()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        program = self.get_object()
        if not (request.user.is_superuser or request.user.is_super_admin or request.user.is_admin):
            return Response({"detail": "You do not have permission to delete programs."}, status=status.HTTP_403_FORBIDDEN)
        program.soft_delete(deleted_by=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="dashboard", name="program-dashboard")
    def dashboard(self, request):
        queryset = Program.objects.filter(is_deleted=False)
        total_budget = queryset.aggregate(total_budget=Sum("budget"))["total_budget"] or 0
        total_spent = queryset.aggregate(total_spent=Sum("amount_spent"))["total_spent"] or 0
        data = {
            "total_programs": queryset.count(),
            "active_programs": queryset.filter(status="active").count(),
            "completed_programs": queryset.filter(status="completed").count(),
            "cancelled_programs": queryset.filter(status="cancelled").count(),
            "total_budget": float(total_budget),
            "total_spent": float(total_spent),
            "remaining_budget": float(total_budget - total_spent),
            "total_beneficiaries": sum(program.beneficiary_count for program in queryset),
            "programs_by_category": list(queryset.values("category__name").annotate(count=Count("id")).values("category__name", "count")),
            "programs_by_status": list(queryset.values("status").annotate(count=Count("id")).values("status", "count")),
            "programs_by_state": list(queryset.values("state__name").annotate(count=Count("id")).values("state__name", "count")),
        }
        return Response(data)


class ProgramCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProgramCategory.objects.all()
    serializer_class = ProgramCategorySerializer
    permission_classes = [IsAuthenticatedOrRole]


class ProgramBeneficiaryViewSet(viewsets.ModelViewSet):
    queryset = ProgramBeneficiary.objects.select_related("program").all()
    serializer_class = ProgramBeneficiarySerializer
    permission_classes = [IsAuthenticatedOrRole]


class ProgramDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProgramDocument.objects.select_related("program", "uploaded_by").all()
    serializer_class = ProgramDocumentSerializer
    permission_classes = [IsAuthenticatedOrRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["program", "document_type"]
    search_fields = ["title"]
    ordering_fields = ["uploaded_at", "title"]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ProgramGalleryViewSet(viewsets.ModelViewSet):
    queryset = ProgramGallery.objects.select_related("program", "uploaded_by").all()
    serializer_class = ProgramGallerySerializer
    permission_classes = [IsAuthenticatedOrRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["program", "published"]
    search_fields = ["caption"]
    ordering_fields = ["uploaded_at", "id"]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ProgramReportViewSet(viewsets.ModelViewSet):
    queryset = ProgramReport.objects.select_related("program", "submitted_by").all()
    serializer_class = ProgramReportSerializer
    permission_classes = [IsAuthenticatedOrRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["program"]
    search_fields = ["title", "summary"]
    ordering_fields = ["submitted_at", "title"]

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)


class ProgramVolunteerAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProgramVolunteerAssignment.objects.select_related("program", "volunteer").all()
    serializer_class = ProgramVolunteerAssignmentSerializer
    permission_classes = [IsAuthenticatedOrRole]

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)
