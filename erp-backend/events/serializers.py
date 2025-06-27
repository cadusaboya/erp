from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "event_name",
            "type",
            "client",
            "client_name",
            "date",
            "date_end",
            "total_value",
            "local",
            "fiscal_doc",
        ]

