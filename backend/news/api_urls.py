from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CategoryViewSet, MediaFileViewSet

router = DefaultRouter()
router.register(r'news', PostViewSet, basename='post')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'media-files', MediaFileViewSet, basename='media-file')

urlpatterns = [
    path('', include(router.urls)),
]
