from rest_framework import serializers
from .models import PaymentOrder

class PaymentOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentOrder
        fields = ["id", "type", "person", "description", "date", "doc_number", "value", "event"]
