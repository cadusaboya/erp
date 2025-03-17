from django.urls import path
from .views import create_client, list_clients, update_client

urlpatterns = [
    path("", list_clients, name="list-clients"),
    path("create/", create_client, name="create-client"),
    path("<int:client_id>/update/", update_client, name="update_client"),
]
