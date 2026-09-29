from django.contrib import admin

from public_site.models import FinancialAllocation, NewsletterSubscription


@admin.register(NewsletterSubscription)
class NewsletterSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "is_active", "source", "created_at")
    list_filter = ("is_active", "source")
    search_fields = ("email", "name")
    readonly_fields = ("unsubscribe_token", "created_at", "updated_at")
    list_editable = ("is_active",)


@admin.register(FinancialAllocation)
class FinancialAllocationAdmin(admin.ModelAdmin):
    list_display = (
        "label",
        "percentage",
        "period_label",
        "program",
        "category",
        "is_published",
        "display_order",
    )
    list_filter = ("is_published", "period_label")
    search_fields = ("label", "notes")
    list_editable = ("is_published", "display_order")
