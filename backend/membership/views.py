from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Member, MembershipType, MembershipPayment
from .serializers import MemberSerializer, MembershipTypeSerializer, MembershipPaymentSerializer


class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.select_related('user', 'membership_type')
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active members"""
        active_members = Member.objects.filter(is_active=True).select_related('user', 'membership_type')
        serializer = self.get_serializer(active_members, many=True)
        return Response({'results': serializer.data})


class MembershipTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MembershipType.objects.all()
    serializer_class = MembershipTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


class MembershipPaymentViewSet(viewsets.ModelViewSet):
    queryset = MembershipPayment.objects.select_related('member')
    serializer_class = MembershipPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
