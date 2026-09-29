from rest_framework import serializers

from core.models import (
    Event,
    NewsPost,
    OrganizationProfile,
    Program,
    ProgramCategory,
    ProgramGallery,
    ProgramReport,
)
from public_site.models import FinancialAllocation, NewsletterSubscription


class PublicOrganizationSerializer(serializers.ModelSerializer):
    """Public-facing organization content.

    ``is_active`` rows only. Deliberately excludes nothing that is not on the
    public profile itself; there are no internal notes on this model.
    """

    class Meta:
        model = OrganizationProfile
        fields = [
            "name",
            "slogan",
            "mission",
            "vision",
            "history",
            "founder_name",
            "founder_title",
            "email",
            "phone",
            "address",
            "logo",
            "hero_banner",
            "facebook",
            "instagram",
            "linkedin",
            "twitter",
            "website",
        ]


class PublicCapabilitySerializer(serializers.ModelSerializer):
    """A ProgramCategory doubles as a public capability pillar."""

    class Meta:
        model = ProgramCategory
        fields = ["id", "name", "description", "color", "icon"]
        read_only_fields = fields


class PublicProgramSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    country_name = serializers.CharField(source="country.name", read_only=True, default=None)
    state_name = serializers.CharField(source="state.name", read_only=True, default=None)
    image = serializers.SerializerMethodField()
    budget_utilisation = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = [
            "id",
            "program_id",
            "title",
            "slug",
            "description",
            "objectives",
            "expected_outcomes",
            "status",
            "priority",
            "category_name",
            "country_name",
            "state_name",
            "lga",
            "address",
            "start_date",
            "end_date",
            "budget",
            "amount_spent",
            "funding_target",
            "beneficiary_count",
            "image",
            "budget_utilisation",
        ]
        read_only_fields = fields

    def get_image(self, obj):
        gallery = obj.gallery.filter(published=True).order_by("-uploaded_at").first()
        return gallery.image.url if gallery and gallery.image else None

    def get_budget_utilisation(self, obj):
        if not obj.budget:
            return None
        return round((obj.amount_spent / obj.budget) * 100, 1)


class PublicFieldReportSerializer(serializers.ModelSerializer):
    program_title = serializers.CharField(source="program.title", read_only=True)
    program_slug = serializers.CharField(source="program.slug", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProgramReport
        fields = [
            "id",
            "title",
            "summary",
            "location",
            "status",
            "is_featured",
            "program_title",
            "program_slug",
            "image",
            "submitted_at",
        ]
        read_only_fields = fields

    def get_image(self, obj):
        gallery = obj.program.gallery.filter(published=True).order_by("-uploaded_at").first()
        return gallery.image.url if gallery and gallery.image else None


class PublicNewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsPost
        fields = [
            "id",
            "title",
            "body",
            "category",
            "cover_image",
            "image_caption",
            "published_at",
        ]
        read_only_fields = fields


class PublicEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id", "title", "description", "location", "start_date", "end_date"]
        read_only_fields = fields


class PublicAllocationSerializer(serializers.ModelSerializer):
    program_title = serializers.CharField(source="program.title", read_only=True, default=None)
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)

    class Meta:
        model = FinancialAllocation
        fields = [
            "id",
            "label",
            "percentage",
            "period_label",
            "program_title",
            "category_name",
            "notes",
        ]
        read_only_fields = fields


class PublicGalleryItemSerializer(serializers.ModelSerializer):
    program_title = serializers.CharField(source="program.title", read_only=True)

    class Meta:
        model = ProgramGallery
        fields = ["id", "image", "caption", "program_title", "uploaded_at"]
        read_only_fields = fields


class NewsletterSubscribeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True, max_length=254)
    name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    source = serializers.CharField(required=False, allow_blank=True, max_length=64)
    # Honeypot: real users never see this field, bots fill it in. Deliberately
    # unconstrained so a bot is silently absorbed rather than rejected.
    website = serializers.CharField(required=False, allow_blank=True, max_length=200)

    def validate_email(self, value):
        return value.strip().lower()
