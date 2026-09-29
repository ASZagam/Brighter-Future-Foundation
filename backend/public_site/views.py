from uuid import uuid4

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import (
    Country,
    Donation,
    Event,
    Member,
    NewsPost,
    OrganizationProfile,
    Program,
    ProgramCategory,
    ProgramGallery,
    ProgramReport,
    Volunteer,
)
from public_site.donation_serializers import PublicDonationSerializer
from public_site.models import FinancialAllocation, NewsletterSubscription
from public_site.serializers import (
    NewsletterSubscribeSerializer,
    PublicAllocationSerializer,
    PublicCapabilitySerializer,
    PublicEventSerializer,
    PublicFieldReportSerializer,
    PublicGalleryItemSerializer,
    PublicNewsSerializer,
    PublicOrganizationSerializer,
    PublicProgramSerializer,
)

PUBLIC_PROGRAM_STATUSES = ("planning", "active", "completed")


def public_programs():
    return Program.objects.filter(
        is_deleted=False, status__in=PUBLIC_PROGRAM_STATUSES
    )


class PublicOrganizationView(generics.RetrieveAPIView):
    """The organization's public profile.

    404 until an active profile is published, so the frontend can distinguish
    "not configured yet" from a real profile with empty fields.
    """

    serializer_class = PublicOrganizationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_object(self):
        profile = OrganizationProfile.objects.filter(is_active=True).first()
        if profile is None:
            raise NotFound("No public organization profile has been published.")
        return profile


class PublicCapabilityListView(generics.ListAPIView):
    serializer_class = PublicCapabilitySerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        return ProgramCategory.objects.filter(is_active=True)


class PublicProgramListView(generics.ListAPIView):
    serializer_class = PublicProgramSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        qs = public_programs().select_related("category", "country", "state")
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__name__iexact=category)
        return qs.order_by("-start_date", "-id")


class PublicProgramDetailView(generics.RetrieveAPIView):
    serializer_class = PublicProgramSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    lookup_field = "slug"

    def get_queryset(self):
        return public_programs().select_related("category", "country", "state")


class PublicFieldReportListView(generics.ListAPIView):
    serializer_class = PublicFieldReportSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        return (
            ProgramReport.objects.filter(status="published")
            .select_related("program")
            .prefetch_related("program__gallery")
            .order_by("-submitted_at")
        )


class PublicNewsListView(generics.ListAPIView):
    serializer_class = PublicNewsSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        return NewsPost.objects.filter(published=True).order_by("-published_at")


class PublicEventListView(generics.ListAPIView):
    serializer_class = PublicEventSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        return (
            Event.objects.filter(is_public=True, end_date__gte=timezone.now().date())
            .order_by("start_date")[:6]
        )


class PublicGalleryListView(generics.ListAPIView):
    serializer_class = PublicGalleryItemSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        return (
            ProgramGallery.objects.filter(published=True, image__isnull=False)
            .select_related("program")
            .order_by("-uploaded_at")[:12]
        )


class PublicAllocationListView(generics.ListAPIView):
    """Approved, published allocation of funds only."""

    serializer_class = PublicAllocationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    pagination_class = None

    def get_queryset(self):
        return FinancialAllocation.objects.filter(is_published=True).select_related(
            "program", "category"
        )


def _metric(label, value, available=True, unit=None, source=None):
    return {
        "label": label,
        "value": value,
        "available": available,
        "unit": unit,
        "source": source,
    }


