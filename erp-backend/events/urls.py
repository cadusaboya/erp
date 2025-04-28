from django.urls import path, include
from .views import EventViewSet, EventDetailView, generate_event_type_monthly_report, generate_events_summary_report
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'', EventViewSet, basename='event')

urlpatterns = [
    path('report/', generate_events_summary_report),
    path('', include(router.urls)),
    path('view/<int:id>/', EventDetailView.as_view(), name='event-detail'),
    path('report/type/', generate_event_type_monthly_report),
]
