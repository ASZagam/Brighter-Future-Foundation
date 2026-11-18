from django.db import transaction
from django.db.models import Count, Q, Sum
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from accounts.models import Roles
from accounts.permissions import (
    AuthenticatedReadAdminCoordinatorWrite,
    IsAdmin,
    IsAdminOrCoordinator,
)
from .models import (
    Program,
    ProgramBeneficiary,
    ProgramCategory,
    ProgramDocument,
    ProgramGallery,
    ProgramReport,
    ProgramStaffAssignment,
    ProgramStatus,
    ProgramVolunteerAssignment,
    Notification,
)
from .serializers import (
    ProgramBeneficiarySerializer,
    ProgramCategorySerializer,
    ProgramDocumentSerializer,
    ProgramGallerySerializer,
    ProgramReportSerializer,
    AssignedProgramDetailsSerializer,
    ProgramAssignableUserSerializer,
    ProgramSerializer,
    ProgramStaffAssignmentSerializer,
    ProgramVolunteerAssignmentSerializer,
)


def is_platform_program_manager(user):
    return bool(
        user.is_superuser
        or getattr(user, "is_super_admin", False)
        or user.has_any_role(Roles.ADMIN, Roles.COORDINATOR)
    )


def can_manage_program(user, program):
    if is_platform_program_manager(user):
        return True
    return ProgramStaffAssignment.objects.filter(
        program=program,
        user=user,
        role_in_program="program_coordinator",
        is_active=True,
    ).exists()


def notify_program_team(program, actor, title, message):
    staff_ids = ProgramStaffAssignment.objects.filter(
        program=program,
        is_active=True,
        user__is_active=True,
        user__status="active",
    ).values_list("user_id", flat=True)
    volunteer_ids = ProgramVolunteerAssignment.objects.filter(
        program=program,
        is_active=True,
        volunteer__user__isnull=False,
        volunteer__user__is_active=True,
        volunteer__user__status="active",
    ).values_list("volunteer__user_id", flat=True)
    recipients = set(staff_ids).union(volunteer_ids)
    if program.manager_id:
        recipients.add(program.manager_id)
    if program.coordinator_id:
        recipients.add(program.coordinator_id)
    recipients.discard(actor.pk)
    active_recipients = set(
        get_user_model().objects.filter(
            pk__in=recipients,
            is_active=True,
            status="active",
        ).values_list("pk", flat=True)
    )
    return Notification.objects.bulk_create(
        [
            Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=Notification.NotificationType.INFO,
                category="Programs",
                metadata={"program_id": program.program_id},
            )
            for user_id in active_recipients
        ]
    )


