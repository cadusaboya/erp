from rest_framework import serializers
from .models import Bill, Income
from clients.models import Client, Supplier

# serializers.py
class BillSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.name", read_only=True)

    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ('user', 'person_name')

class IncomeSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.name", read_only=True)

    class Meta:
        model = Income
        fields = '__all__'
        read_only_fields = ('user', 'person_name')



