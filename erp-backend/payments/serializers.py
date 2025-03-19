from rest_framework import serializers
from .models import Entry, Bill, Income
from clients.models import Client, Supplier

class EntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entry
        fields = '__all__'
        read_only_fields = ('user',)

# serializers.py
class BillSerializer(serializers.ModelSerializer):
    person = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ('user', 'person')

class IncomeSerializer(serializers.ModelSerializer):
    person = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = Income
        fields = '__all__'
        read_only_fields = ('user', 'person')