class ImpactSummaryView(APIView):
    """Real aggregate counts. Metrics with no backing data are marked
    ``available: False`` rather than being given an invented number."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        programs = public_programs()
        programs_count = programs.count()
        active_count = programs.filter(status="active").count()

        raised = Donation.objects.filter(status="completed").aggregate(
            total=Sum("amount")
        )["total"]
        budget = programs.aggregate(total=Sum("budget"))["total"]
        spent = programs.aggregate(total=Sum("amount_spent"))["total"]

        beneficiaries = programs.aggregate(total=Sum("beneficiary_count"))["total"]
        states_reached = (
            programs.exclude(state__isnull=True)
            .values("state")
            .distinct()
            .count()
        )
        countries = (
            programs.exclude(country__isnull=True).values("country").distinct().count()
        )

        public_programs_qs = programs
        programs_with_report = (
            ProgramReport.objects.filter(
                status="published", program__in=public_programs_qs
            )
            .values("program")
            .distinct()
            .count()
        )
        reporting_coverage = (
            round((programs_with_report / programs_count) * 100, 1)
            if programs_count
            else None
        )

        metrics = [
            _metric(
                "Programs on record",
                programs_count,
                available=programs_count > 0,
                source="Program",
            ),
            _metric(
                "Programs active",
                active_count,
                available=active_count > 0,
                source="Program",
            ),
            _metric(
                "People reached",
                beneficiaries,
                available=bool(beneficiaries),
                source="Program.beneficiary_count",
            ),
            _metric(
                "Active volunteers",
                Volunteer.objects.filter(status="active").count(),
                source="Volunteer",
            ),
            _metric(
                "Active members",
                Member.objects.filter(status="active").count(),
                source="Member",
            ),
            _metric(
                "States reached",
                states_reached,
                available=states_reached > 0,
                source="Program.state",
            ),
            _metric(
                "Countries",
                countries,
                available=countries > 0,
                source="Program.country",
            ),
            _metric(
                "Funds raised",
                raised,
                available=bool(raised),
                unit="NGN",
                source="Donation (completed)",
            ),
            _metric(
                "Program budget committed",
                budget,
                available=bool(budget),
                unit="NGN",
                source="Program.budget",
            ),
            _metric(
                "Expenditure recorded",
                spent,
                available=bool(spent),
                unit="NGN",
                source="Program.amount_spent",
            ),
        ]

        return Response(
            {
                "metrics": metrics,
                "transparency": {
                    "public_reporting_coverage": reporting_coverage,
                    "published_field_reports": ProgramReport.objects.filter(
                        status="published"
                    ).count(),
                    "published_allocations": FinancialAllocation.objects.filter(
                        is_published=True
                    ).count(),
                    "total_programs": programs_count,
                },
                "countries": Country.objects.filter(
                    id__in=programs.exclude(country__isnull=True).values("country")
                ).values("id", "name"),
            }
        )


class TransparencyView(APIView):
    """Aggregate financial transparency figures plus published allocations."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        programs = public_programs()
        raised = Donation.objects.filter(status="completed").aggregate(
            total=Sum("amount")
        )["total"]
        budget = programs.aggregate(total=Sum("budget"))["total"]
        spent = programs.aggregate(total=Sum("amount_spent"))["total"]
        allocations = FinancialAllocation.objects.filter(is_published=True).select_related(
            "program", "category"
        )
        return Response(
            {
                "funds_raised": raised,
                "budget_committed": budget,
                "expenditure_recorded": spent,
                "allocation_total_percentage": sum(
                    float(a.percentage) for a in allocations
                ),
                "allocations": PublicAllocationSerializer(
                    allocations, many=True, context={"request": request}
                ).data,
                "public_documents_available": (
                    programs.aggregate(c=Count("reports"))["c"] or 0
                ),
                "note": (
                    "Figures reflect completed donation records and published "
                    "program data. Unverified or internal records are excluded."
                ),
            }
        )


class NewsletterSubscribeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "newsletter"

    def post(self, request):
        serializer = NewsletterSubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data.get("website"):
            # Honeypot tripped. Respond as if it worked; store nothing.
            return Response({"detail": "Subscribed."}, status=status.HTTP_201_CREATED)

        email = data["email"]
        existing = NewsletterSubscription.objects.filter(email=email).first()

        if existing:
            if existing.is_active:
                return Response(
                    {"detail": "already_subscribed", "email": email},
                    status=status.HTTP_200_OK,
                )
            existing.is_active = True
            existing.save(update_fields=["is_active", "updated_at"])
            return Response(
                {"detail": "resubscribed", "email": email},
                status=status.HTTP_200_OK,
            )

        NewsletterSubscription.objects.create(
            email=email,
            name=data.get("name", ""),
            source=data.get("source", ""),
        )
        return Response(
            {"detail": "subscribed", "email": email}, status=status.HTTP_201_CREATED
        )


class PublicDonationCreateView(APIView):
    """Record a public expression of intent to donate.

    A submission is always stored as ``pending`` and never as ``completed``: no
    public request can mark money as received. An administrator confirms the
    payment, which is what flips the record to completed.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "donation"

    def post(self, request):
        serializer = PublicDonationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data.get("website"):
            # Honeypot tripped. Acknowledge without recording anything.
            return Response(
                {"detail": "received", "status": "pending"},
                status=status.HTTP_201_CREATED,
            )

        reference = data.get("reference") or f"WEB-{timezone.now():%Y%m%d}-{uuid4().hex[:8].upper()}"

        donation = Donation.objects.create(
            donor_name=data["donor_name"],
            donor_email=data["donor_email"],
            amount=data["amount"],
            campaign=data.get("campaign", ""),
            reference=reference,
            status=Donation.Status.PENDING,
        )

        return Response(
            {
                "detail": "recorded",
                "status": donation.status,
                "reference": donation.reference,
                "amount": str(donation.amount),
            },
            status=status.HTTP_201_CREATED,
        )
