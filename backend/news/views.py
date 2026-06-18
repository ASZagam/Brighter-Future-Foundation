from rest_framework import viewsets, permissions
from .models import Post, Category, MediaFile
from .serializers import PostSerializer, CategorySerializer, MediaFileSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.select_related('category', 'author').prefetch_related('media_files')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show published posts for non-staff users
        if self.request.user and self.request.user.is_staff:
            return Post.objects.select_related('category', 'author').prefetch_related('media_files')
        return Post.objects.filter(published=True).select_related('category', 'author').prefetch_related('media_files')


class MediaFileViewSet(viewsets.ModelViewSet):
    queryset = MediaFile.objects.select_related('post')
    serializer_class = MediaFileSerializer
    permission_classes = [permissions.IsAuthenticated]
