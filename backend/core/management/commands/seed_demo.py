"""
Development-only seed data for the Volunteer & Deployment Roster.

Creates clearly-labeled DEMO records so the /volunteers operations page can be
exercised against a real, populated PostgreSQL database. Every record produced
carries `DEMO-SEED` in its notes field and is safe to remove with --clear.

Usage:
    python manage.py seed_demo            # create demo data (skips if volunteers exist)
    python manage.py seed_demo --reset    # delete demo data, then recreate
    python manage.py seed_demo --clear    # delete demo data only
"""
from datetime import date, datetime, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import (
    Country,
    Donation,
    Event,
    Member,
    NewsPost,
    Program,
    ProgramVolunteerAssignment,
    ProgramStatus,
    State,
    Volunteer,
    VolunteerAttendance,
    VolunteerHourLog,
    VolunteerSkill,
    VolunteerStatus,
    VolunteerTraining,
)

DEMO_TAG = "DEMO-SEED"

DEMO_COUNTRY = {
    "name": "Nigeria",
    "iso_code": "NG",
    "iso3_code": "NGA",
    "numeric_code": "566",
    "calling_code": "+234",
}

DEMO_STATES = [
    ("Abia", "AB"), ("Adamawa", "AD"), ("Akwa Ibom", "AK"), ("Anambra", "AN"),
    ("Bauchi", "BA"), ("Bayelsa", "BY"), ("Benue", "BE"), ("Borno", "BO"),
    ("Cross River", "CR"), ("Delta", "DE"), ("Ebonyi", "EB"), ("Edo", "ED"),
    ("Ekiti", "EK"), ("Enugu", "EN"), ("Federal Capital Territory", "FC"),
    ("Gombe", "GO"), ("Imo", "IM"), ("Jigawa", "JI"), ("Kaduna", "KD"),
    ("Kano", "KN"), ("Katsina", "KT"), ("Kebbi", "KB"), ("Kogi", "KO"),
    ("Kwara", "KW"), ("Lagos", "LA"), ("Nasarawa", "NA"), ("Niger", "NI"),
    ("Ogun", "OG"), ("Ondo", "ON"), ("Osun", "OS"), ("Oyo", "OY"),
    ("Plateau", "PL"), ("Rivers", "RI"), ("Sokoto", "SO"), ("Taraba", "TA"),
    ("Yobe", "YO"), ("Zamfara", "ZA"),
]

