from rest_framework import viewsets, permissions, status, generics

from accounts.permissions import IsAdmin, IsAuthenticatedOrRole, CanManageMember, CanManageVolunteer
from accounts.services import AuditService
from accounts.models import AuditLog as AccountAuditLog

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from .models import Organization, Settings, Country, State, Notification, FileUpload, Member, MembershipStatus, MembershipType, Volunteer, VolunteerHourLog, Program, Donation, Event, NewsPost, VolunteerSkill, VolunteerAttendance, VolunteerStatus, ProgramGallery
from .serializers import (
    OrganizationSerializer,
    SettingsSerializer,
    CountrySerializer,
    StateSerializer,
    NotificationSerializer,
    AuditLogSerializer,
    FileUploadSerializer,
    OrganizationProfileSerializer,
    MemberSerializer,
    VolunteerSerializer,
    VolunteerSkillSerializer,
    VolunteerHourLogSerializer,
    ProgramSerializer,
    DonationSerializer,
    EventSerializer,
    NewsPostSerializer,

)
from .services import get_dashboard_statistics
from .permissions import IsOrganizationAdmin
from .models import OrganizationProfile
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated



from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend

import csv
import io
from datetime import date, timedelta
from decimal import Decimal, InvalidOperation
from django.db import transaction
from django.http import HttpResponse, StreamingHttpResponse
from django.utils import timezone










class ProgramViewSet(viewsets.ModelViewSet):

    queryset = Program.objects.all()

    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticatedOrRole]

    filterset_fields = [
        "status",
        "is_featured",
    ]

    search_fields = [
        "title",
        "description",
        "location",
    ]

    ordering_fields = [
        "created_at",
        "start_date",
        "budget",
    ]


    

