from django.urls import path
from .views import create_event, list_events

urlpatterns = [
    path("", list_events, name="list-events"),
    path("create/", create_event, name="create-event"),
]
