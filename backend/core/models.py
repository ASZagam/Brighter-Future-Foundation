import os
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.utils.text import slugify

from accounts.services import AuditService

def upload_to_path(instance, filename):
    name, ext = os.path.splitext(filename.lower())
    ext = ext.lstrip('.')
    if ext in FileUpload.IMAGE_EXTENSIONS:
        folder = 'uploads/images'
    else:
        folder = 'uploads/documents'
    return f'{folder}/{instance.organization_id or "global"}/{filename}'


# core/models.py

import uuid

class ProgramStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PLANNING = "planning", "Planning"
    ACTIVE = "active", "Active"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"
    ARCHIVED = "archived", "Archived"


class ProgramPriority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    CRITICAL = "critical", "Critical"


class ProgramCategory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, blank=True, default="#4F46E5")
    icon = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Program Category"
        verbose_name_plural = "Program Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Program(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program_id = models.CharField(max_length=30, unique=True, blank=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    category = models.ForeignKey(
        ProgramCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="programs",
    )
    description = models.TextField(blank=True)
    objectives = models.TextField(blank=True)
    expected_outcomes = models.TextField(blank=True)
    status = models.CharField(
        max_length=30,
        choices=ProgramStatus.choices,
        default=ProgramStatus.DRAFT,
    )
    priority = models.CharField(
        max_length=20,
        choices=ProgramPriority.choices,
        default=ProgramPriority.MEDIUM,
    )
    country = models.ForeignKey("Country", on_delete=models.SET_NULL, null=True, blank=True, related_name="programs")
    state = models.ForeignKey("State", on_delete=models.SET_NULL, null=True, blank=True, related_name="state_programs")
    lga = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    funding_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    beneficiary_count = models.PositiveIntegerField(default=0)
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_programs",
    )
    coordinator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="coordinated_programs",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_programs",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_programs",
    )
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deleted_programs",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Program"
        verbose_name_plural = "Programs"

    @property
    def remaining_budget(self):
        return self.budget - self.amount_spent

    @property
    def percentage_budget_used(self):
        if not self.budget:
            return 0
        return round((self.amount_spent / self.budget) * 100, 2)

    def clean(self):
        super().clean()
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "End date cannot be before start date."})
        if self.budget < 0:
            raise ValidationError({"budget": "Budget cannot be negative."})
        if self.amount_spent < 0:
            raise ValidationError({"amount_spent": "Amount spent cannot be negative."})
        if self.amount_spent > self.budget:
            raise ValidationError({"amount_spent": "Amount spent cannot exceed budget."})
        if self.funding_target < 0:
            raise ValidationError({"funding_target": "Funding target cannot be negative."})

    def save(self, *args, **kwargs):
        self.full_clean(exclude=["category", "country", "state", "manager", "coordinator", "created_by", "updated_by", "deleted_by"])
        if not self.program_id:
            year = timezone.now().year
            last_program = Program.objects.exclude(program_id="").order_by("-created_at").first()
            next_number = 1
            if last_program:
                try:
                    next_number = int(last_program.program_id.split("-")[-1]) + 1
                except Exception:
                    pass
            self.program_id = f"PRG-{year}-{next_number:05d}"
        if not self.slug:
            self.slug = slugify(self.title)
        else:
            self.slug = slugify(self.slug)
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            AuditService.log(user=self.created_by, action="program_created", details={"program_id": self.program_id, "title": self.title})
        else:
            AuditService.log(user=self.updated_by, action="program_updated", details={"program_id": self.program_id, "title": self.title})

    def soft_delete(self, deleted_by=None):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
        AuditService.log(user=deleted_by, action="program_deleted", details={"program_id": self.program_id, "title": self.title})

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def __str__(self):
        return self.title


