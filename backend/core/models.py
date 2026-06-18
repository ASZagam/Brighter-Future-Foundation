import os
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


def upload_to_path(instance, filename):
    name, ext = os.path.splitext(filename.lower())
    ext = ext.lstrip('.')
    if ext in FileUpload.IMAGE_EXTENSIONS:
        folder = 'uploads/images'
    else:
        folder = 'uploads/documents'
    return f'{folder}/{instance.organization_id or "global"}/{filename}'


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
