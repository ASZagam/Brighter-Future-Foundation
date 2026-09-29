import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class NewsletterSubscription(models.Model):
    """A public newsletter signup collected from the landing page."""

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True)
    source = models.CharField(max_length=64, blank=True)
    is_active = models.BooleanField(default=True)
    unsubscribe_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.email


class FinancialAllocation(models.Model):
    """An approved, publishable statement of how funds are allocated.

    Only rows with ``is_published`` are ever exposed by the public API, so an
    allocation stays internal until it has been signed off.
    """

    label = models.CharField(max_length=120)
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    period_label = models.CharField(max_length=64, blank=True)
    program = models.ForeignKey(
        "core.Program",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="public_allocations",
    )
    category = models.ForeignKey(
        "core.ProgramCategory",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="public_allocations",
    )
    notes = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "label"]
        verbose_name = "Financial allocation"
        verbose_name_plural = "Financial allocations"

    def __str__(self):
        return f"{self.label} ({self.percentage}%)"