class CanManageProgramContent(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if is_platform_program_manager(request.user):
            return True
        if getattr(view, "action", None) != "create":
            return True
        program_id = request.data.get("program")
        return bool(
            program_id
            and ProgramStaffAssignment.objects.filter(
                program_id=program_id,
                user=request.user,
                role_in_program="program_coordinator",
                is_active=True,
            ).exists()
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return can_manage_program(request.user, obj.program)


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.select_related(
        "category", "country", "state", "manager", "coordinator"
    ).prefetch_related(
        "staff_assignments__user",
        "volunteer_assignments__volunteer",
    ).exclude(is_deleted=True)
    serializer_class = ProgramSerializer
    permission_classes = [AuthenticatedReadAdminCoordinatorWrite]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "category", "state", "manager", "coordinator", "priority"]
    search_fields = ["title", "description", "objectives", "category__name", "manager__full_name", "state__name", "lga"]
    ordering_fields = ["created_at", "start_date", "budget", "updated_at", "title"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAdmin()]
        if self.action == "dashboard":
            return [IsAdminOrCoordinator()]
        if self.action in {"update_assigned_status", "remind_team"}:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        program = self.get_object()
        program.soft_delete(deleted_by=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="mine", name="my-programs")
    def mine(self, request):
        """Programs where the current user is manager or coordinator."""
        queryset = self.get_queryset().filter(Q(manager=request.user) | Q(coordinator=request.user))
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="assigned-to-me",
        name="assigned-programs",
        permission_classes=[permissions.IsAuthenticated],
    )
    def assigned_to_me(self, request):
        """Return program details only for assignments belonging to this user."""
        results = []
        seen_program_ids = set()
        staff_assignments = ProgramStaffAssignment.objects.filter(
            user=request.user,
            is_active=True,
            program__is_deleted=False,
        ).select_related(
            "program",
            "program__state",
            "program__manager",
            "program__coordinator",
        ).prefetch_related("program__staff_assignments__user", "program__volunteer_assignments__volunteer")
        for assignment in staff_assignments:
            seen_program_ids.add(assignment.program_id)
            results.append({
                "id": str(assignment.id),
                "assignment_type": "staff",
                "assigned_role": assignment.get_role_in_program_display(),
                "notes": assignment.notes,
                "assigned_at": assignment.assigned_at,
                "can_manage": can_manage_program(request.user, assignment.program),
                "program": AssignedProgramDetailsSerializer(assignment.program).data,
            })

        volunteer = getattr(request.user, "volunteer_profile", None)
        if volunteer is not None:
            volunteer_assignments = ProgramVolunteerAssignment.objects.filter(
                volunteer=volunteer,
                is_active=True,
                program__is_deleted=False,
            ).select_related(
                "program",
                "program__state",
                "program__manager",
                "program__coordinator",
            ).prefetch_related("program__staff_assignments__user", "program__volunteer_assignments__volunteer")
            for assignment in volunteer_assignments:
                if assignment.program_id in seen_program_ids:
                    continue
                seen_program_ids.add(assignment.program_id)
                results.append({
                    "id": str(assignment.id),
                    "assignment_type": "volunteer",
                    "assigned_role": "Volunteer",
                    "notes": assignment.notes,
                    "assigned_at": assignment.assigned_at,
                    "can_manage": can_manage_program(request.user, assignment.program),
                    "program": AssignedProgramDetailsSerializer(assignment.program).data,
                })

        managed_programs = Program.objects.filter(
            Q(manager=request.user) | Q(coordinator=request.user),
            is_deleted=False,
        ).select_related("state", "manager", "coordinator").prefetch_related(
            "staff_assignments__user",
            "volunteer_assignments__volunteer",
        )
        for program in managed_programs:
            if program.pk in seen_program_ids:
                continue
            roles = []
            if program.manager_id == request.user.pk:
                roles.append("Program Manager")
            if program.coordinator_id == request.user.pk:
                roles.append("Program Coordinator")
            seen_program_ids.add(program.pk)
            results.append({
                "id": str(program.pk),
                "assignment_type": "management",
                "assigned_role": " & ".join(roles),
                "notes": "",
                "assigned_at": program.created_at,
                "can_manage": can_manage_program(request.user, program),
                "program": AssignedProgramDetailsSerializer(program).data,
            })

        results.sort(
            key=lambda item: (
                item["program"]["start_date"] or "9999-12-31",
                item["program"]["title"].lower(),
            )
        )
        return Response(results)

    @action(detail=True, methods=["post"], url_path="team-status", name="assigned-team-status")
    def update_assigned_status(self, request, pk=None):
        program = self.get_object()
        if not can_manage_program(request.user, program):
            return Response({"detail": "You are not the coordinator for this program."}, status=status.HTTP_403_FORBIDDEN)
        new_status = request.data.get("status")
        coordinator_statuses = {
            ProgramStatus.PLANNING,
            ProgramStatus.ACTIVE,
            ProgramStatus.COMPLETED,
            ProgramStatus.CANCELLED,
        }
        if new_status not in coordinator_statuses:
            raise ValidationError({"status": "Choose planning, active, completed, or cancelled."})
        with transaction.atomic():
            if program.status != new_status:
                program.status = new_status
                program.updated_by = request.user
                program.save(update_fields=["status", "updated_by", "updated_at"])
                notify_program_team(
                    program,
                    request.user,
                    f"Program status updated: {program.title}",
                    f"The status of {program.program_id} has been updated to {program.get_status_display()}.",
                )
        return Response({"status": program.status})

    @action(detail=True, methods=["post"], url_path="remind-team", name="remind-program-team")
    def remind_team(self, request, pk=None):
        program = self.get_object()
        if not can_manage_program(request.user, program):
            return Response({"detail": "You are not the coordinator for this program."}, status=status.HTTP_403_FORBIDDEN)
        message = (request.data.get("message") or "").strip()
        if not message or len(message) > 2000:
            raise ValidationError({"message": "Enter a reminder message of up to 2,000 characters."})
        notifications = notify_program_team(
            program,
            request.user,
            f"Team reminder: {program.title}",
            message,
        )
        if not notifications:
            raise ValidationError({"team": "There are no other active team members to remind."})
        return Response({"recipient_count": len(notifications)}, status=status.HTTP_201_CREATED)

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
    permission_classes = [AuthenticatedReadAdminCoordinatorWrite]


