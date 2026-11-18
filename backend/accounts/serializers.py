from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers
import uuid
User = get_user_model()
from .utils import generate_username
from .models import User, Role, UserRole, Roles


def password_validation_errors(password, user=None):
    try:
        django_validate_password(password, user=user)
    except DjangoValidationError as error:
        return error.messages
    return []


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User._meta.get_field('roles').related_model
        fields = ['id', 'name', 'description']


class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    role_names = serializers.SerializerMethodField()
    is_super_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'full_name',
            'phone',
            'status',
            'email_verified',
            'email_verified_at',
            'roles',
            'role_names',
            'is_super_admin',
            'date_joined',
        ]
        read_only_fields = ['id', 'email_verified', 'email_verified_at', 'roles', 'role_names', 'is_super_admin', 'date_joined']

    def get_role_names(self, obj):
        return [role.name for role in obj.roles.all()]

    def get_is_super_admin(self, obj):
        return obj.is_super_admin


import uuid

class RegisterSerializer(serializers.ModelSerializer):

    email = serializers.EmailField()

    first_name = serializers.CharField(
        required=False,
        allow_blank=True
    )

    last_name = serializers.CharField(
        required=False,
        allow_blank=True
    )

    full_name = serializers.CharField(
        required=False,
        allow_blank=True
    )

    phone = serializers.CharField(
        required=False,
        allow_blank=True
    )

    password = serializers.CharField(write_only=True)

    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User

        fields = (
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "password",
            "password2",
        )

    def validate(self, attrs):

        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Passwords do not match."}
            )

        candidate = User(
            username=attrs["email"].split("@", 1)[0],
            email=attrs["email"],
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
            full_name=attrs.get("full_name", ""),
        )
        password_errors = password_validation_errors(attrs["password"], user=candidate)
        if password_errors:
            raise serializers.ValidationError({"password": password_errors})

        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError(
                {"email": "A user with this email already exists."}
            )

        return attrs

        

    def create(self, validated_data):
            validated_data.pop("password2")
            password = validated_data.pop("password")

            first_name = validated_data.get("first_name", "").strip()
            last_name = validated_data.get("last_name", "").strip()

            username = generate_username(
                first_name=first_name,
                last_name=last_name,
                email=validated_data["email"],
            )

            full_name = validated_data.get("full_name", "").strip()

            if not full_name:
                full_name = " ".join(filter(None, [first_name, last_name]))

            validated_data["full_name"] = full_name

            # Create user
            user = User.objects.create_user(
                username=username,
                password=password,
                **validated_data,
            )

            # -----------------------------------------
            # Automatically assign the Member role
            # -----------------------------------------
            member_role, _ = Role.objects.get_or_create(
                name=Roles.MEMBER,
                defaults={
                    "description": "Default role assigned to newly registered users."
                }
            )

            UserRole.objects.get_or_create(
                user=user,
                role=member_role,
            )

            return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        password_errors = password_validation_errors(
            value, user=self.context.get("user")
        )
        if password_errors:
            raise serializers.ValidationError(password_errors)
        return value

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'New passwords do not match.'})
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        password_errors = password_validation_errors(
            value, user=self.context.get("user")
        )
        if password_errors:
            raise serializers.ValidationError(password_errors)
        return value

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'New passwords do not match.'})
        return data


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()
