from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

User = get_user_model()


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


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True, required=False)

    def validate(self, data):
        if data['password'] != data.get('password2', data['password']):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'username': 'A user with that username already exists.'})

        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({'email': 'A user with that email already exists.'})

        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data.pop('password2', None)
        user = User.objects.create_user(
            password=password,
            **{
                'username': validated_data['username'],
                'email': validated_data['email'],
                'full_name': validated_data.get('full_name', ''),
                'phone': validated_data.get('phone', ''),
                'status': 'inactive',
            }
        )
        user.email_verified = False
        user.save(update_fields=['email_verified', 'status'])
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

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

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'New passwords do not match.'})
        return data


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField()