class ProgramBeneficiary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="beneficiaries")
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=20, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    state = models.CharField(max_length=100, blank=True)
    lga = models.CharField(max_length=100, blank=True)
    community = models.CharField(max_length=150, blank=True)
    occupation = models.CharField(max_length=150, blank=True)
    disability = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Program Beneficiary"
        verbose_name_plural = "Program Beneficiaries"

    def __str__(self):
        return f"{self.full_name} - {self.program.title}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            AuditService.log(user=None, action="beneficiary_added", details={"program_id": self.program.program_id, "full_name": self.full_name})


class ProgramDocument(models.Model):
    class DocumentType(models.TextChoices):
        REPORT = "report", "Report"
        PROPOSAL = "proposal", "Proposal"
        BUDGET = "budget", "Budget"
        PHOTO = "photo", "Photo"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=255)
    document_type = models.CharField(max_length=20, choices=DocumentType.choices, default=DocumentType.OTHER)
    file = models.FileField(upload_to="programs/documents/")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_program_documents",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def clean(self):
        super().clean()
        if self.file:
            extension = os.path.splitext(self.file.name)[1].lower()
            allowed_extensions = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".zip"}
            if extension not in allowed_extensions:
                raise ValidationError({"file": "Unsupported document format."})

    def __str__(self):
        return self.title


class ProgramGallery(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="gallery")
    image = models.ImageField(upload_to="programs/gallery/")
    caption = models.CharField(max_length=255, blank=True)
    published = models.BooleanField(
        default=True,
        help_text="Show this photo and caption on the public program page.",
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_program_photos",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.program.title


class ProgramReport(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="reports")
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    challenges = models.TextField(blank=True)
    lessons_learned = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_program_reports",
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return self.title


class ProgramVolunteerAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="volunteer_assignments")
    volunteer = models.ForeignKey("Volunteer", on_delete=models.CASCADE, related_name="program_assignments")
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_program_volunteers",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("program", "volunteer")
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.volunteer} -> {self.program.title}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            AuditService.log(user=self.assigned_by, action="volunteer_assigned", details={"program_id": self.program.program_id, "volunteer_id": str(self.volunteer_id)})


class OrganizationProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=255)
    slogan = models.CharField(max_length=255)

    mission = models.TextField()
    vision = models.TextField()

    history = models.TextField(blank=True)

    founder_name = models.CharField(max_length=255)
    founder_title = models.CharField(max_length=255)

    email = models.EmailField()
    phone = models.CharField(max_length=30)

    address = models.TextField()

    logo = models.ImageField(
        upload_to="organization/logo/",
        blank=True,
        null=True
    )

    hero_banner = models.ImageField(
        upload_to="organization/banner/",
        blank=True,
        null=True
    )

    facebook = models.URLField(blank=True)
    instagram = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    twitter = models.URLField(blank=True)

    website = models.URLField(blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Organization Profile"
        verbose_name_plural = "Organization Profile"

    def __str__(self):
        return self.name


class Organization(models.Model):
    name = models.CharField(max_length=255, unique=True)
    legal_name = models.CharField(max_length=255, blank=True)
    abbreviation = models.CharField(max_length=32, blank=True)
    mission_statement = models.TextField(blank=True)
    description = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    website = models.URLField(blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=120, blank=True)
    postal_code = models.CharField(max_length=32, blank=True)
    country = models.ForeignKey('Country', on_delete=models.SET_NULL, null=True, blank=True)
    state = models.ForeignKey('State', on_delete=models.SET_NULL, null=True, blank=True)
    logo = models.ImageField(upload_to='organizations/logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Organization')
        verbose_name_plural = _('Organizations')

    def __str__(self):
        return self.name


class Settings(models.Model):
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='settings',
    )
    default_timezone = models.CharField(max_length=64, default='UTC')
    default_language = models.CharField(max_length=16, default='en')
    support_email = models.EmailField(blank=True)
    support_phone = models.CharField(max_length=50, blank=True)
    maintenance_mode = models.BooleanField(default=False)
    enable_file_uploads = models.BooleanField(default=True)
    max_upload_size_mb = models.PositiveIntegerField(default=20)
    notification_sender = models.EmailField(blank=True)
    analytics_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Settings')
        verbose_name_plural = _('Settings')

    def __str__(self):
        return f'{self.organization.name} Settings'


