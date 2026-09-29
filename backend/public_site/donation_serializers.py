from decimal import Decimal

from rest_framework import serializers

from public_site.models import FinancialAllocation, NewsletterSubscription  # noqa: F401


class PublicDonationSerializer(serializers.Serializer):
    """A public pledge of support.

    Only the intent to donate is accepted. ``status`` is deliberately not a
    writable field: a public submission is always recorded as ``pending`` and
    confirmed by an administrator once payment is actually received. Nothing
    here can mark a donation as completed.
    """

    donor_name = serializers.CharField(max_length=150)
    donor_email = serializers.EmailField(max_length=254)
    amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=Decimal("1.00")
    )
    campaign = serializers.CharField(required=False, allow_blank=True, max_length=255)
    reference = serializers.CharField(required=False, allow_blank=True, max_length=120)
    source = serializers.CharField(required=False, allow_blank=True, max_length=64)
    website = serializers.CharField(required=False, allow_blank=True, max_length=200)

    def validate_donor_email(self, value):
        return value.strip().lower()

    def validate_donor_name(self, value):
        return value.strip()
