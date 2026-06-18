from rest_framework import serializers
from .models import Post, Category, MediaFile


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class MediaFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaFile
        fields = ['id', 'file', 'caption', 'uploaded_at']


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True, allow_blank=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_blank=True)
    media_files = MediaFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'category', 'category_name', 'author', 'author_name', 'body', 'published', 'published_at', 'created_at', 'media_files']