DEMO_VOLUNTEERS = [
    {
        "volunteer_id": "VOL-2026-00001",
        "first_name": "Ibrahim",
        "last_name": "Suleiman",
        "phone": "+2348031122290",
        "gender": "Male",
        "state": "Kaduna State",
        "lga": "Giwa LGA",
        "squad": "ZONE 1",
        "status": "active",
        "latitude": 11.2734,
        "longitude": 7.6479,
        "skills": ["Gold Chain", "ODK Mobile Enumerator", "Drilling & Borehole"],
        "trainings": [("ODK Mobile Enumerator Training", "Field HQ"), ("Red Cross First Aid", "FRCS Kaduna")],
        "hours": [("Kaduna Clean Water & Sanitation Initiative", 4, "approved"), ("Kaduna Clean Water & Sanitation Initiative", 4, "pending")],
    },
    {
        "volunteer_id": "VOL-2026-00002",
        "first_name": "Amina",
        "last_name": "Yusuf",
        "phone": "+2348057713310",
        "gender": "Female",
        "state": "Kaduna State",
        "lga": "Kawo LGA",
        "squad": "ZONE 1",
        "status": "active",
        "latitude": 10.5264,
        "longitude": 7.4388,
        "skills": ["WASH & Sanitation", "Community Mobilization"],
        "trainings": [("WASH Facilitation", "Action Against Hunger")],
        "hours": [("Kaduna Clean Water & Sanitation Initiative", 6, "approved")],
    },
    {
        "volunteer_id": "VOL-2026-00003",
        "first_name": "Chinedu",
        "last_name": "Okonkwo",
        "phone": "+2348062218834",
        "gender": "Male",
        "state": "Abuja (FCT)",
        "lga": "Gwarinpa LGA",
        "squad": "ZONE 2",
        "status": "active",
        "latitude": 9.0579,
        "longitude": 7.4951,
        "skills": ["Material Logistics", "Driver Class E"],
        "trainings": [("Defensive Driving", "Fleet Safety Nigeria")],
        "hours": [("Abuja Mobile Outreach", 8, "approved")],
    },
    {
        "volunteer_id": "VOL-2026-00004",
        "first_name": "Fatima",
        "last_name": "Bello",
        "phone": "+2348090041122",
        "gender": "Female",
        "state": "Kano State",
        "lga": "Nassarawa LGA",
        "squad": "ZONE 3",
        "status": "on_leave",
        "on_leave_until": date.today() + timedelta(days=9),
        "latitude": 12.0,
        "longitude": 8.5,
        "skills": ["ODK Mobile Enumerator", "Community Mobilization"],
        "trainings": [("Mobile Data Collection", "GeoEnabler")],
        "hours": [("Kano Nutrition Drive", 5, "approved")],
    },
    {
        "volunteer_id": "VOL-2026-00005",
        "first_name": "Blessing",
        "last_name": "Nnamdi",
        "phone": "+2348025567701",
        "gender": "Female",
        "state": "Enugu State",
        "lga": "Nsukka LGA",
        "squad": "ZONE 4",
        "status": "active",
        "latitude": 6.8602,
        "longitude": 7.3911,
        "skills": ["First Aid", "Community Mobilization"],
        "trainings": [("Red Cross First Aid", "FRCS Enugu")],
        "hours": [("Enugu Health Outreach", 4, "approved"), ("Enugu Health Outreach", 3, "pending")],
    },
    {
        "volunteer_id": "VOL-2026-00006",
        "first_name": "Musa",
        "last_name": "Danladi",
        "phone": "+2348039084411",
        "gender": "Male",
        "state": "Benue State",
        "lga": "Makurdi LGA",
        "squad": "ZONE 5",
        "status": "active",
        "latitude": 7.7337,
        "longitude": 8.5211,
        "skills": ["Drilling & Borehole", "Gold Chain"],
        "trainings": [("Borehole Drilling Operations", "Rural Water Corps")],
        "hours": [("Benue WASH Deployment", 5, "approved")],
    },
    {
        "volunteer_id": "VOL-2026-00007",
        "first_name": "Grace",
        "last_name": "Adepoju",
        "phone": "+2348071135546",
        "gender": "Female",
        "state": "Rivers State",
        "lga": "Obio-Akpor LGA",
        "squad": "ZONE 6",
        "status": "active",
        "latitude": 4.8341,
        "longitude": 7.0477,
        "skills": ["WASH & Sanitation", "ODK Mobile Enumerator"],
        "trainings": [("Water Quality Testing", "UNICEF WASH")],
        "hours": [("Rivers Coastal WASH", 4, "pending")],
    },
    {
        "volunteer_id": "VOL-2026-00008",
        "first_name": "Dauda",
        "last_name": "Ibrahim",
        "phone": "+2348102229870",
        "gender": "Male",
        "state": "Sokoto State",
        "lga": "Wamako LGA",
        "squad": "ZONE 6",
        "status": "suspended",
        "latitude": 13.0608,
        "longitude": 5.2466,
        "skills": ["Material Logistics"],
        "trainings": [],
        "hours": [],
    },
]

DEMO_PROGRAMS = [
    {"program_id": "PRG-2026-00001", "title": "Kaduna Clean Water & Sanitation Initiative", "status": "active", "priority": "critical", "state": "Kaduna State", "budget": "4000000"},
    {"program_id": "PRG-2026-00002", "title": "Abuja Mobile Outreach", "status": "active", "priority": "high", "state": "Abuja (FCT)", "budget": "1500000"},
    {"program_id": "PRG-2026-00003", "title": "Kano Nutrition Drive", "status": "active", "priority": "medium", "state": "Kano State", "budget": "950000"},
    {"program_id": "PRG-2026-00004", "title": "Enugu Health Outreach", "status": "active", "priority": "high", "state": "Enugu State", "budget": "1200000"},
    {"program_id": "PRG-2026-00005", "title": "Benue WASH Deployment", "status": "active", "priority": "medium", "state": "Benue State", "budget": "800000"},
    {"program_id": "PRG-2026-00006", "title": "Rivers Coastal WASH", "status": "active", "priority": "high", "state": "Rivers State", "budget": "1800000"},
]

