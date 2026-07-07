from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AuthLoginView,
    ChangePasswordView,
    CurrentUserView,
    RegisterView,
    RequestPasswordResetView,
    ResetPasswordView,
    VerifyEmailView,
    LogoutView,
)

urlpatterns = [
    path('auth/login/', AuthLoginView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/request-password-reset/', RequestPasswordResetView.as_view(), name='request_password_reset'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path("auth/logout/",LogoutView.as_view(),name="logout"),
]
