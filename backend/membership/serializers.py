from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Member, MembershipType, MembershipPayment

User = get_user_model()


class MembershipTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipType
        fields = ['id', 'name', 'description', 'fee']


class MemberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    membership_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Member
        fields = ['id', 'full_name', 'email', 'phone', 'membership_status', 'join_date', 'is_active', 'membership_type']

    def get_full_name(self, obj):
        full_name = obj.user.full_name or f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.username

    def get_email(self, obj):
        return obj.user.email

    def get_phone(self, obj):
        return obj.user.phone or ''

    def get_membership_status(self, obj):
        return 'active' if obj.is_active else 'inactive'


class MembershipPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPayment
        fields = '__all__'
