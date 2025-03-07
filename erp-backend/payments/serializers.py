from rest_framework import serializers
from .models import PaymentOrder, Bill, Income

class PaymentOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentOrder
        fields = ["id", "type", "person", "description", "date", "doc_number", "value", "event"]

class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = '__all__'

class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = '__all__'

