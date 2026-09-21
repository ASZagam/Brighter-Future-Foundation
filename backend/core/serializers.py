import os

from rest_framework import serializers
from accounts.models import AuditLog as AccountAuditLog
from .models import (
    ActivityLog,
    Country,
    Donation,
    Event,
    FileUpload,
    Member,
    Notification,
    NewsPost,
    Organization,
    OrganizationProfile,
    Program,
    ProgramBeneficiary,
    ProgramCategory,
    ProgramDocument,
    ProgramGallery,
    ProgramReport,
    ProgramVolunteerAssignment,
    Settings,
    State,
    Volunteer,
    VolunteerHourLog,
    VolunteerSkill,
)


class ProgramCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramCategory
        fields = ["id", "name", "description", "color", "icon", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ProgramBeneficiarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramBeneficiary
        fields = ["id", "program", "full_name", "gender", "age", "phone", "state", "lga", "community", "occupation", "disability", "notes", "created_at"]
        read_only_fields = ["id", "program", "created_at"]


class ProgramDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True)

    class Meta:
        model = ProgramDocument
        fields = ["id", "program", "title", "document_type", "file", "uploaded_by", "uploaded_by_name", "uploaded_at"]
        read_only_fields = ["id", "uploaded_by", "uploaded_at"]

    def validate(self, attrs):
        file_obj = attrs.get("file")
        if not file_obj:
            raise serializers.ValidationError({"file": "A file is required."})
        extension = os.path.splitext(file_obj.name)[1].lower()
        allowed_extensions = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".zip"}
        if extension not in allowed_extensions:
            raise serializers.ValidationError({"file": "Unsupported document format."})
        return attrs


class ProgramGallerySerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True)

    class Meta:
        model = ProgramGallery
        fields = ["id", "program", "image", "caption", "published", "uploaded_by", "uploaded_by_name", "uploaded_at"]
        read_only_fields = ["id", "uploaded_by", "uploaded_at"]


class ProgramReportSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source="submitted_by.get_full_name", read_only=True)

    class Meta:
        model = ProgramReport
        fields = ["id", "program", "title", "summary", "challenges", "lessons_learned", "recommendations", "submitted_by", "submitted_by_name", "submitted_at"]
        read_only_fields = ["id", "submitted_by", "submitted_at"]


class ProgramVolunteerAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramVolunteerAssignment
        fields = ["id", "program", "volunteer", "assigned_by", "assigned_at", "notes", "is_active"]
        read_only_fields = ["id", "program", "assigned_by", "assigned_at"]


class ProgramSerializer(serializers.ModelSerializer):
    category = ProgramCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(source="category", queryset=ProgramCategory.objects.all(), write_only=True, required=False, allow_null=True)
    beneficiaries = ProgramBeneficiarySerializer(many=True, read_only=True)
    documents = ProgramDocumentSerializer(many=True, read_only=True)
    gallery = ProgramGallerySerializer(many=True, read_only=True)
    reports = ProgramReportSerializer(many=True, read_only=True)
    volunteer_assignments = ProgramVolunteerAssignmentSerializer(many=True, read_only=True)
    manager_name = serializers.CharField(source="manager.get_full_name", read_only=True)
    coordinator_name = serializers.CharField(source="coordinator.get_full_name", read_only=True)
    country_name = serializers.CharField(source="country.name", read_only=True)
    state_name = serializers.CharField(source="state.name", read_only=True)
    remaining_budget = serializers.ReadOnlyField()
    percentage_budget_used = serializers.ReadOnlyField()

    class Meta:
        model = Program
        fields = [
            "id",
            "program_id",
            "title",
            "slug",
            "category",
            "category_id",
            "description",
            "objectives",
            "expected_outcomes",
            "status",
            "priority",
            "country",
            "country_name",
            "state",
            "state_name",
            "lga",
            "address",
            "start_date",
            "end_date",
            "budget",
            "amount_spent",
            "funding_target",
            "beneficiary_count",
            "manager",
            "manager_name",
            "coordinator",
            "coordinator_name",
            "created_by",
            "updated_by",
            "is_deleted",
            "deleted_at",
            "deleted_by",
            "remaining_budget",
            "percentage_budget_used",
            "beneficiaries",
            "documents",
            "gallery",
            "reports",
            "volunteer_assignments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "program_id", "created_by", "updated_by", "is_deleted", "deleted_at", "deleted_by", "created_at", "updated_at", "remaining_budget", "percentage_budget_used", "beneficiaries", "documents", "gallery", "reports", "volunteer_assignments"]

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end_date = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})

        budget = attrs.get("budget", getattr(self.instance, "budget", None))
        amount_spent = attrs.get("amount_spent", getattr(self.instance, "amount_spent", None))
        if budget is not None and budget < 0:
            raise serializers.ValidationError({"budget": "Budget cannot be negative."})
        if amount_spent is not None and amount_spent < 0:
            raise serializers.ValidationError({"amount_spent": "Amount spent cannot be negative."})
        if budget is not None and amount_spent is not None and amount_spent > budget:
            raise serializers.ValidationError({"amount_spent": "Amount spent cannot exceed budget."})

        funding_target = attrs.get("funding_target", getattr(self.instance, "funding_target", None))
        if funding_target is not None and funding_target < 0:
            raise serializers.ValidationError({"funding_target": "Funding target cannot be negative."})

        slug = attrs.get("slug")
        if slug is None and self.instance is not None:
            slug = self.instance.slug
        if slug:
            queryset = Program.objects.filter(slug__iexact=slug)
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError({"slug": "A program with this slug already exists."})

        return attrs

class VolunteerSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerSkill
        fields = ["id", "name", "description", "is_active"]


class VolunteerSerializer(serializers.ModelSerializer):

    member_name = serializers.CharField(
        source="member.full_name",
        read_only=True
    )

    member_email = serializers.CharField(
        source="member.email",
        read_only=True
    )

    cluster = serializers.CharField(read_only=True)
    deployment_status = serializers.CharField(read_only=True)
    specializations = serializers.ListField(read_only=True)
    skills_list = serializers.ListField(source="specializations", read_only=True)
    compliance_score = serializers.FloatField(read_only=True, allow_null=True)
    total_hours = serializers.FloatField(source="approved_hours", read_only=True, allow_null=True)
    last_shift = serializers.DictField(read_only=True, allow_null=True)
    on_site_this_week = serializers.IntegerField(read_only=True)
    active_deployment = serializers.SerializerMethodField()

    class Meta:
        model = Volunteer

        fields = "__all__"

        read_only_fields = [
            "id",
            "volunteer_id",
            "volunteer_hours",
            "created_at",
            "updated_at",
        ]

    def get_active_deployment(self, obj):
        program = obj.active_deployment
        if not program:
            return None
        return {
            "program_id": program.program_id,
            "title": program.title,
            "status": program.status,
            "priority": program.priority,
        }


 # Hours Serializer       
class VolunteerHourLogSerializer(
    serializers.ModelSerializer
):

    volunteer_name = serializers.CharField(
        source="volunteer.member.full_name",
        read_only=True
    )

    volunteer_full_name = serializers.CharField(
        source="volunteer.full_name",
        read_only=True
    )

    volunteer_ref = serializers.CharField(
        source="volunteer.volunteer_id",
        read_only=True
    )

    program_title = serializers.CharField(
        source="program.title",
        read_only=True
    )

    shift_id = serializers.CharField(read_only=True)
    reviewer_name = serializers.CharField(source="approved_by.get_full_name", read_only=True)
    queried_by_name = serializers.CharField(source="queried_by.get_full_name", read_only=True)

    class Meta:
        model = VolunteerHourLog

        fields = "__all__"

        read_only_fields = [
            "id",
            "shift_id",
            "created_at",
            "approval_status",
            "approved_by",
            "queried_by",
            "queried_at",
        ]


class MemberSerializer(serializers.ModelSerializer):

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Member
        fields = "__all__"

        read_only_fields = [
            "id",
            "member_id",
            "joined_at",
            "created_at",
            "updated_at",
        ]




class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = [
            'id',
            'name',
            'iso_code',
            'iso3_code',
            'numeric_code',
            'calling_code',
            'active',
        ]
        read_only_fields = ['id']


class StateSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)

    class Meta:
        model = State
        fields = [
            'id',
            'country',
            'country_name',
            'name',
            'code',
            'active',
        ]
        read_only_fields = ['id', 'country_name']

# core/serializers.py

class OrganizationProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrganizationProfile
        fields = "__all__"




        
class OrganizationSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    country_name = serializers.CharField(source='country.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'legal_name',
            'abbreviation',
            'mission_statement',
            'description',
            'email',
            'phone',
            'website',
            'address_line1',
            'address_line2',
            'city',
            'postal_code',
            'country',
            'country_name',
            'state',
            'state_name',
            'logo',
            'logo_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'logo_url', 'created_at', 'updated_at']

    def get_logo_url(self, obj):
        request = self.context.get('request')
        if obj.logo and hasattr(obj.logo, 'url'):
            return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
        return None


class SettingsSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Settings
        fields = [
            'id',
            'organization',
            'organization_name',
            'default_timezone',
            'default_language',
            'support_email',
            'support_phone',
            'maintenance_mode',
            'enable_file_uploads',
            'max_upload_size_mb',
            'notification_sender',
            'analytics_enabled',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'organization_name', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    # user will be set by the view (current authenticated user)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'organization',
            'title',
            'message',
            'notification_type',
            'category',
            'read',
            'sent_at',
            'metadata',
        ]
        read_only_fields = ['id', 'sent_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'user',
            'user_name',
            'organization',
            'organization_name',
            'action',
            'category',
            'ip_address',
            'user_agent',
            'details',
            'created_at',
        ]
        read_only_fields = ['id', 'user_name', 'organization_name', 'created_at']

    def get_user_name(self, obj):
        if not obj.user:
            return ''
        return obj.user.get_full_name() or obj.user.username


AUDIT_AUTH_ACTIONS = {
    'login', 'logout', 'failed_login', 'password_change', 'password_reset',
    'email_verified', 'account_locked', 'account_unlocked',
}
AUDIT_ACTION_PREFIXES = (
    ('volunteer', 'volunteer'), ('hours', 'volunteer'), ('training', 'volunteer'),
    ('attendance', 'volunteer'), ('certificate', 'volunteer'), ('evaluation', 'volunteer'),
    ('beneficiary', 'program'), ('program', 'program'),
    ('donation', 'donation'), ('member', 'member'),
    ('role', 'system'), ('account', 'system'),
)


def audit_category(action, details):
    if action in AUDIT_AUTH_ACTIONS:
        return 'auth'
    if isinstance(details, dict) and details.get('category'):
        return details['category']
    for prefix, category in AUDIT_ACTION_PREFIXES:
        if action.startswith(prefix):
            return category
    return 'system'


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    class Meta:
        model = AccountAuditLog
        fields = [
            'id',
            'user',
            'user_name',
            'organization_name',
            'action',
            'category',
            'ip_address',
            'user_agent',
            'details',
            'created_at',
        ]
        read_only_fields = fields

    def get_user_name(self, obj):
        if not obj.user:
            return ''
        return obj.user.get_full_name() or obj.user.username

    def get_organization_name(self, obj):
        return ''

    def get_category(self, obj):
        return audit_category(obj.action, obj.details)


class FileUploadSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = FileUpload
        fields = [
            'id',
            'user',
            'uploaded_by',
            'organization',
            'title',
            'description',
            'file',
            'file_url',
            'upload_type',
            'content_type',
            'size',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'file_url', 'content_type', 'size', 'is_active', 'created_at', 'updated_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None

    def validate(self, attrs):
        upload_type = attrs.get('upload_type', getattr(self.instance, 'upload_type', None))
        file_field = attrs.get('file', getattr(self.instance, 'file', None))
        if not file_field:
            raise serializers.ValidationError({'file': 'File upload is required.'})

        extension = file_field.name.split('.')[-1].lower()
        if upload_type == FileUpload.UploadType.IMAGE and extension not in FileUpload.IMAGE_EXTENSIONS:
            raise serializers.ValidationError({'file': 'Image upload requires one of: ' + ', '.join(FileUpload.IMAGE_EXTENSIONS)})
        if upload_type == FileUpload.UploadType.DOCUMENT and extension not in FileUpload.DOCUMENT_EXTENSIONS:
            raise serializers.ValidationError({'file': 'Document upload requires one of: ' + ', '.join(FileUpload.DOCUMENT_EXTENSIONS)})
        return attrs

    def create(self, validated_data):
        upload_file = validated_data['file']
        # handle MultipartUploadedFile or SimpleUploadedFile wrappers
        content_type = getattr(upload_file, 'content_type', '') or getattr(getattr(upload_file, 'file', None), 'content_type', '')
        validated_data['content_type'] = content_type
        validated_data['size'] = getattr(upload_file, 'size', 0)
        return super().create(validated_data)


class DonationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donation
        fields = "__all__"
        read_only_fields = ["id", "created_by", "donated_at"]


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        if attrs.get("end_date") and attrs.get("start_date") and attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        return attrs


class NewsPostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category", read_only=True)

    class Meta:
        model = NewsPost
        fields = "__all__"
        read_only_fields = ["id", "author", "author_name", "category_name", "created_at", "updated_at"]

    def get_author_name(self, obj):
        if not obj.author:
            return ""
        return obj.author.get_full_name() or obj.author.username

    def update(self, instance, validated_data):
        if 'file' in validated_data:
            upload_file = validated_data['file']
            content_type = getattr(upload_file, 'content_type', '') or getattr(getattr(upload_file, 'file', None), 'content_type', '')
            validated_data['content_type'] = content_type
            validated_data['size'] = getattr(upload_file, 'size', 0)
        return super().update(instance, validated_data)
