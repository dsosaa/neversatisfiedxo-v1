from django.db.models import Q
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import TrailerMeta
from .serializers import (
    TrailerCreateSerializer,
    TrailerListSerializer,
    TrailerMetaSerializer,
)

class TrailerMetaFilter(django_filters.FilterSet):
    """
    Filter set for TrailerMeta API with price and duration filtering
    """

    # Price filtering
    price_min = django_filters.NumberFilter(method="filter_price_min")
    price_max = django_filters.NumberFilter(method="filter_price_max")

    # Duration filtering
    length_min = django_filters.NumberFilter(method="filter_length_min")
    length_max = django_filters.NumberFilter(method="filter_length_max")

    # Text search across multiple fields
    search = django_filters.CharFilter(method="filter_search")

    # Creator filtering
    creator = django_filters.CharFilter(field_name="creators", lookup_expr="icontains")

    # Status filtering
    status = django_filters.ChoiceFilter(
        field_name="upload_status", choices=TrailerMeta.UPLOAD_STATUS_CHOICES
    )

    # Featured/Premium filtering
    is_featured = django_filters.BooleanFilter()
    is_premium = django_filters.BooleanFilter()

    # Date filtering
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )

    class Meta:
        model = TrailerMeta
        fields = [
            "video_number",
            "creators",
            "upload_status",
            "is_featured",
            "is_premium",
            "price_min",
            "price_max",
            "length_min",
            "length_max",
            "search",
            "creator",
            "status",
            "created_after",
            "created_before",
        ]

    def filter_price_min(self, queryset, name, value):
        """Filter by minimum price"""
        filtered_ids = []
        for trailer in queryset:
            if trailer.get_price_numeric() >= value:
                filtered_ids.append(trailer.id)
        return queryset.filter(id__in=filtered_ids)

    def filter_price_max(self, queryset, name, value):
        """Filter by maximum price"""
        filtered_ids = []
        for trailer in queryset:
            if trailer.get_price_numeric() <= value:
                filtered_ids.append(trailer.id)
        return queryset.filter(id__in=filtered_ids)

    def filter_length_min(self, queryset, name, value):
        """Filter by minimum duration in minutes"""
        filtered_ids = []
        for trailer in queryset:
            if trailer.get_duration_minutes() >= value:
                filtered_ids.append(trailer.id)
        return queryset.filter(id__in=filtered_ids)

    def filter_length_max(self, queryset, name, value):
        """Filter by maximum duration in minutes"""
        filtered_ids = []
        for trailer in queryset:
            if trailer.get_duration_minutes() <= value:
                filtered_ids.append(trailer.id)
        return queryset.filter(id__in=filtered_ids)

    def filter_search(self, queryset, name, value):
        """Search across title, description, creators, and tags"""
        return queryset.filter(
            Q(media__title__icontains=value)
            | Q(media__description__icontains=value)
            | Q(detailed_description__icontains=value)
            | Q(creators__icontains=value)
            | Q(tags__icontains=value)
        )

class TrailerMetaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TrailerMeta API with full CRUD operations
    """

    queryset = TrailerMeta.objects.select_related("media").all()
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TrailerMetaFilter
    ordering_fields = [
        "created_at",
        "updated_at",
        "video_number",
        "media__title",
    ]
    ordering = ["-created_at"]  # Default ordering

    # Lookup by cf_video_uid instead of pk for frontend compatibility
    lookup_field = "cf_video_uid"
    lookup_url_kwarg = "cf_video_uid"

    def get_permissions(self):
        """
        Different permissions for different actions
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]  # Public read access
        else:
            permission_classes = [IsAuthenticated]  # Auth required for write

        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """
        Different serializers for different actions
        """
        if self.action == "list":
            return TrailerListSerializer
        elif self.action == "create":
            return TrailerCreateSerializer
        else:
            return TrailerMetaSerializer

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Get featured trailers"""
        featured_trailers = self.get_queryset().filter(is_featured=True)
        page = self.paginate_queryset(featured_trailers)

        if page is not None:
            serializer = TrailerListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = TrailerListSerializer(featured_trailers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def free(self, request):
        """Get free trailers"""
        free_trailers = self.get_queryset().filter(
            Q(price__iexact="FREE") | Q(price__iexact="$0")
        )
        page = self.paginate_queryset(free_trailers)

        if page is not None:
            serializer = TrailerListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = TrailerListSerializer(free_trailers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def premium(self, request):
        """Get premium (paid) trailers"""
        premium_trailers = (
            self.get_queryset()
            .filter(is_premium=True)
            .exclude(Q(price__iexact="FREE") | Q(price__iexact="$0"))
        )
        page = self.paginate_queryset(premium_trailers)

        if page is not None:
            serializer = TrailerListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = TrailerListSerializer(premium_trailers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_creator(self, request):
        """Get trailers by creator"""
        creator = request.query_params.get("name", "")
        if not creator:
            return Response(
                {"error": "Creator name parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        creator_trailers = self.get_queryset().filter(creators__icontains=creator)
        page = self.paginate_queryset(creator_trailers)

        if page is not None:
            serializer = TrailerListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = TrailerListSerializer(creator_trailers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def toggle_featured(self, request, cf_video_uid=None):
        """Toggle featured status of a trailer"""
        trailer = self.get_object()
        trailer.is_featured = not trailer.is_featured
        trailer.save(update_fields=["is_featured"])

        serializer = self.get_serializer(trailer)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get trailer statistics"""
        queryset = self.get_queryset()

        stats = {
            "total_trailers": queryset.count(),
            "featured_trailers": queryset.filter(is_featured=True).count(),
            "premium_trailers": queryset.filter(is_premium=True).count(),
            "free_trailers": queryset.filter(
                Q(price__iexact="FREE") | Q(price__iexact="$0")
            ).count(),
            "completed_uploads": queryset.filter(upload_status="Complete").count(),
            "pending_uploads": queryset.filter(upload_status="Pending").count(),
            "processing_uploads": queryset.filter(upload_status="Processing").count(),
            "unique_creators": queryset.values("creators").distinct().count(),
        }

        return Response(stats)
