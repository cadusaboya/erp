from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id", "type", "client", "date", "total_value", "payment_form"]    