class Country(models.Model):
    name = models.CharField(max_length=128)
    iso_code = models.CharField(max_length=3, unique=True)
    iso3_code = models.CharField(max_length=3, blank=True)
    numeric_code = models.CharField(max_length=8, blank=True)
    calling_code = models.CharField(max_length=16, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Country')
        verbose_name_plural = _('Countries')
        ordering = ['name']

    def __str__(self):
        return self.name


class State(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='states')
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=16, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('State')
        verbose_name_plural = _('States')
        ordering = ['country__name', 'name']
        unique_together = ('country', 'name')

    def __str__(self):
        return f'{self.name}, {self.country.iso_code}'


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        INFO = 'info', _('Info')
        SUCCESS = 'success', _('Success')
        WARNING = 'warning', _('Warning')
        ERROR = 'error', _('Error')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=16,
        choices=NotificationType.choices,
        default=NotificationType.INFO,
    )
    category = models.CharField(max_length=100, blank=True)
    read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-sent_at']

    def __str__(self):
        return f'{self.title} → {self.user}'


class ActivityLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
    )
    action = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=512, blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Activity Log')
        verbose_name_plural = _('Activity Logs')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} by {self.user or "system"}'


class FileUpload(models.Model):
    class UploadType(models.TextChoices):
        IMAGE = 'image', _('Image')
        DOCUMENT = 'document', _('Document')

    IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
    DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploads',
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploads',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(
        upload_to=upload_to_path,
        validators=[FileExtensionValidator(allowed_extensions=IMAGE_EXTENSIONS + DOCUMENT_EXTENSIONS)],
    )
    upload_type = models.CharField(
        max_length=16,
        choices=UploadType.choices,
        default=UploadType.DOCUMENT,
    )
    content_type = models.CharField(max_length=128, blank=True)
    size = models.PositiveBigIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('File Upload')
        verbose_name_plural = _('File Uploads')
        ordering = ['-created_at']

    def clean(self):
        if not self.file:
            return

        extension = os.path.splitext(self.file.name)[1].lstrip('.').lower()
        if self.upload_type == self.UploadType.IMAGE and extension not in self.IMAGE_EXTENSIONS:
            raise ValidationError({'file': _('Upload type image requires a valid image extension.')})
        if self.upload_type == self.UploadType.DOCUMENT and extension not in self.DOCUMENT_EXTENSIONS:
            raise ValidationError({'file': _('Upload type document requires a valid document extension.')})

    def save(self, *args, **kwargs):
        if self.file:
            # try common locations for content_type depending on how the file
            # was provided (SimpleUploadedFile, InMemoryUploadedFile, or wrapped)
            content_type = getattr(self.file, 'content_type', '')
            if not content_type:
                wrapped = getattr(self.file, 'file', None)
                content_type = getattr(wrapped, 'content_type', '') if wrapped is not None else ''
            self.content_type = content_type or self.content_type or ''
            try:
                size = getattr(self.file, 'size', None)
                if size:
                    self.size = size
            except (AttributeError, ValueError):
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Donation(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor_name = models.CharField(max_length=255)
    donor_email = models.EmailField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    campaign = models.CharField(max_length=255, blank=True)
    reference = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    donated_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_donations")

    class Meta:
        ordering = ["-donated_at"]

    def __str__(self):
        return f"{self.donor_name} - {self.amount}"


class Event(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    capacity = models.PositiveIntegerField(default=0)
    is_public = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_events")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_date"]

    def __str__(self):
        return self.title


class NewsPost(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    body = models.TextField()
    category = models.CharField(max_length=120, blank=True)
    cover_image = models.ImageField(
        upload_to="news/covers/",
        blank=True,
        null=True,
        help_text="Optional lead image shown with the story on the website.",
    )
    image_caption = models.CharField(max_length=255, blank=True)
    published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="news_posts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


# core/models.py

import uuid

from django.db import models
from django.conf import settings


class MembershipType(models.TextChoices):
    REGULAR = "regular", "Regular Member"
    VOLUNTEER = "volunteer", "Volunteer"
    DONOR = "donor", "Donor"
    BENEFICIARY = "beneficiary", "Beneficiary"
    STAFF = "staff", "Staff"
    BOARD = "board", "Board Member"
    PARTNER = "partner", "Partner"


class MembershipStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    SUSPENDED = "suspended", "Suspended"
    ARCHIVED = "archived", "Archived"


class Member(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    member_id = models.CharField(
        max_length=30,
        unique=True
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)

    gender = models.CharField(max_length=20)

    date_of_birth = models.DateField(
        null=True,
        blank=True
    )

    address = models.TextField(blank=True)

    state = models.CharField(max_length=100)
    lga = models.CharField(max_length=100)

    occupation = models.CharField(
        max_length=150,
        blank=True
    )

    skills = models.TextField(blank=True)

    membership_type = models.CharField(
        max_length=50,
        choices=MembershipType.choices,
        default=MembershipType.REGULAR
    )

    status = models.CharField(
        max_length=50,
        choices=MembershipStatus.choices,
        default=MembershipStatus.PENDING
    )

    profile_photo = models.ImageField(
        upload_to="members/photos/",
        blank=True,
        null=True
    )

    notes = models.TextField(blank=True)

    joined_at = models.DateTimeField(
        auto_now_add=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def save(self, *args, **kwargs):

        if not self.member_id:

            year = timezone.now().year

            last_member = Member.objects.exclude(
                member_id=""
            ).order_by("-created_at").first()

            next_number = 1

            if last_member:
                try:
                    next_number = int(
                        last_member.member_id.split("-")[-1]
                    ) + 1
                except Exception:
                    pass

            self.member_id = (
                f"BFF-{year}-{next_number:05d}"
            )

        super().save(*args, **kwargs)


    def __str__(self):
        return self.full_name


import uuid

from django.db import models
from django.utils import timezone


class VolunteerStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    ON_LEAVE = "on_leave", "On Leave"
    SUSPENDED = "suspended", "Suspended"
    ARCHIVED = "archived", "Archived"


class VolunteerAvailability(models.TextChoices):
    FULL_TIME = "full_time", "Full Time"
    PART_TIME = "part_time", "Part Time"
    WEEKENDS = "weekends", "Weekends"
    REMOTE = "remote", "Remote"
    ON_CALL = "on_call", "On Call"


class VolunteerSkill(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Volunteer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volunteer_id = models.CharField(max_length=30, unique=True, blank=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="volunteer_profile",
    )
    member = models.OneToOneField(
        "Member",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="volunteer_profile",
    )
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True, blank=True)
    phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r"^\+?[0-9\s\-()]{7,15}$", message="Enter a valid phone number.")],
    )
    gender = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    lga = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    occupation = models.CharField(max_length=150, blank=True)
    organization = models.CharField(max_length=255, blank=True)
    profile_photo = models.ImageField(upload_to="volunteers/photos/", blank=True, null=True)
    bio = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relationship = models.CharField(max_length=100, blank=True)
    joined_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=VolunteerStatus.choices, default=VolunteerStatus.PENDING)
    availability = models.CharField(max_length=50, choices=VolunteerAvailability.choices, default=VolunteerAvailability.FULL_TIME)
    squad = models.CharField(max_length=100, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_gps_at = models.DateTimeField(null=True, blank=True)
    on_leave_until = models.DateField(null=True, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    skills = models.ManyToManyField(VolunteerSkill, related_name="volunteers", blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_volunteers",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_volunteers",
    )
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deleted_volunteers",
    )
    volunteer_hours = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def total_hours(self):
        return sum(log.hours for log in self.hour_logs.all())

    @property
    def assigned_programs(self):
        return [assignment.program for assignment in self.program_assignments.filter(is_active=True)]

    @property
    def cluster(self):
        return self.state or self.lga or "—"

    @property
    def specializations(self):
        return list(self.skills.values_list("name", flat=True))

    @property
    def active_deployment(self):
        assignment = self.program_assignments.filter(is_active=True).select_related("program").first()
        return assignment.program if assignment else None

    @property
    def deployment_status(self):
        if self.status == VolunteerStatus.ON_LEAVE:
            return "on_leave"
        if self.status != VolunteerStatus.ACTIVE:
            return self.status
        if self.active_deployment is not None:
            return "deployed"
        return "standby"

    @property
    def approved_hours(self):
        return sum(log.hours for log in self.hour_logs.filter(approval_status=VolunteerHourLog.ApprovalStatus.APPROVED))

    @property
    def compliance_score(self):
        total = self.hour_logs.count()
        if not total:
            return None
        approved = self.hour_logs.filter(approval_status=VolunteerHourLog.ApprovalStatus.APPROVED).count()
        return round((approved / total) * 100, 1)

    @property
    def last_shift(self):
        log = self.hour_logs.order_by("-date", "-created_at").first()
        if not log:
            return None
        return {
            "id": str(log.id).replace("-", "")[:8].upper(),
            "date": str(log.date or ""),
            "hours": log.hours,
            "activity": log.activity,
            "status": log.approval_status,
            "location": log.location,
        }

    @property
    def on_site_this_week(self):
        today = timezone.now().date()
        week_start = today - timezone.timedelta(days=today.weekday())
        return self.attendance.filter(attendance_date__gte=week_start).count()

    def clean(self):
        super().clean()
        if self.joined_date and self.joined_date > timezone.now().date():
            raise ValidationError({"joined_date": "Joined date cannot be in the future."})
        if self.email:
            self.email = self.email.lower()
        if not self.full_name:
            self.full_name = " ".join(filter(None, [self.first_name, self.last_name])).strip()

    def save(self, *args, **kwargs):
        self.full_clean(exclude=["member", "user", "created_by", "updated_by", "deleted_by", "skills"])
        if not self.volunteer_id:
            year = timezone.now().year
            last_volunteer = Volunteer.objects.exclude(volunteer_id="").order_by("-created_at").first()
            next_number = 1
            if last_volunteer:
                try:
                    next_number = int(last_volunteer.volunteer_id.split("-")[-1]) + 1
                except Exception:
                    pass
            self.volunteer_id = f"VOL-{year}-{next_number:05d}"
        if not self.full_name:
            self.full_name = " ".join(filter(None, [self.first_name, self.last_name])).strip()
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            AuditService.log(user=self.created_by, action="volunteer_registered", details={"volunteer_id": self.volunteer_id, "full_name": self.full_name})
        else:
            AuditService.log(user=self.updated_by, action="volunteer_updated", details={"volunteer_id": self.volunteer_id, "full_name": self.full_name})

    def soft_delete(self, deleted_by=None):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])
        AuditService.log(user=deleted_by, action="volunteer_deleted", details={"volunteer_id": self.volunteer_id, "full_name": self.full_name})

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=["is_deleted", "deleted_at", "deleted_by"])

    def __str__(self):
        return self.full_name or self.volunteer_id or str(self.id)