class MemberViewSet(viewsets.ModelViewSet):

    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [CanManageMember]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "member_id",
        "first_name",
        "last_name",
        "email",
        "phone",
    ]

    filterset_fields = [
        "membership_type",
        "status",
        "state",
    ]

    ordering_fields = [
        "created_at",
        "joined_at",
        "first_name",
    ]

    def perform_create(self, serializer):
        member = serializer.save()
        AuditService.log(
            user=self.request.user,
            action="member_created",
            request=self.request,
            details={"member_id": member.member_id, "full_name": member.full_name},
        )

    def perform_update(self, serializer):
        member = serializer.save()
        AuditService.log(
            user=self.request.user,
            action="member_updated",
            request=self.request,
            details={"member_id": member.member_id},
        )

    def perform_destroy(self, instance):
        member_ref = instance.member_id
        instance.delete()
        AuditService.log(
            user=self.request.user,
            action="member_deleted",
            request=self.request,
            details={"member_id": member_ref},
        )

    @action(detail=False, methods=["get"], url_path="stats", name="member-stats")
    def stats(self, request):
        base = Member.objects.all()
        total = base.count()
        active = base.filter(status=MembershipStatus.ACTIVE).count()
        pending = base.filter(status=MembershipStatus.PENDING).count()
        suspended = base.filter(status=MembershipStatus.SUSPENDED).count()
        inactive = base.filter(status=MembershipStatus.INACTIVE).count()
        archived = base.filter(status=MembershipStatus.ARCHIVED).count()
        beneficiaries = base.filter(membership_type=MembershipType.BENEFICIARY).count()
        states = list(
            base.exclude(state="").values_list("state", flat=True).distinct().order_by("state")
        )

        return Response(
            {
                "kpis": {
                    "total_members": total,
                    "active": active,
                    "pending": pending,
                    "suspended": suspended,
                    "inactive": inactive,
                    "archived": archived,
                    "beneficiaries": beneficiaries,
                    "states_covered": len(states),
                },
                "tabs": {
                    "all": total,
                    "pending": pending,
                    "active": active,
                    "beneficiaries": beneficiaries,
                    "suspended": suspended,
                },
                "options": {
                    "states": states,
                    "membership_types": [{"value": v, "label": l} for v, l in MembershipType.choices],
                    "statuses": [{"value": v, "label": l} for v, l in MembershipStatus.choices],
                },
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="export", name="member-export")
    def export(self, request):
        rows = self.filter_queryset(self.get_queryset()).order_by("first_name", "last_name")

        def generate():
            buffer = io.StringIO()
            writer = csv.writer(buffer)
            writer.writerow(
                ["Member ID", "Full Name", "Email", "Phone", "Gender", "Date of Birth",
                 "State", "LGA", "Occupation", "Membership Type", "Status", "Joined"]
            )
            for member in rows.iterator(chunk_size=500):
                writer.writerow(
                    [
                        member.member_id,
                        member.full_name,
                        member.email,
                        member.phone,
                        member.gender,
                        member.date_of_birth.isoformat() if member.date_of_birth else "",
                        member.state,
                        member.lga,
                        member.occupation,
                        member.membership_type,
                        member.status,
                        member.joined_at.isoformat() if member.joined_at else "",
                    ]
                )
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)

        response = StreamingHttpResponse(generate(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="member-registry.csv"'
        AuditService.log(user=request.user, action="member_exported", request=request, details={"scope": "filtered"})
        return response

    @action(detail=True, methods=["post"], url_path="set-status", name="member-set-status")
    def set_status(self, request, pk=None):
        member = self.get_object()
        new_status = (request.data.get("status") or "").strip().lower()
        valid = {value for value, _label in MembershipStatus.choices}
        if new_status not in valid:
            return Response(
                {"error": f"status must be one of: {', '.join(sorted(valid))}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        member.status = new_status
        member.save(update_fields=["status", "updated_at"])
        AuditService.log(
            user=request.user,
            action="member_status_changed",
            request=request,
            details={"member_id": member.member_id, "status": new_status},
        )
        return Response({"status": new_status, "member": MemberSerializer(member).data})


class VolunteerViewSet(viewsets.ModelViewSet):

    queryset = Volunteer.objects.select_related(
        "member",
        "user",
    ).prefetch_related("skills", "program_assignments__program", "hour_logs")

    serializer_class = VolunteerSerializer

    permission_classes = [CanManageVolunteer]

    search_fields = [
        "volunteer_id",
        "full_name",
        "first_name",
        "last_name",
        "email",
        "phone",
        "skills__name",
        "member__first_name",
        "member__last_name",
        "member__email",
    ]

    filterset_fields = [
        "status",
        "squad",
        "availability",
    ]

    ordering_fields = [
        "created_at",
        "volunteer_hours",
        "full_name",
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    def get_queryset(self):
        queryset = super().get_queryset().filter(is_deleted=False)
        request = self.request

        cluster = request.query_params.get("cluster")
        if cluster:
            queryset = queryset.filter(state__iexact=cluster)

        specialization = request.query_params.get("specialization")
        if specialization:
            queryset = queryset.filter(skills__name__iexact=specialization)

        deployment = request.query_params.get("deployment_status")
        if deployment == "deployed":
            queryset = queryset.filter(status=VolunteerStatus.ACTIVE, program_assignments__is_active=True)
        elif deployment == "standby":
            queryset = queryset.filter(
                status=VolunteerStatus.ACTIVE,
                program_assignments__is_active=False,
            ).exclude(program_assignments__is_active=True)
        elif deployment == "on_leave":
            queryset = queryset.filter(status=VolunteerStatus.ON_LEAVE)
        elif deployment == "pending_signoff":
            queryset = queryset.filter(hour_logs__approval_status="pending").distinct()
        elif deployment == "inactive":
            queryset = queryset.filter(status=VolunteerStatus.INACTIVE)
        elif deployment == "suspended":
            queryset = queryset.filter(status=VolunteerStatus.SUSPENDED)
        elif deployment == "pending":
            queryset = queryset.filter(status=VolunteerStatus.PENDING)

        return queryset.distinct()

    @action(detail=False, methods=["get"], url_path="dashboard", name="volunteer-dashboard")
    def dashboard(self, request):
        queryset = self.get_queryset()
        data = {
            "total_volunteers": queryset.count(),
            "active_volunteers": queryset.filter(status="active").count(),
            "pending_volunteers": queryset.filter(status="pending").count(),
            "inactive_volunteers": queryset.filter(status="inactive").count(),
            "suspended_volunteers": queryset.filter(status="suspended").count(),
            "archived_volunteers": queryset.filter(status="archived").count(),
            "total_hours": int(sum(volunteer.volunteer_hours for volunteer in queryset)),
            "volunteers_by_status": list(
                queryset.values("status").annotate(count=Count("id")).values("status", "count")
            ),
        }
        return Response(data)

    @action(detail=False, methods=["get"], url_path="stats", name="volunteer-stats")
    def stats(self, request):
        base = Volunteer.objects.filter(is_deleted=False)
        today = timezone.now().date()
        year_start = date(today.year, 1, 1)
        week_start = today - timedelta(days=today.weekday())

        total = base.count()
        active = base.filter(status=VolunteerStatus.ACTIVE)
        currently_deployed = base.filter(
            status=VolunteerStatus.ACTIVE,
            program_assignments__is_active=True,
        ).distinct()
        standby = active.exclude(id__in=currently_deployed.values_list("id", flat=True))
        on_leave = base.filter(status=VolunteerStatus.ON_LEAVE)
        suspended = base.filter(status=VolunteerStatus.SUSPENDED)

        pending_logs = VolunteerHourLog.objects.filter(approval_status="pending")
        signoff_volunteers = base.filter(hour_logs__approval_status="pending").distinct()

        approved_logs = VolunteerHourLog.objects.filter(approval_status="approved")
        logged_hours_ytd = approved_logs.filter(date__gte=year_start).aggregate(total=Sum("hours"))["total"] or 0
        shift_logs_count = VolunteerHourLog.objects.filter(date__gte=year_start).count()

        compliance_denominator = VolunteerHourLog.objects.count()
        compliance = round((approved_logs.count() / compliance_denominator) * 100, 1) if compliance_denominator else None

        on_site_week = VolunteerAttendance.objects.filter(
            attendance_date__gte=week_start,
            volunteer__isnull=False,
        ).values("volunteer").distinct().count()

        high_priority = currently_deployed.filter(
            program_assignments__program__priority__in=["high", "critical"]
        ).distinct().count()

        within_sla = pending_logs.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()

        clusters = [
            {"name": value, "count": count}
            for value, count in sorted(
                base.exclude(state="").values_list("state").annotate(count=Count("id")).order_by(),
                key=lambda row: row[1],
                reverse=True,
            )
        ]

        specializations = list(
            VolunteerSkill.objects.filter(is_active=True).values_list("name", flat=True).order_by("name")
        )

        return Response(
            {
                "kpis": {
                    "total_field_volunteers": total,
                    "active": active.count(),
                    "active_deployment": currently_deployed.count(),
                    "standby": standby.count(),
                    "on_leave": on_leave.count(),
                    "on_site_this_week": on_site_week,
                    "clusters_active": len(clusters),
                    "clusters": clusters,
                    "logged_hours_ytd": float(logged_hours_ytd),
                    "shift_logs_count": shift_logs_count,
                    "avg_hours_per_week": round(float(logged_hours_ytd) / max(today.isocalendar()[1], 1), 1),
                    "pending_verification": pending_logs.count(),
                    "high_priority": high_priority,
                    "within_sla": within_sla,
                    "compliance": compliance,
                },
                "tabs": {
                    "all": total,
                    "active_deployment": currently_deployed.count(),
                    "standby": standby.count(),
                    "pending_signoff": signoff_volunteers.count(),
                    "on_leave": on_leave.count(),
                    "suspended": suspended.count(),
                    "pending": base.filter(status=VolunteerStatus.PENDING).count(),
                },
                "options": {
                    "clusters": [c["name"] for c in clusters],
                    "specializations": specializations,
                    "statuses": [{"value": s[0], "label": s[1]} for s in VolunteerStatus.choices],
                    "equipment": ["ODK & KoboToolbox"],
                },
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="export", name="volunteer-export")
    def export(self, request):
        rows = self.get_queryset().select_related("member", "user").prefetch_related("skills").order_by("full_name")

        def generate():
            buffer = io.StringIO()
            writer = csv.writer(buffer)
            writer.writerow(
                ["Volunteer ID", "Full Name", "Email", "Phone", "Gender", "Cluster", "Squad",
                 "Status", "Deployment", "Specializations", "Total Hours", "Last Shift", "Compliance %"]
            )
            for volunteer in rows.iterator(chunk_size=500):
                writer.writerow(
                    [
                        volunteer.volunteer_id,
                        volunteer.full_name,
                        volunteer.email,
                        volunteer.phone,
                        volunteer.gender,
                        volunteer.cluster,
                        volunteer.squad,
                        volunteer.status,
                        volunteer.deployment_status,
                        "|".join(volunteer.specializations),
                        volunteer.approved_hours,
                        volunteer.last_shift["date"] if volunteer.last_shift else "",
                        volunteer.compliance_score if volunteer.compliance_score is not None else "",
                    ]
                )
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)

        response = StreamingHttpResponse(generate(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="volunteers-timesheet.csv"'
        AuditService.log(user=request.user, action="volunteer_timesheet_exported", request=request, details={"scope": "filtered"})
        return response

    @action(detail=False, methods=["post"], url_path="batch-log-hours", name="volunteer-batch-log-hours")
    def batch_log_hours(self, request):
        volunteer_ids = request.data.get("volunteer_ids") or []
        if not isinstance(volunteer_ids, list):
            volunteer_ids = [volunteer_ids]
        if not volunteer_ids:
            return Response({"error": "No volunteers selected."}, status=status.HTTP_400_BAD_REQUEST)

        hours = request.data.get("hours")
        try:
            hours = int(hours)
        except (TypeError, ValueError):
            return Response({"error": "hours must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)
        if hours <= 0:
            return Response({"error": "hours must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        shift_date = request.data.get("date") or timezone.now().date().isoformat()
        program = None
        program_ref = request.data.get("program_id")
        if program_ref:
            program = Program.objects.filter(program_id=program_ref).first()

        activity = request.data.get("activity") or "Field operations"
        notes = request.data.get("notes", "")
        location = request.data.get("location", "")

        created = []
        with transaction.atomic():
            for pid in volunteer_ids:
                volunteer = Volunteer.objects.filter(pk=pid, is_deleted=False).first()
                if not volunteer:
                    continue
                log = VolunteerHourLog.objects.create(
                    volunteer=volunteer,
                    program=program,
                    activity=activity,
                    date=shift_date,
                    hours=hours,
                    notes=notes,
                    location=location,
                    approval_status=VolunteerHourLog.ApprovalStatus.PENDING,
                )
                created.append(VolunteerHourLogSerializer(log).data)
                AuditService.log(
                    user=request.user,
                    action="hours_logged",
                    request=request,
                    details={"volunteer_id": volunteer.volunteer_id, "hours": hours, "shift_id": log.shift_id},
                )
        return Response({"created": created, "count": len(created)}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="reassign", name="volunteer-reassign")
    def reassign(self, request, pk=None):
        volunteer = self.get_object()
        squad = (request.data.get("squad") or "").strip()
        if not squad:
            return Response({"error": "squad is required."}, status=status.HTTP_400_BAD_REQUEST)
        volunteer.squad = squad
        volunteer.save(update_fields=["squad", "updated_at"])
        AuditService.log(
            user=request.user,
            action="volunteer_reassigned",
            request=request,
            details={"volunteer_id": volunteer.volunteer_id, "squad": squad},
        )
        return Response({"status": "reassigned", "squad": squad, "volunteer": VolunteerSerializer(volunteer).data})

    @action(detail=True, methods=["post"], url_path="suspend", name="volunteer-suspend")
    def suspend(self, request, pk=None):
        volunteer = self.get_object()
        reason = (request.data.get("reason") or "").strip()
        if not reason:
            return Response({"error": "reason is required."}, status=status.HTTP_400_BAD_REQUEST)
        volunteer.status = VolunteerStatus.SUSPENDED
        volunteer.save(update_fields=["status", "updated_at"])
        AuditService.log(
            user=request.user,
            action="volunteer_suspended",
            request=request,
            details={"volunteer_id": volunteer.volunteer_id, "reason": reason},
        )
        return Response({"status": "suspended", "volunteer": VolunteerSerializer(volunteer).data})

    @action(detail=True, methods=["post"], url_path="reactivate", name="volunteer-reactivate")
    def reactivate(self, request, pk=None):
        volunteer = self.get_object()
        if volunteer.status != VolunteerStatus.SUSPENDED:
            return Response({"error": "Only suspended volunteers can be reactivated."}, status=status.HTTP_400_BAD_REQUEST)
        volunteer.status = VolunteerStatus.ACTIVE
        volunteer.on_leave_until = None
        volunteer.save(update_fields=["status", "on_leave_until", "updated_at"])
        AuditService.log(
            user=request.user,
            action="volunteer_reactivated",
            request=request,
            details={"volunteer_id": volunteer.volunteer_id},
        )
        return Response({"status": "active", "volunteer": VolunteerSerializer(volunteer).data})

    @action(detail=True, methods=["get"], url_path="id-card", name="volunteer-id-card")
    def id_card(self, request, pk=None):
        volunteer = self.get_object()
        pdf = build_volunteer_id_card(volunteer)
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="id-card-{volunteer.volunteer_id}.pdf"'
        AuditService.log(user=request.user, action="volunteer_id_card_generated", request=request, details={"volunteer_id": volunteer.volunteer_id})
        return response

    @action(detail=False, methods=["get"], url_path="locations", name="volunteer-locations")
    def locations(self, request):
        base = Volunteer.objects.filter(is_deleted=False, latitude__isnull=False, longitude__isnull=False)
        data = []
        for volunteer in base.select_related("member").prefetch_related("program_assignments__program")[:300]:
            data.append(
                {
                    "volunteer_id": volunteer.volunteer_id,
                    "full_name": volunteer.full_name,
                    "cluster": volunteer.cluster,
                    "squad": volunteer.squad,
                    "status": volunteer.deployment_status,
                    "latitude": float(volunteer.latitude),
                    "longitude": float(volunteer.longitude),
                    "last_gps_at": volunteer.last_gps_at.isoformat() if volunteer.last_gps_at else None,
                    "deployment": volunteer.active_deployment.title if volunteer.active_deployment else None,
                }
            )
        return Response({"locations": data, "count": len(data)})


class VolunteerSkillViewSet(
    viewsets.ReadOnlyModelViewSet
):
    queryset = VolunteerSkill.objects.all()
    serializer_class = VolunteerSkillSerializer
    permission_classes = [CanManageVolunteer]
    pagination_class = None


class VolunteerHourLogViewSet(
    viewsets.ModelViewSet
):

    queryset = VolunteerHourLog.objects.select_related(
        "volunteer",
        "volunteer__member",
        "program",
    )

    serializer_class = VolunteerHourLogSerializer

    permission_classes = [CanManageVolunteer]

    filter_backends = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "approval_status",
        "volunteer",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.request
        volunteer_ref = request.query_params.get("volunteer_id")
        if volunteer_ref:
            queryset = queryset.filter(volunteer__volunteer_id=volunteer_ref)
        date_from = request.query_params.get("date_from")
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        date_to = request.query_params.get("date_to")
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        program = request.query_params.get("program_id")
        if program:
            queryset = queryset.filter(program__program_id=program)
        return queryset

    @action(detail=True, methods=["post"], url_path="approve", name="log-approve")
    def approve(self, request, pk=None):
        log = self.get_object()
        if log.approval_status == VolunteerHourLog.ApprovalStatus.APPROVED:
            return Response({"error": "This shift has already been approved."}, status=status.HTTP_400_BAD_REQUEST)
        log.approval_status = VolunteerHourLog.ApprovalStatus.APPROVED
        log.approved_by = request.user
        log.notes = request.data.get("notes", log.notes)
        log.save(update_fields=["approval_status", "approved_by", "notes", "updated_at"])
        AuditService.log(
            user=request.user,
            action="hours_approved",
            request=request,
            details={"volunteer_id": log.volunteer.volunteer_id, "shift_id": log.shift_id, "hours": log.hours},
        )
        return Response(VolunteerHourLogSerializer(log).data)

    @action(detail=True, methods=["post"], url_path="reject", name="log-reject")
    def reject(self, request, pk=None):
        log = self.get_object()
        if log.approval_status != VolunteerHourLog.ApprovalStatus.PENDING:
            return Response({"error": "Only pending shifts can be rejected."}, status=status.HTTP_400_BAD_REQUEST)
        log.approval_status = VolunteerHourLog.ApprovalStatus.REJECTED
        log.approved_by = request.user
        log.notes = request.data.get("notes", log.notes)
        log.save(update_fields=["approval_status", "approved_by", "notes", "updated_at"])
        AuditService.log(
            user=request.user,
            action="hours_rejected",
            request=request,
            details={"volunteer_id": log.volunteer.volunteer_id, "shift_id": log.shift_id},
        )
        return Response(VolunteerHourLogSerializer(log).data)

    @action(detail=True, methods=["post"], url_path="query", name="log-query")
    def query(self, request, pk=None):
        from .models import VolunteerHourLog as VHL
        log = self.get_object()
        note = (request.data.get("note") or "").strip()
        if not note:
            return Response({"error": "A query note is required."}, status=status.HTTP_400_BAD_REQUEST)
        if log.approval_status == VHL.ApprovalStatus.APPROVED:
            return Response({"error": "Approved shifts cannot be queried."}, status=status.HTTP_400_BAD_REQUEST)
        log.query_note = note
        log.queried_by = request.user
        log.queried_at = timezone.now()
        log.approval_status = VHL.ApprovalStatus.PENDING
        log.save(update_fields=["query_note", "queried_by", "queried_at", "approval_status", "updated_at"])
        AuditService.log(
            user=request.user,
            action="shift_queried",
            request=request,
            details={"volunteer_id": log.volunteer.volunteer_id, "shift_id": log.shift_id, "note": note},
        )
        return Response(VolunteerHourLogSerializer(log).data)









class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAdmin]


# core/views.py
class OrganizationProfileView(
    generics.RetrieveUpdateAPIView
):

    serializer_class = OrganizationProfileSerializer
    permission_classes = [IsAdmin]

    def get_object(self):
        obj, _ = OrganizationProfile.objects.get_or_create(
            name="Brighter Future Foundation"
        )
        return obj

class SettingsViewSet(viewsets.ModelViewSet):
    queryset = Settings.objects.select_related('organization').all()
    serializer_class = SettingsSerializer
    permission_classes = [IsAdmin]

    @action(detail=False, methods=['get'])
    def current(self, request):
        organization = Organization.objects.first()
        if not organization:
            organization = Organization.objects.create(
                name="Brighter Future Foundation",
                legal_name="Brighter Future Foundation",
                abbreviation="BFF",
                email="support@bff.org",
            )
            AuditService.log(
                user=request.user,
                action="organization_created",
                request=request,
                details={"organization": organization.name, "source": "settings_default"},
            )
        settings_instance, _ = Settings.objects.get_or_create(organization=organization)
        serializer = self.get_serializer(settings_instance)
        return Response(serializer.data)


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Country.objects.filter(active=True)
    serializer_class = CountrySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["active"]
    search_fields = ["name", "iso_code", "iso3_code", "calling_code"]
    ordering_fields = ["name", "iso_code", "id"]


class StateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = State.objects.filter(active=True)
    serializer_class = StateSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["country", "active"]
    search_fields = ["name", "code", "country__name"]
    ordering_fields = ["name", "code", "id"]

    def get_queryset(self):
        queryset = super().get_queryset()
        country_id = self.request.query_params.get('country')
        if country_id:
            queryset = queryset.filter(country_id=country_id)
        return queryset


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticatedOrRole]

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
    queryset = AccountAuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]


class FileUploadViewSet(viewsets.ModelViewSet):
    queryset = FileUpload.objects.filter(is_active=True)
    serializer_class = FileUploadSerializer
    permission_classes = [IsAuthenticatedOrRole]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["upload_type"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "size", "title"]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset

    @action(detail=False, methods=["get"], url_path="stats", name="file-upload-stats")
    def stats(self, request):
        base = self.get_queryset()
        images = base.filter(upload_type="image").count()
        documents = base.filter(upload_type="document").count()
        total_size = base.aggregate(total=Sum("size")).get("total") or 0
        return Response(
            {
                "kpis": {
                    "total": base.count(),
                    "images": images,
                    "documents": documents,
                    "total_size_bytes": total_size,
                }
            },
            status=status.HTTP_200_OK,
        )


class DashboardStatisticsView(APIView):
    permission_classes = [IsAuthenticatedOrRole]

    def get(self, request):
        stats = get_dashboard_statistics(user=request.user)
        return Response(stats, status=status.HTTP_200_OK)


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticatedOrRole]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "campaign"]
    search_fields = ["donor_name", "donor_email", "reference", "campaign"]
    ordering_fields = ["donated_at", "amount", "donor_name"]

    def perform_create(self, serializer):
        donation = serializer.save(created_by=self.request.user)
        AuditService.log(
            user=self.request.user,
            action="donation_recorded",
            request=self.request,
            details={"reference": donation.reference, "amount": str(donation.amount)},
        )

    @action(detail=False, methods=["get"], url_path="stats", name="donation-stats")
    def stats(self, request):
        base = Donation.objects.all()
        completed = base.filter(status=Donation.Status.COMPLETED)
        pending = base.filter(status=Donation.Status.PENDING)
        failed = base.filter(status=Donation.Status.FAILED)
        total = base.aggregate(total=Sum("amount")).get("total") or Decimal("0")
        completed_total = completed.aggregate(total=Sum("amount")).get("total") or Decimal("0")
        campaigns = list(
            base.exclude(campaign="").values_list("campaign", flat=True).distinct().order_by("campaign")
        )
        return Response(
            {
                "kpis": {
                    "total_donations": base.count(),
                    "total_amount": str(total),
                    "completed_amount": str(completed_total),
                    "completed": completed.count(),
                    "pending": pending.count(),
                    "failed": failed.count(),
                    "campaigns": len(campaigns),
                },
                "options": {
                    "campaigns": campaigns,
                    "statuses": [{"value": v, "label": l} for v, l in Donation.Status.choices],
                },
            },
            status=status.HTTP_200_OK,
        )


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related("created_by").all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrRole]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_public"]
    search_fields = ["title", "description", "location"]
    ordering_fields = ["start_date", "end_date", "created_at", "title"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="stats", name="event-stats")
    def stats(self, request):
        base = Event.objects.all()
        now = timezone.now()
        upcoming = base.filter(start_date__gte=now)
        past = base.filter(end_date__lt=now)
        return Response(
            {
                "kpis": {
                    "total_events": base.count(),
                    "upcoming": upcoming.count(),
                    "past": past.count(),
                    "public": base.filter(is_public=True).count(),
                    "total_capacity": base.aggregate(total=Sum("capacity")).get("total") or 0,
                }
            },
            status=status.HTTP_200_OK,
        )


class NewsPostViewSet(viewsets.ModelViewSet):
    queryset = NewsPost.objects.select_related("author").all()
    serializer_class = NewsPostSerializer
    permission_classes = [IsAuthenticatedOrRole]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["published", "category"]
    search_fields = ["title", "body", "category", "image_caption"]
    ordering_fields = ["published_at", "created_at", "title"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(published=True)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=False, methods=["get"], url_path="stats", name="news-stats")
    def stats(self, request):
        base = self.get_queryset()
        categories = list(
            base.exclude(category="").values_list("category", flat=True).distinct().order_by("category")
        )
        return Response(
            {
                "kpis": {
                    "total_posts": base.count(),
                    "published": base.filter(published=True).count(),
                    "drafts": base.filter(published=False).count(),
                    "categories": len(categories),
                },
                "options": {"categories": categories},
            },
            status=status.HTTP_200_OK,
        )


class PublicShowcaseView(APIView):
    """
    Public, read-only feed for the marketing site: published news posts and
    published program gallery photos, each with their captions.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        news = (
            NewsPost.objects.filter(published=True)
            .order_by("-published_at", "-created_at")[:6]
        )
        gallery = (
            ProgramGallery.objects.filter(published=True, program__is_deleted=False)
            .select_related("program")
            .order_by("-uploaded_at")[:12]
        )

        news_data = [
            {
                "id": str(item.id),
                "title": item.title,
                "body": item.body,
                "category": item.category,
                "cover_image": request.build_absolute_uri(item.cover_image.url) if item.cover_image else None,
                "image_caption": item.image_caption,
                "published_at": item.published_at or item.created_at,
            }
            for item in news
        ]
        gallery_data = [
            {
                "id": item.id,
                "image": request.build_absolute_uri(item.image.url) if item.image else None,
                "caption": item.caption,
                "program": str(item.program_id),
                "program_title": item.program.title if item.program else "",
            }
            for item in gallery
        ]
        return Response({"news": news_data, "gallery": gallery_data}, status=status.HTTP_200_OK)


class SystemInfoView(APIView):
    """
    Read-only live system/stack telemetry for the operations console.
    Exposes framework versions, database vendor, and registry counters.
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        import django
        import platform
        import rest_framework
        from django.conf import settings as django_settings
        from django.db import connection

        counts = {
            "members": Member.objects.count(),
            "volunteers": Volunteer.objects.count(),
            "programs": Program.objects.count(),
            "donations": Donation.objects.count(),
            "states_active": State.objects.filter(active=True).count(),
            "organizations": Organization.objects.count(),
        }

        db_name = connection.settings_dict.get("NAME")
        db_host = connection.settings_dict.get("HOST")

        return Response(
            {
                "backend": {
                    "host": django_settings.ALLOWED_HOSTS,
                    "debug": bool(django_settings.DEBUG),
                    "timezone": django_settings.TIME_ZONE,
                    "settings_module": django_settings.SETTINGS_MODULE,
                },
                "frameworks": {
                    "django": django.get_version(),
                    "drf": rest_framework.VERSION,
                    "python": platform.python_version(),
                },
                "database": {
                    "vendor": connection.vendor,
                    "engine": connection.settings_dict.get("ENGINE"),
                    "name": str(db_name) if db_name else "",
                    "host": str(db_host) if db_host else "local",
                    "port": connection.settings_dict.get("PORT"),
                },
                "counts": counts,
            },
            status=status.HTTP_200_OK,
        )


def build_volunteer_id_card(volunteer):
    """Generate a compact, dependency-free PDF field volunteer ID card."""
    def esc(text):
        return str(text).replace("\\", "").replace("(", "\\(").replace(")", "\\)")

    lines = [
        ("BRIGHTER FUTURE FOUNDATION", "F1", 20, 700, 'B'),
        ("FIELD VOLUNTEER ID CARD", "F2", 26, 660, 'B'),
        (f"Volunteer ID: {volunteer.volunteer_id}", "F1", 12, 600, 'N'),
        (f"Name: {esc(volunteer.full_name or '—')}", "F1", 12, 570, 'N'),
        (f"Phone: {esc(volunteer.phone or '—')}", "F1", 12, 545, 'N'),
        (f"Cluster: {esc(volunteer.cluster)}", "F1", 12, 520, 'N'),
        (f"Squad: {esc(volunteer.squad or '—')}", "F1", 12, 495, 'N'),
        (f"Status: {esc(volunteer.get_status_display())}", "F1", 12, 470, 'N'),
        (f"Deployment: {esc(volunteer.deployment_status)}", "F1", 12, 445, 'N'),
        (f"Specializations: {esc(', '.join(volunteer.specializations) or '—')}", "F1", 12, 420, 'N'),
        (f"Issued: {date.today().isoformat()}", "F1", 10, 380, 'N'),
        ("Valid for official BFF field operations only.", "F1", 10, 360, 'N'),
    ]

    stream_parts = []
    for text, font, size, y, style in lines:
        color = "0.08 0.5 0.36 rg" if style == 'B' and y >= 600 else "0.12 0.16 0.25 rg"
        stream_parts.append(
            f"BT /{font} {size} Tf {color} 60 {y} Td ({text}) Tj ET"
        )
    stream = "\n".join(stream_parts).encode("latin-1", "replace")
    length = len(stream)

    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R "
        b"/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n"
        + b"4 0 obj\n<< /Length " + str(length).encode() + b" >>\nstream\n"
        + stream
        + b"\nendstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n"
        b"trailer\n<< /Root 1 0 R /Size 7 >>\n%%EOF"
    )
    return pdf
