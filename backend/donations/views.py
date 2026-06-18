from rest_framework import viewsets, permissions
from .models import Donor, Campaign, Transaction, Donation
from .serializers import DonorSerializer, CampaignSerializer, TransactionSerializer, DonationSerializer


class DonorViewSet(viewsets.ModelViewSet):
    queryset = Donor.objects.all()
    serializer_class = DonorSerializer
    permission_classes = [permissions.IsAuthenticated]


class CampaignViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]


class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.select_related('donor', 'campaign')
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.select_related('donation')
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
