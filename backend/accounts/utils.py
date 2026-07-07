import re
import uuid

from .models import User


def slugify_username(value: str) -> str:
    """
    Convert a string into a valid Django username.
    Example:
        "Sani Zagam" -> "sanizagam"
        "computer.engineer" -> "computerengineer"
    """
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]", "", value)
    return value


def generate_username(first_name="", last_name="", email=""):
    """
    Username priority:

    1. First letter of first name + last name
       Abdulmalik Zagam
       -> azagam

    2. Email prefix
       abdul@gmail.com
       -> abdul

    3. UUID fallback
    """

    base = ""

    if first_name and last_name:
        base = f"{first_name[0]}{last_name}"

    elif email:
        base = email.split("@")[0]

    base = slugify_username(base)

    if not base:
        return f"user_{uuid.uuid4().hex[:8]}"

    username = base
    counter = 1

    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1

    return username