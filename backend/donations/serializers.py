from rest_framework import serializers
from .models import Donor, Campaign, Transaction, Donation


class DonorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donor
        fields = ['id', 'full_name', 'email', 'phone', 'created_at']


class CampaignSerializer(serializers.ModelSerializer):
    total_raised = serializers.SerializerMethodField()
    
    class Meta:
        model = Campaign
        fields = ['id', 'title', 'description', 'target_amount', 'total_raised', 'start_date', 'end_date', 'is_active']

    def get_total_raised(self, obj):
        donations = obj.donations.filter(status='completed')
        return sum(d.amount for d in donations)


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'provider', 'transaction_reference', 'amount', 'status', 'created_at']


class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.full_name', read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True, allow_blank=True)
    
    class Meta:
        model = Donation
        fields = ['id', 'donor', 'donor_name', 'campaign', 'campaign_title', 'amount', 'status', 'donated_at', 'reference']