class VolunteerTraining(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name="trainings")
    training_name = models.CharField(max_length=255)
    provider = models.CharField(max_length=255, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    certificate_number = models.CharField(max_length=100, blank=True)
    certificate_file = models.FileField(upload_to="volunteers/trainings/", blank=True, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]

    def clean(self):
        super().clean()
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError({"end_date": "End date cannot be before start date."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        AuditService.log(user=None, action="training_added", details={"volunteer_id": self.volunteer.volunteer_id, "training_name": self.training_name})


class VolunteerAttendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name="attendance")
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="volunteer_attendance", null=True, blank=True)
    attendance_date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-attendance_date"]
        unique_together = ("volunteer", "program", "attendance_date")

    def clean(self):
        super().clean()
        if self.check_in and self.check_out and self.check_out <= self.check_in:
            raise ValidationError({"check_out": "Check out must be after check in."})
        if self.hours_worked < 0:
            raise ValidationError({"hours_worked": "Hours worked cannot be negative."})

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.check_in and self.check_out and not self.hours_worked:
            delta = self.check_out - self.check_in
            self.hours_worked = round(delta.total_seconds() / 3600, 2)
        super().save(*args, **kwargs)
        AuditService.log(user=None, action="attendance_recorded", details={"volunteer_id": self.volunteer.volunteer_id, "attendance_date": str(self.attendance_date)})


class VolunteerHourLog(models.Model):
    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name="hour_logs")
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name="volunteer_hour_logs")
    activity = models.CharField(max_length=255)
    date = models.DateField(null=True, blank=True)
    shift_start = models.DateTimeField(null=True, blank=True)
    shift_end = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)
    hours = models.PositiveIntegerField(default=0)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_volunteer_hours")
    approval_status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    query_note = models.TextField(blank=True)
    queried_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="queried_volunteer_hours")
    queried_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    @property
    def activity_date(self):
        return self.date

    @property
    def shift_id(self):
        return f"SH-{str(self.id).replace('-', '')[:8].upper()}"

    def clean(self):
        super().clean()
        if self.hours < 0:
            raise ValidationError({"hours": "Hours cannot be negative."})
        if self.shift_start and self.shift_end and self.shift_end <= self.shift_start:
            raise ValidationError({"shift_end": "Shift end must be after shift start."})

    def save(self, *args, **kwargs):
        self.full_clean()
        if not self.date:
            self.date = timezone.now().date()
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            self.volunteer.volunteer_hours += self.hours
            self.volunteer.save(update_fields=["volunteer_hours"])
            AuditService.log(user=self.approved_by, action="hours_logged", details={"volunteer_id": self.volunteer.volunteer_id, "hours": self.hours})

    def __str__(self):
        return f"{self.volunteer.volunteer_id} - {self.hours} hrs"


class VolunteerCertificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name="certificates")
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="volunteers/certificates/")
    issue_date = models.DateField()
    issued_by = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-issue_date"]

    def clean(self):
        super().clean()
        if self.file:
            extension = os.path.splitext(self.file.name)[1].lower()
            if extension not in {".pdf", ".jpg", ".jpeg", ".png"}:
                raise ValidationError({"file": "Certificates must be a PDF or image file."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        AuditService.log(user=None, action="certificate_uploaded", details={"volunteer_id": self.volunteer.volunteer_id, "title": self.title})


class VolunteerEvaluation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name="evaluations")
    evaluator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="submitted_evaluations")
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name="volunteer_evaluations")
    communication = models.PositiveIntegerField(default=0)
    teamwork = models.PositiveIntegerField(default=0)
    leadership = models.PositiveIntegerField(default=0)
    punctuality = models.PositiveIntegerField(default=0)
    professionalism = models.PositiveIntegerField(default=0)
    comments = models.TextField(blank=True)
    overall_score = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        super().clean()
        scores = [self.communication, self.teamwork, self.leadership, self.punctuality, self.professionalism]
        for score in scores:
            if score < 0 or score > 5:
                raise ValidationError({"communication": "Scores must be between 0 and 5."})

    def save(self, *args, **kwargs):
        self.full_clean()
        scores = [self.communication, self.teamwork, self.leadership, self.punctuality, self.professionalism]
        self.overall_score = round(sum(scores) / len(scores), 2) if scores else 0
        super().save(*args, **kwargs)
        AuditService.log(user=self.evaluator, action="evaluation_submitted", details={"volunteer_id": self.volunteer.volunteer_id})
