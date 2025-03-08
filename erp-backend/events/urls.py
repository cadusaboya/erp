from django.urls import path
from .views import create_event, list_events, get_event_details, generate_event_pdf

urlpatterns = [
    path("", list_events, name="list-events"),
    path("<int:event_id>/", get_event_details, name="get_event_details"),
    path("<int:event_id>/pdf/", generate_event_pdf, name="generate_event_pdf"),
    path("create/", create_event, name="create-event"),
]