DEMO_EVENTS = [
    {"title": "Annual Fundraising Gala", "location": "Transcorp Hilton, Abuja", "capacity": 300, "is_public": True, "days": 21, "span": 1, "description": "Evening gala to raise funds for the clean water portfolio, with donor recognition and a programme showcase."},
    {"title": "Community Health Outreach", "location": "Nsukka, Enugu State", "capacity": 180, "is_public": True, "days": 9, "span": 2, "description": "Free screenings, maternal health talks and referrals delivered with our clinic partners."},
    {"title": "Youth Skills Bootcamp", "location": "Kano State", "capacity": 120, "is_public": True, "days": 34, "span": 5, "description": "Five-day vocational training in solar installation, tailoring and digital literacy for out-of-school youth."},
    {"title": "Board Strategy Retreat", "location": "Abuja (FCT)", "capacity": 24, "is_public": False, "days": 45, "span": 2, "description": "Closed session to review the 2026 strategy, budget and impact targets."},
    {"title": "Volunteer Appreciation Day", "location": "Kaduna State", "capacity": 200, "is_public": True, "days": -18, "span": 1, "description": "Celebrating the field volunteers who delivered the WASH deployments this quarter."},
    {"title": "WASH Field Deployment Briefing", "location": "Makurdi, Benue State", "capacity": 60, "is_public": True, "days": -5, "span": 1, "description": "Pre-deployment briefing and equipment handover for the Benue borehole teams."},
]

DEMO_NEWS = [
    {"title": "Clean Water Initiative Reaches 5,000 Households", "category": "Programs", "published": True, "days": 3, "body": "Our Kaduna Clean Water & Sanitation Initiative has now connected more than five thousand households to safe, reliable water points. Field teams completed twelve boreholes this quarter, cutting average collection times from ninety to under fifteen minutes."},
    {"title": "New Volunteer Cohort Graduates", "category": "Volunteers", "published": True, "days": 8, "body": "Twenty-four volunteers completed the ODK Mobile Enumerator and Red Cross First Aid tracks. They will deploy across the WASH, nutrition and health portfolios over the coming months."},
    {"title": "Partnership with Rural Water Corps", "category": "Partnerships", "published": True, "days": 15, "body": "We have formalised a partnership with Rural Water Corps to co-deliver borehole drilling and water quality testing in Benue and Sokoto States."},
    {"title": "Annual Report 2025 Released", "category": "Reports", "published": True, "days": 27, "body": "The 2025 annual report is now available. It covers programme outcomes, financial stewardship and the foundations of our 2026 strategy."},
    {"title": "Upcoming Fundraising Gala", "category": "Events", "published": False, "days": 1, "body": "Draft announcement for the Annual Fundraising Gala. Finalise the guest list and sponsorship tiers before publishing."},
]

DEMO_DONATIONS = [
    {"donor_name": "Zenith Community Trust", "donor_email": "grants@zenithtrust.demo", "amount": "1500000.00", "campaign": "Clean Water Expansion", "status": "completed", "days": 12},
    {"donor_name": "Amina Bello", "donor_email": "amina.bello@example.demo", "amount": "75000.00", "campaign": "Clean Water Expansion", "status": "completed", "days": 10},
    {"donor_name": "Rural Water Corps", "donor_email": "partnerships@rwc.demo", "amount": "800000.00", "campaign": "WASH Field Deployments", "status": "pending", "days": 6},
    {"donor_name": "Chinedu Okonkwo", "donor_email": "chinedu.o@example.demo", "amount": "50000.00", "campaign": "Youth Skills Bootcamp", "status": "completed", "days": 5},
    {"donor_name": "Sahel Health Foundation", "donor_email": "giving@sahelhealth.demo", "amount": "450000.00", "campaign": "Community Health Outreach", "status": "completed", "days": 3},
    {"donor_name": "Anonymous Donor", "donor_email": "", "amount": "25000.00", "campaign": "General Fund", "status": "pending", "days": 1},
    {"donor_name": "Lagos Youth Alliance", "donor_email": "hello@lagosyouth.demo", "amount": "120000.00", "campaign": "Youth Skills Bootcamp", "status": "failed", "days": 2},
]

