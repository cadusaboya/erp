from django.urls import path, include
from .views import EventViewSet, generate_event_pdf, EventDetailView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    path("view/<int:id>/", EventDetailView.as_view(), name="get_event_details"),
    path("<int:event_id>/pdf/", generate_event_pdf, name="generate_event_pdf"),
]
