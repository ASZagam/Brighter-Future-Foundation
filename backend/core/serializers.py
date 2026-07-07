from rest_framework import serializers
from django.utils import timezone
from .models import (
    Organization,
    Settings,
    Country,
    State,
    Notification,
    ActivityLog,
    FileUpload,
    Member,
    Volunteer,
    VolunteerHourLog,
    Program
)


# core/serializers.py
class ProgramSerializer(serializers.ModelSerializer):

    class Meta:
        model = Program
        fields = "__all__"

class VolunteerSerializer(serializers.ModelSerializer):

    member_name = serializers.CharField(
        source="member.full_name",
        read_only=True
    )

    member_email = serializers.CharField(
        source="member.email",
        read_only=True
    )

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


 # Hours Serializer       
class VolunteerHourLogSerializer(
    serializers.ModelSerializer
):

    volunteer_name = serializers.CharField(
        source="volunteer.member.full_name",
        read_only=True
    )

    class Meta:
        model = VolunteerHourLog

        fields = "__all__"

        read_only_fields = [
            "id",
            "created_at",
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

from rest_framework import serializers
from .models import OrganizationProfile


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
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
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
        read_only_fields = ['id', 'file_url', 'content_type', 'size', 'created_at', 'updated_at']

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

    def update(self, instance, validated_data):
        if 'file' in validated_data:
            upload_file = validated_data['file']
            content_type = getattr(upload_file, 'content_type', '') or getattr(getattr(upload_file, 'file', None), 'content_type', '')
            validated_data['content_type'] = content_type
            validated_data['size'] = getattr(upload_file, 'size', 0)
        return super().update(instance, validated_data)
