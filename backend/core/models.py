import os
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

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
    PLANNED = "planned", "Planned"
    ACTIVE = "active", "Active"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"



class Program(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    program_id = models.CharField(
        max_length=30,
        unique=True
    )

    title = models.CharField(
        max_length=255
    )

    slug = models.SlugField(
        unique=True
    )

    description = models.TextField()

    objectives = models.TextField(
        blank=True
    )

    location = models.CharField(
        max_length=255,
        blank=True
    )

    start_date = models.DateField()

    end_date = models.DateField(
        null=True,
        blank=True
    )

    budget = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    beneficiaries_target = models.PositiveIntegerField(
        default=0
    )

    status = models.CharField(
        max_length=30,
        choices=ProgramStatus.choices,
        default=ProgramStatus.PLANNED
    )

    cover_image = models.ImageField(
        upload_to="programs/covers/",
        blank=True,
        null=True
    )

    is_featured = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )


    def save(self, *args, **kwargs):

        if not self.program_id:

            year = timezone.now().year

            last_program = Program.objects.order_by(
                "-created_at"
            ).first()

            next_number = 1

            if last_program:
                try:
                    next_number = int(
                        last_program.program_id.split("-")[-1]
                    ) + 1
                except:
                    pass

            self.program_id = (
                f"PRG-{year}-{next_number:05d}"
            )

        super().save(*args, **kwargs)


    def __str__(self):
        return self.title
            

class ProgramBeneficiary(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    member = models.ForeignKey(
        "core.Member",
        on_delete=models.CASCADE,
        related_name="programs"
    )

    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name="beneficiaries"
    )

    enrolled_at = models.DateTimeField(
        auto_now_add=True
    )

    notes = models.TextField(
        blank=True
    )

    class Meta:
        unique_together = (
            "member",
            "program"
        )

    def __str__(self):
        return (
            f"{self.member.full_name}"
            f" - {self.program.title}"
        )
    


class ProgramGallery(models.Model):

    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name="gallery"
    )

    image = models.ImageField(
        upload_to="programs/gallery/"
    )

    caption = models.CharField(
        max_length=255,
        blank=True
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.program.title
    


class ProgramReport(models.Model):

    program = models.ForeignKey(
        Program,
        on_delete=models.CASCADE,
        related_name="reports"
    )

    title = models.CharField(
        max_length=255
    )

    report = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title



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
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    SUSPENDED = "suspended", "Suspended"


class Volunteer(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    volunteer_id = models.CharField(
        max_length=30,
        unique=True,
        blank=True
    )

    member = models.OneToOneField(
        "Member",
        on_delete=models.CASCADE,
        related_name="volunteer_profile"
    )

    emergency_contact_name = models.CharField(
        max_length=255
    )

    emergency_contact_phone = models.CharField(
        max_length=20
    )

    availability = models.CharField(
        max_length=255,
        help_text="Weekends, Evenings, Full Time"
    )

    volunteer_hours = models.PositiveIntegerField(
        default=0
    )

    status = models.CharField(
        max_length=50,
        choices=VolunteerStatus.choices,
        default=VolunteerStatus.ACTIVE
    )

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):

        if not self.volunteer_id:

            year = timezone.now().year

            last_volunteer = Volunteer.objects.exclude(
                volunteer_id=""
            ).order_by("-created_at").first()

            next_number = 1

            if last_volunteer:
                try:
                    next_number = int(
                        last_volunteer.volunteer_id.split("-")[-1]
                    ) + 1
                except Exception:
                    pass

            self.volunteer_id = (
                f"VOL-{year}-{next_number:05d}"
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.volunteer_id} - {self.member.full_name}"
    


class VolunteerHourLog(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    volunteer = models.ForeignKey(
        Volunteer,
        on_delete=models.CASCADE,
        related_name="hour_logs"
    )

    activity = models.CharField(
        max_length=255
    )

    hours = models.PositiveIntegerField()

    activity_date = models.DateField()

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-activity_date"]

    def save(self, *args, **kwargs):

        is_new = self.pk is None

        super().save(*args, **kwargs)

        if is_new:
            self.volunteer.volunteer_hours += self.hours
            self.volunteer.save()

    def __str__(self):
        return f"{self.volunteer.volunteer_id} - {self.hours} hrs"