class ProgramBeneficiaryViewSet(viewsets.ModelViewSet):
    queryset = ProgramBeneficiary.objects.select_related("program").all()
    serializer_class = ProgramBeneficiarySerializer
    permission_classes = [IsAdminOrCoordinator]


class ProgramDocumentViewSet(viewsets.ModelViewSet):
    queryset = ProgramDocument.objects.select_related("program", "uploaded_by").all()
    serializer_class = ProgramDocumentSerializer
    permission_classes = [IsAdminOrCoordinator]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["program", "document_type"]
    search_fields = ["title"]
    ordering_fields = ["uploaded_at", "title"]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ProgramGalleryViewSet(viewsets.ModelViewSet):
    queryset = ProgramGallery.objects.select_related("program", "uploaded_by").all()
    serializer_class = ProgramGallerySerializer
    permission_classes = [CanManageProgramContent]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["program", "published"]
    search_fields = ["caption"]
    ordering_fields = ["uploaded_at", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not (
            user.is_superuser
            or getattr(user, "is_super_admin", False)
            or user.has_any_role("admin", "coordinator")
        ):
            queryset = queryset.filter(published=True)
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ProgramReportViewSet(viewsets.ModelViewSet):
    queryset = ProgramReport.objects.select_related("program", "submitted_by").all()
    serializer_class = ProgramReportSerializer
    permission_classes = [CanManageProgramContent]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["program"]
    search_fields = ["title", "summary"]
    ordering_fields = ["submitted_at", "title"]

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)


class ProgramVolunteerAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProgramVolunteerAssignment.objects.select_related("program", "volunteer").all()
    serializer_class = ProgramVolunteerAssignmentSerializer
    permission_classes = [IsAdminOrCoordinator]

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

    @action(
        detail=False,
        methods=["get"],
        url_path="me",
        name="my-program-assignments",
        permission_classes=[permissions.IsAuthenticated],
    )
    def me(self, request):
        volunteer = getattr(request.user, "volunteer_profile", None)
        if volunteer is None:
            return Response([], status=status.HTTP_200_OK)
        queryset = self.get_queryset().filter(volunteer=volunteer)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ProgramStaffAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ProgramStaffAssignment.objects.select_related("program", "user", "assigned_by").all()
    serializer_class = ProgramStaffAssignmentSerializer
    permission_classes = [IsAdminOrCoordinator]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["program", "user", "role_in_program", "is_active"]
    search_fields = ["user__full_name", "user__email", "notes"]
    ordering_fields = ["assigned_at", "role_in_program"]

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)

    @action(
        detail=False,
        methods=["get"],
        url_path="eligible-users",
        name="eligible-program-users",
        permission_classes=[IsAdminOrCoordinator],
    )
    def eligible_users(self, request):
        users = get_user_model().objects.filter(
            is_active=True,
            status="active",
        ).prefetch_related("roles").order_by("full_name", "username")
        return Response(ProgramAssignableUserSerializer(users, many=True).data)

    @action(
        detail=False,
        methods=["get"],
        url_path="me",
        name="my-program-staff-assignments",
        permission_classes=[permissions.IsAuthenticated],
    )
    def me(self, request):
        """All program staff assignments for the current logged-in user."""
        queryset = self.get_queryset().filter(user=request.user, is_active=True).select_related(
            "program", "program__state", "program__country", "program__manager", "program__coordinator"
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