DEMO_MEMBERS = [
    {"first_name": "Aisha", "last_name": "Garba", "gender": "female", "date_of_birth": date(1992, 4, 12), "state": "Kaduna State", "lga": "Giwa LGA", "occupation": "Petty trader", "membership_type": "beneficiary", "status": "pending", "skills": "Tailoring, Hausa literacy"},
    {"first_name": "Emmanuel", "last_name": "Okon", "gender": "male", "date_of_birth": date(1984, 1, 25), "state": "Enugu State", "lga": "Nsukka LGA", "occupation": "Subsistence farmer", "membership_type": "beneficiary", "status": "active", "skills": "Crop farming, Cooperative leadership"},
    {"first_name": "Fatima", "last_name": "Mohammed", "gender": "female", "date_of_birth": date(2004, 8, 3), "state": "Kano State", "lga": "Fagge LGA", "occupation": "Student", "membership_type": "regular", "status": "pending", "skills": "Data entry"},
    {"first_name": "Haruna", "last_name": "Bello", "gender": "male", "date_of_birth": date(1975, 11, 30), "state": "Borno State", "lga": "Maiduguri LGA", "occupation": "Livestock herder", "membership_type": "beneficiary", "status": "active", "skills": "Animal husbandry"},
    {"first_name": "Blessing", "last_name": "Nnamdi", "gender": "female", "date_of_birth": date(1998, 6, 18), "state": "Abuja (FCT)", "lga": "Bwari LGA", "occupation": "Community health worker", "membership_type": "volunteer", "status": "active", "skills": "First aid, Health education"},
    {"first_name": "Yusuf", "last_name": "Aliyu", "gender": "male", "date_of_birth": date(2000, 2, 9), "state": "Kaduna State", "lga": "Igabi LGA", "occupation": "Solar technician", "membership_type": "regular", "status": "suspended", "skills": "Electrical installation"},
    {"first_name": "Chioma", "last_name": "Eze", "gender": "female", "date_of_birth": date(1989, 9, 27), "state": "Rivers State", "lga": "Obio-Akpor LGA", "occupation": "Fish processor", "membership_type": "beneficiary", "status": "active", "skills": "Food preservation, Bookkeeping"},
    {"first_name": "Musa", "last_name": "Danladi", "gender": "male", "date_of_birth": date(1980, 5, 14), "state": "Benue State", "lga": "Makurdi LGA", "occupation": "WASH technician", "membership_type": "partner", "status": "active", "skills": "Borehole maintenance"},
    {"first_name": "Grace", "last_name": "Adepoju", "gender": "female", "date_of_birth": date(1995, 12, 1), "state": "Sokoto State", "lga": "Wamako LGA", "occupation": "Teacher", "membership_type": "regular", "status": "inactive", "skills": "Adult literacy"},
    {"first_name": "Ibrahim", "last_name": "Suleiman", "gender": "male", "date_of_birth": date(1990, 7, 22), "state": "Kaduna State", "lga": "Zaria LGA", "occupation": "Mason", "membership_type": "beneficiary", "status": "active", "skills": "Masonry, Construction"},
]


