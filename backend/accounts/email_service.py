"""
Email service for sending authentication-related emails
"""
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import EmailVerificationToken, PasswordResetToken

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending authentication emails"""

    @staticmethod
    def send_email(
        subject: str,
        recipient_list: list,
        html_message: str,
        plain_message: str = None,
    ) -> bool:
        """
        Send email using Django's email backend
        
        Args:
            subject: Email subject
            recipient_list: List of recipient email addresses
            html_message: HTML email body
            plain_message: Plain text email body
            
        Returns:
            bool: True if email sent successfully
        """
        if not plain_message:
            plain_message = strip_tags(html_message)

        try:
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Email sent successfully to {recipient_list}")
            return True
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False

    @staticmethod
    def send_verification_email(user, request=None) -> bool:
        """
        Send email verification email to user
        
        Args:
            user: User object
            request: HTTP request object for building verification link
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            # Get or create verification token
            email_token, _ = EmailVerificationToken.objects.get_or_create(user=user)

            # Build verification link
            if request:
                frontend_url = f"{request.scheme}://{request.get_host()}"
            else:
                frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else "http://localhost:3000"

            verification_link = f"{frontend_url}/auth/verify-email?token={email_token.token}"

            # Prepare email content
            subject = "Verify Your Email Address - BFF"
            context = {
                'user': user,
                'verification_link': verification_link,
                'token': email_token.token,
            }

            html_message = render_to_string(
                'emails/verify_email.html',
                context
            )

            # Send email
            return EmailService.send_email(
                subject=subject,
                recipient_list=[user.email],
                html_message=html_message,
            )
        except Exception as e:
            logger.error(f"Error sending verification email: {str(e)}")
            return False

    @staticmethod
    def send_password_reset_email(user, request=None) -> bool:
        """
        Send password reset email to user
        
        Args:
            user: User object
            request: HTTP request object for building reset link
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            # Create password reset token
            token = PasswordResetToken.objects.create(user=user)

            # Build reset link
            if request:
                frontend_url = f"{request.scheme}://{request.get_host()}"
            else:
                frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else "http://localhost:3000"

            reset_link = f"{frontend_url}/auth/reset-password?token={token.token}"

            # Prepare email content
            subject = "Password Reset Request - BFF"
            context = {
                'user': user,
                'reset_link': reset_link,
                'token': token.token,
            }

            html_message = render_to_string(
                'emails/password_reset.html',
                context
            )

            # Send email
            return EmailService.send_email(
                subject=subject,
                recipient_list=[user.email],
                html_message=html_message,
            )
        except Exception as e:
            logger.error(f"Error sending password reset email: {str(e)}")
            return False

    @staticmethod
    def send_welcome_email(user, request=None) -> bool:
        """
        Send welcome email to newly registered user
        
        Args:
            user: User object
            request: HTTP request object
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            subject = "Welcome to Brighter Future Foundation (BFF)!"
            context = {
                'user': user,
            }

            html_message = render_to_string(
                'emails/welcome.html',
                context
            )

            return EmailService.send_email(
                subject=subject,
                recipient_list=[user.email],
                html_message=html_message,
            )
        except Exception as e:
            logger.error(f"Error sending welcome email: {str(e)}")
            return False

    @staticmethod
    def send_password_changed_email(user) -> bool:
        """
        Send password changed confirmation email
        
        Args:
            user: User object
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            subject = "Your Password Has Been Changed - BFF"
            context = {
                'user': user,
            }

            html_message = render_to_string(
                'emails/password_changed.html',
                context
            )

            return EmailService.send_email(
                subject=subject,
                recipient_list=[user.email],
                html_message=html_message,
            )
        except Exception as e:
            logger.error(f"Error sending password changed email: {str(e)}")
            return False
