from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .email_service import EmailService
from .models import EmailVerificationToken, PasswordResetToken, User
from .serializers import (
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetSerializer,
    RegisterSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)
from .services import AuditService

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed
from drf_spectacular.utils import extend_schema


class CustomTokenObtainPairSerializer(serializers.Serializer):

    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)

    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        username = attrs.get("username")
        if not email and not username:
            raise serializers.ValidationError({"email": "Email or username is required."})

        user = authenticate(
            email=attrs["email"],
            password=attrs["password"],
        ) if email else authenticate(username=username, password=attrs["password"])

        if not user:
            raise AuthenticationFailed("Invalid email or password.")

        if not user.email_verified:
            raise AuthenticationFailed("Email address has not been verified.")

        if user.status != "active":
            raise AuthenticationFailed("Account is not active.")

        refresh = RefreshToken.for_user(user)

        AuditService.log(
            user=user,
            action="login",
            request=self.context.get("request"),
        )

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
        }

class AuthLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = []

    @extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        EmailService.send_verification_email(user, request)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class RequestPasswordResetView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email=email).first()

        if user:
            EmailService.send_password_reset_email(user, request)

        return Response(
            {'detail': 'If a matching account exists, a password reset email has been sent.'},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        expiration = timezone.now() - timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRATION)

        reset_token = PasswordResetToken.objects.filter(token=token, is_used=False).first()
        if not reset_token or reset_token.created_at < expiration:
            raise ValidationError('Invalid or expired password reset token.')

        user = reset_token.user
        user.set_password(new_password)
        user.last_password_change = timezone.now()
        user.save(update_fields=['password', 'last_password_change'])
        AuditService.log(
            user=user,
            action="password_reset",
            request=request,
        )

        reset_token.is_used = True
        reset_token.save(update_fields=['is_used'])

        return Response({'detail': 'Password reset successfully.'}, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        expiration = timezone.now() - timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRATION)

        email_token = EmailVerificationToken.objects.filter(token=token, is_used=False).first()
        if not email_token or email_token.created_at < expiration:
            raise ValidationError('Invalid or expired verification token.')

        user = email_token.user
        user.email_verified = True
        user.email_verified_at = timezone.now()
        user.status = 'active'
        user.save(update_fields=['email_verified', 'email_verified_at', 'status'])
        AuditService.log(
            user=user,
            action="email_verified",
            request=request,
        )

        email_token.is_used = True
        email_token.save(update_fields=['is_used'])

        return Response(
            {'detail': 'Email verified successfully.', 'user': UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': 'Old password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.last_password_change = timezone.now()
        user.save(update_fields=['password', 'last_password_change'])

        AuditService.log(
            user=user,
            action="password_change",
            request=request,
        )

        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)

class LogoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        AuditService.log(
            user=request.user,
            action="logout",
            request=request,
        )

        return Response({
            "detail": "Logged out successfully."
        })