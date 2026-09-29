"""Tests for the public site API.

The public API is unauthenticated, so these tests focus on two things:
1. It never leaks internal or personal data.
2. It never invents a value when the database has none.
"""

from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from core.models import (
    Country,
    Donation,
    Member,
    NewsPost,
    Program,
    ProgramCategory,
    ProgramReport,
    State,
    Volunteer,
)
from public_site.models import FinancialAllocation, NewsletterSubscription

User = get_user_model()


class PublicApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(name="Testland")
        self.state = State.objects.create(name="Test State", country=self.country)
        self.category = ProgramCategory.objects.create(
            name="Water & Sanitation", description="Boreholes and latrines", color="#176b4d"
        )

    # ------------------------------------------------------------------ org

    def test_organization_404s_when_not_published(self):
        response = self.client.get("/api/v2/public/organization/")
        self.assertEqual(response.status_code, 404)

    def test_organization_returns_active_profile(self):
        from core.models import OrganizationProfile

        OrganizationProfile.objects.create(
            name="Bright Futures", mission="Serve communities", is_active=True
        )
        response = self.client.get("/api/v2/public/organization/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Bright Futures")

    # ------------------------------------------------------------- programs

    def _make_program(self, **kwargs):
        defaults = {
            "program_id": "PRG-TEST-1",
            "title": "Test Borehole Program",
            "slug": "test-borehole-program",
            "description": "Drilling boreholes",
            "status": "active",
            "start_date": date(2026, 1, 1),
            "country": self.country,
            "state": self.state,
            "category": self.category,
            "budget": Decimal("1000000"),
            "amount_spent": Decimal("250000"),
            "beneficiary_count": 400,
        }
        defaults.update(kwargs)
        return Program.objects.create(**defaults)

    def test_programs_exclude_draft_and_deleted(self):
        self._make_program()
        self._make_program(program_id="PRG-T-2", slug="draft-one", status="draft")
        self._make_program(
            program_id="PRG-T-3", slug="deleted-one", is_deleted=True
        )
        response = self.client.get("/api/v2/public/programs/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["program_id"], "PRG-TEST-1")

    def test_program_serializer_hides_internal_fields(self):
        self._make_program()
        response = self.client.get("/api/v2/public/programs/")
        row = response.data[0]
        for leaked in ("created_by", "updated_by", "manager", "coordinator", "is_deleted"):
            self.assertNotIn(leaked, row)
        self.assertEqual(row["budget_utilisation"], 25.0)

    def test_budget_utilisation_is_none_for_zero_budget(self):
        self._make_program(budget=0, amount_spent=0)
        response = self.client.get("/api/v2/public/programs/")
        self.assertIsNone(response.data[0]["budget_utilisation"])

    def test_program_detail_by_slug(self):
        self._make_program()
        response = self.client.get("/api/v2/public/programs/test-borehole-program/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["state_name"], "Test State")

    def test_unknown_program_404s(self):
        response = self.client.get("/api/v2/public/programs/nope/")
        self.assertEqual(response.status_code, 404)

    # -------------------------------------------------------------- reports

    def test_only_published_reports_are_public(self):
        program = self._make_program()
        ProgramReport.objects.create(
            program=program, title="Published", status="published", location="Test State"
        )
        ProgramReport.objects.create(
            program=program, title="Draft report", status="draft"
        )
        response = self.client.get("/api/v2/public/field-reports/")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Published")

    def test_report_omits_submitter_and_internal_text(self):
        program = self._make_program()
        ProgramReport.objects.create(
            program=program,
            title="Public report",
            status="published",
            challenges="internal",
            lessons_learned="internal",
            recommendations="internal",
        )
        row = self.client.get("/api/v2/public/field-reports/").data[0]
        for field in ("submitted_by", "challenges", "lessons_learned", "recommendations"):
            self.assertNotIn(field, row)

    # ------------------------------------------------------------- newsroom

    def test_only_published_news_is_public(self):
        NewsPost.objects.create(title="Live", body="x", published=True)
        NewsPost.objects.create(title="Hidden", body="x", published=False)
        response = self.client.get("/api/v2/public/newsroom/")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Live")

    # ------------------------------------------------------- impact honesty

    def test_unavailable_metrics_are_flagged_not_invented(self):
        self._make_program(beneficiary_count=0, amount_spent=0)
        response = self.client.get("/api/v2/public/impact-summary/")
        metrics = {m["label"]: m for m in response.data["metrics"]}

        self.assertFalse(metrics["People reached"]["available"])
        self.assertEqual(metrics["People reached"]["value"], 0)
        self.assertFalse(metrics["Expenditure recorded"]["available"])
        self.assertTrue(metrics["Programs on record"]["available"])
        self.assertEqual(metrics["Programs on record"]["value"], 1)

    def test_funds_raised_counts_only_completed_donations(self):
        Donation.objects.create(
            donor_name="A", amount=Decimal("1000"), reference="R1", status="completed"
        )
        Donation.objects.create(
            donor_name="B", amount=Decimal("9999"), reference="R2", status="pending"
        )
        metrics = {
            m["label"]: m
            for m in self.client.get("/api/v2/public/impact-summary/").data["metrics"]
        }
        self.assertEqual(metrics["Funds raised"]["value"], 1000)
        self.assertEqual(metrics["Funds raised"]["unit"], "NGN")

    def test_impact_never_exposes_donor_identity(self):
        Donation.objects.create(
            donor_name="Secret Donor",
            donor_email="secret@example.com",
            amount=Decimal("500"),
            reference="R3",
            status="completed",
        )
        body = str(self.client.get("/api/v2/public/impact-summary/").content)
        self.assertNotIn("Secret Donor", body)
        self.assertNotIn("secret@example.com", body)

    def test_transparency_excludes_unpublished_allocations(self):
        FinancialAllocation.objects.create(
            label="Hidden split", percentage=Decimal("50"), is_published=False
        )
        FinancialAllocation.objects.create(
            label="Published split", percentage=Decimal("100"), is_published=True
        )
        response = self.client.get("/api/v2/public/allocation/")
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["label"], "Published split")

    def test_transparency_allocation_total_sums_published_only(self):
        FinancialAllocation.objects.create(
            label="A", percentage=Decimal("40"), is_published=True
        )
        FinancialAllocation.objects.create(
            label="B", percentage=Decimal("25"), is_published=True
        )
        data = self.client.get("/api/v2/public/transparency/").data
        self.assertEqual(data["allocation_total_percentage"], 65)

    # ------------------------------------------------------------ newsletter

    def test_newsletter_creates_subscription(self):
        response = self.client.post(
            "/api/v2/public/newsletter/subscribe/",
            {"email": "Person@Example.COM", "name": "Person"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["detail"], "subscribed")
        # Email is normalised before storage.
        self.assertTrue(NewsletterSubscription.objects.filter(email="person@example.com").exists())

    def test_newsletter_is_idempotent(self):
        payload = {"email": "dupe@example.com"}
        self.client.post("/api/v2/public/newsletter/subscribe/", payload)
        response = self.client.post("/api/v2/public/newsletter/subscribe/", payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["detail"], "already_subscribed")
        self.assertEqual(NewsletterSubscription.objects.count(), 1)

    def test_newsletter_reactivates_unsubscribed(self):
        NewsletterSubscription.objects.create(email="back@example.com", is_active=False)
        response = self.client.post(
            "/api/v2/public/newsletter/subscribe/", {"email": "back@example.com"}
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["detail"], "resubscribed")
        self.assertTrue(
            NewsletterSubscription.objects.get(email="back@example.com").is_active
        )

    def test_newsletter_rejects_invalid_email(self):
        response = self.client.post(
            "/api/v2/public/newsletter/subscribe/", {"email": "not-an-email"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_newsletter_honeypot_stores_nothing(self):
        response = self.client.post(
            "/api/v2/public/newsletter/subscribe/",
            {"email": "bot@example.com", "website": "http://spam.example"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(NewsletterSubscription.objects.count(), 0)

    # -------------------------------------------------------------- donation

    def test_public_donation_is_recorded_as_pending(self):
        response = self.client.post(
            "/api/v2/public/donations/",
            {"donor_name": "Jane", "donor_email": "jane@example.com", "amount": "5000"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "pending")
        donation = Donation.objects.get(reference=response.data["reference"])
        self.assertEqual(donation.status, "pending")
        self.assertEqual(donation.donor_email, "jane@example.com")

    def test_public_cannot_force_completed_status(self):
        response = self.client.post(
            "/api/v2/public/donations/",
            {
                "donor_name": "Mallory",
                "donor_email": "m@example.com",
                "amount": "10",
                "status": "completed",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "pending")
        self.assertFalse(Donation.objects.filter(status="completed").exists())

    def test_public_donation_rejects_zero_amount(self):
        response = self.client.post(
            "/api/v2/public/donations/",
            {"donor_name": "X", "donor_email": "x@example.com", "amount": "0"},
        )
        self.assertEqual(response.status_code, 400)

    def test_public_donation_honeypot_stores_nothing(self):
        response = self.client.post(
            "/api/v2/public/donations/",
            {
                "donor_name": "Bot",
                "donor_email": "bot@example.com",
                "amount": "100",
                "website": "spam",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Donation.objects.count(), 0)

    def test_donations_are_not_publicly_listable(self):
        Donation.objects.create(
            donor_name="Anon", amount=Decimal("10"), reference="P1", status="completed"
        )
        response = self.client.get("/api/v2/public/donations/")
        self.assertEqual(response.status_code, 405)

    # -------------------------------------------------------------- privacy

    def test_public_api_requires_no_authentication(self):
        """Every public GET must work with no credentials at all."""
        for path in (
            "impact-summary",
            "transparency",
            "programs",
            "field-reports",
            "newsroom",
            "capabilities",
            "events",
            "gallery",
            "allocation",
        ):
            with self.subTest(path=path):
                self.assertEqual(
                    self.client.get(f"/api/v2/public/{path}/").status_code, 200
                )

    def test_volunteer_pii_is_never_public(self):
        from core.models import Member as MemberModel

        member = MemberModel.objects.create(
            first_name="Real",
            last_name="Person",
            member_id="MEM-TEST-1",
            email="real@example.com",
            phone="08012345678",
            gender="female",
            date_of_birth=date(1990, 1, 1),
        )
        Volunteer.objects.create(
            member=member,
            volunteer_id="VOL-TEST-1",
            first_name="Real",
            last_name="Person",
            full_name="Real Person",
            email="real@example.com",
            phone="08012345678",
        )
        payloads = [
            self.client.get("/api/v2/public/impact-summary/").content,
            self.client.get("/api/v2/public/programs/").content,
            self.client.get("/api/v2/public/transparency/").content,
        ]
        for payload in payloads:
            self.assertNotIn(b"Real Person", payload)
            self.assertNotIn(b"real@example.com", payload)
            self.assertNotIn(b"08012345678", payload)
