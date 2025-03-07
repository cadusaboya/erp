from django.urls import path
from .views import create_client, list_clients

urlpatterns = [
    path("", list_clients, name="list-clients"),
    path("create/", create_client, name="create-client"),
]
