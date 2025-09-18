from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TrailerMetaViewSet

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r"trailers", TrailerMetaViewSet, basename="trailer")

# API URL patterns
urlpatterns = [
    path("api/", include(router.urls)),
]

# Add app name for namespacing
app_name = "trailers"
