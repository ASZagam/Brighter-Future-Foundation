from rest_framework import serializers
from .models import Volunteer, VolunteerSkill, VolunteerAssignment


class VolunteerSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerSkill
        fields = ['id', 'name']


class VolunteerSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    skills_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Volunteer
        fields = ['id', 'full_name', 'email', 'phone', 'bio', 'joined_at', 'skills_list']

    def get_full_name(self, obj):
        full_name = obj.user.full_name or f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name or obj.user.username

    def get_email(self, obj):
        return obj.user.email

    def get_phone(self, obj):
        return obj.user.phone or ''

    def get_skills_list(self, obj):
        return [skill.name for skill in obj.skills.all()]


class VolunteerAssignmentSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = VolunteerAssignment
        fields = ['id', 'volunteer', 'volunteer_name', 'title', 'description', 'status', 'start_date', 'end_date']

    def get_volunteer_name(self, obj):
        full_name = obj.volunteer.user.full_name or f"{obj.volunteer.user.first_name} {obj.volunteer.user.last_name}".strip()
        return full_name or obj.volunteer.user.username