class Command(BaseCommand):
    help = "Seed clearly-labeled DEMO volunteer & deployment data (development only)."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete demo data, then recreate it.")
        parser.add_argument("--clear", action="store_true", help="Delete demo data only.")

    def handle(self, *args, **options):
        if options["clear"] or options["reset"]:
            self._clear()
            self.stdout.write(self.style.SUCCESS("Cleared DEMO-SEED volunteer, member, event, news & donation data."))
            if options["clear"]:
                return

        if Volunteer.objects.count() == 0:
            self._seed()
            self.stdout.write(self.style.SUCCESS(f"Seeded {Volunteer.objects.count()} DEMO volunteers."))

        if Member.objects.count() == 0:
            self._seed_members()
            self.stdout.write(self.style.SUCCESS(f"Seeded {Member.objects.count()} DEMO members."))

        if Event.objects.count() == 0:
            self._seed_events()
            self.stdout.write(self.style.SUCCESS(f"Seeded {Event.objects.count()} DEMO events."))

        if NewsPost.objects.count() == 0:
            self._seed_news()
            self.stdout.write(self.style.SUCCESS(f"Seeded {NewsPost.objects.count()} DEMO news posts."))

        if Donation.objects.count() == 0:
            self._seed_donations()
            self.stdout.write(self.style.SUCCESS(f"Seeded {Donation.objects.count()} DEMO donations."))

        if Country.objects.count() == 0:
            self._seed_references()
            self.stdout.write(self.style.SUCCESS(f"Seeded {Country.objects.count()} country and {State.objects.count()} state references."))

    def _clear(self):
        VolunteerTraining.objects.filter(notes__contains=DEMO_TAG).delete()
        VolunteerHourLog.objects.filter(notes__contains=DEMO_TAG).delete()
        VolunteerAttendance.objects.filter(remarks__contains=DEMO_TAG).delete()
        ProgramVolunteerAssignment.objects.filter(notes__contains=DEMO_TAG).delete()
        Volunteer.objects.filter(notes__contains=DEMO_TAG).delete()
        Member.objects.filter(notes__contains=DEMO_TAG).delete()
        Program.objects.filter(title__contains=DEMO_TAG).delete()
        Event.objects.filter(title__contains=DEMO_TAG).delete()
        NewsPost.objects.filter(title__contains=DEMO_TAG).delete()
        Donation.objects.filter(reference__startswith="DEMO-").delete()
        State.objects.filter(country__iso_code="NG").delete()
        Country.objects.filter(iso_code="NG").delete()

    def _seed_events(self):
        now = timezone.now()
        for meta in DEMO_EVENTS:
            start = now + timedelta(days=meta["days"])
            end = start + timedelta(days=meta["span"], hours=6)
            Event.objects.create(
                title=f"{meta['title']} [{DEMO_TAG}]",
                description=f"{meta['description']} Auto-seeded demo event.",
                location=meta["location"],
                start_date=start,
                end_date=end,
                capacity=meta["capacity"],
                is_public=meta["is_public"],
            )

    def _seed_news(self):
        now = timezone.now()
        for idx, meta in enumerate(DEMO_NEWS):
            created = now - timedelta(days=meta["days"])
            NewsPost.objects.create(
                title=f"{meta['title']} [{DEMO_TAG}]",
                body=meta["body"],
                category=meta["category"],
                cover_image=self._demo_cover(meta["title"], idx),
                image_caption=meta["title"],
                published=meta["published"],
                published_at=created if meta["published"] else None,
            )

    def _demo_cover(self, title, index):
        from io import BytesIO

        from django.core.files.base import ContentFile
        from PIL import Image, ImageDraw

        palette = [(8, 127, 91), (19, 108, 89), (69, 104, 134), (178, 86, 22), (96, 82, 138)]
        canvas = Image.new("RGB", (1200, 675), palette[index % len(palette)])
        draw = ImageDraw.Draw(canvas)
        draw.rectangle([48, 48, 1152, 627], outline=(255, 255, 255), width=6)
        draw.multiline_text((88, 92), title[:42], fill=(255, 255, 255))
        draw.multiline_text((88, 560), "BRIGHTER FUTURE FOUNDATION", fill=(226, 240, 234))
        buffer = BytesIO()
        canvas.save(buffer, format="JPEG", quality=82)
        return ContentFile(buffer.getvalue(), name=f"demo-news-{index + 1}.jpg")

    def _seed_donations(self):
        for idx, meta in enumerate(DEMO_DONATIONS, start=1):
            Donation.objects.create(
                donor_name=meta["donor_name"],
                donor_email=meta["donor_email"],
                amount=Decimal(meta["amount"]),
                campaign=meta["campaign"],
                reference=f"DEMO-DON-{idx:04d}",
                status=meta["status"],
            )

    def _seed_references(self):
        country, _ = Country.objects.get_or_create(iso_code=DEMO_COUNTRY["iso_code"], defaults=DEMO_COUNTRY)
        for name, code in DEMO_STATES:
            State.objects.get_or_create(
                country=country,
                code=code,
                defaults={"name": name, "active": True},
            )

    def _seed_members(self):
        for idx, meta in enumerate(DEMO_MEMBERS):
            Member.objects.create(
                first_name=meta["first_name"],
                last_name=meta["last_name"],
                email=f"{meta['first_name'].lower()}.{meta['last_name'].lower()}@bff.demo",
                phone=f"+23480{30000000 + idx * 111111}",
                gender=meta["gender"],
                date_of_birth=meta["date_of_birth"],
                state=meta["state"],
                lga=meta["lga"],
                occupation=meta["occupation"],
                skills=meta["skills"],
                membership_type=meta["membership_type"],
                status=meta["status"],
                address=f"{meta['lga']}, {meta['state']}",
                notes=f"DEMO-SEED development record. Cleared by seed_demo --clear.",
            )


    def _seed(self):
        now = timezone.now()

        skill_records = [
            "Gold Chain", "WASH & Sanitation", "Drilling & Borehole", "First Aid",
            "ODK Mobile Enumerator", "Driver Class E", "Community Mobilization", "Material Logistics",
        ]
        skill_map = {}
        for name in skill_records:
            obj, _ = VolunteerSkill.objects.get_or_create(name=name)
            skill_map[name] = obj

        programs = []
        for meta in DEMO_PROGRAMS:
            program = Program.objects.create(
                program_id=meta["program_id"],
                title=f"{meta['title']} [{DEMO_TAG}]",
                description=f"Auto-seeded demo program {DEMO_TAG}. Delete with seed_demo --clear.",
                start_date=date.today() - timedelta(days=120),
                end_date=date.today() + timedelta(days=365),
                budget=meta["budget"],
                status=meta["status"],
                priority=meta["priority"],
            )
            programs.append(program)

        for idx, meta in enumerate(DEMO_VOLUNTEERS):
            skills = [skill_map[name] for name in meta["skills"] if name in skill_map]
            volunteer = Volunteer(
                volunteer_id=meta["volunteer_id"],
                first_name=meta["first_name"],
                last_name=meta["last_name"],
                email=(
                    f"{meta['first_name'].lower()}.{meta['last_name'].lower()}@bff.demo"
                ),
                phone=meta["phone"],
                gender=meta["gender"],
                state=meta["state"],
                lga=meta["lga"],
                squad=meta["squad"],
                status=meta["status"],
                joined_date=date.today() - timedelta(days=300 - idx * 12),
                years_of_experience=2 + (idx % 4),
                latitude=str(meta["latitude"]) if meta.get("latitude") is not None else None,
                longitude=str(meta["longitude"]) if meta.get("longitude") is not None else None,
                last_gps_at=now - timedelta(minutes=4 + idx * 3),
                on_leave_until=meta.get("on_leave_until"),
                notes=f"DEMO-SEED development record. Cleared by seed_demo --clear.",
                bio="Seeded demo field volunteer.",
            )
            volunteer.save()
            volunteer.skills.set(skills)

            for name, provider in meta.get("trainings", []):
                VolunteerTraining.objects.create(
                    volunteer=volunteer,
                    training_name=name,
                    provider=provider,
                    start_date=date.today() - timedelta(days=90),
                    notes=DEMO_TAG,
                )

            self._link_assignments(volunteer, programs, meta, now)
            self._seed_hours(volunteer, programs, meta, now)

    def _link_assignments(self, volunteer, programs, meta, now):
        if meta["status"] != "active":
            return
        for title, _hours, _approval in meta.get("hours", []):
            program = next((p for p in programs if p.title.startswith(title)), None)
            if not program:
                continue
            ProgramVolunteerAssignment.objects.create(
                program=program,
                volunteer=volunteer,
                notes=DEMO_TAG,
            )
            return

    def _seed_hours(self, volunteer, programs, meta, now):
        for title, hours, approval in meta.get("hours", []):
            program = next((p for p in programs if p.title.startswith(title)), None)
            VolunteerHourLog.objects.create(
                volunteer=volunteer,
                program=program,
                activity=title,
                date=now.date() - timedelta(days=1),
                hours=hours,
                approval_status=approval,
                location=f"{volunteer.lga} demo site",
                notes=DEMO_TAG,
            )