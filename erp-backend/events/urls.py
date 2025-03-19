from django.urls import path, include
from .views import EventViewSet, EventDetailView, generate_event_pdf
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    path('view/<int:id>/', EventDetailView.as_view(), name='event-detail'),
    path('<int:event_id>/pdf/', generate_event_pdf, name='generate_event_pdf'),
]
