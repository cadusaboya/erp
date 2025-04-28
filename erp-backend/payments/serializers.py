from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from .models import Bill, Income, Bank, Payment, CostCenter, EventAllocation, AccountAllocation, ChartAccount

class EventAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventAllocation
        fields = ['event', 'value']

class AccountAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountAllocation
        fields = ['chart_account', 'value']

class ChartAccountSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = ChartAccount
        fields = ['id', 'code', 'description', 'parent', 'children']

    def get_children(self, obj):
        return ChartAccountSerializer(obj.children.all(), many=True).data

class BillSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.name", read_only=True)
    bank_name = serializers.CharField(source="bank.name", read_only=True)
    remaining_value = serializers.SerializerMethodField()

    # Apenas para escrita
    event_allocations = EventAllocationSerializer(many=True, required=False, write_only=True)
    account_allocations = AccountAllocationSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ('user', 'person_name', 'bank_name')

    def get_remaining_value(self, obj):
        if obj.status != "parcial":
            return None
        total_paid = sum(p.value for p in obj.payments.all())
        return obj.value - total_paid

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # ✅ Reinsere os rateios no retorno final
        data["event_allocations"] = EventAllocationSerializer(instance.event_allocations.all(), many=True).data
        data["account_allocations"] = AccountAllocationSerializer(instance.allocations.all(), many=True).data
        return data

    def create(self, validated_data):
        event_allocations_data = validated_data.pop('event_allocations', [])
        account_allocations_data = validated_data.pop('account_allocations', [])

        bill = super().create(validated_data)

        for allocation in event_allocations_data:
            EventAllocation.objects.create(accrual=bill, **allocation)
        for allocation in account_allocations_data:
            AccountAllocation.objects.create(accrual=bill, **allocation)

        return bill

    def update(self, instance, validated_data):
        event_allocations_data = validated_data.pop('event_allocations', [])
        account_allocations_data = validated_data.pop('account_allocations', [])

        instance = super().update(instance, validated_data)

        instance.event_allocations.all().delete()
        for allocation in event_allocations_data:
            EventAllocation.objects.create(accrual=instance, **allocation)

        instance.allocations.all().delete()
        for allocation in account_allocations_data:
            AccountAllocation.objects.create(accrual=instance, **allocation)

        return instance

class IncomeSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.name", read_only=True)
    bank_name = serializers.CharField(source="bank.name", read_only=True)
    remaining_value = serializers.SerializerMethodField()

    # Writable via create/update
    event_allocations = EventAllocationSerializer(many=True, required=False, write_only=True)
    account_allocations = AccountAllocationSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Income
        fields = '__all__'
        read_only_fields = ('user', 'person_name', 'bank_name')

    def get_remaining_value(self, obj):
        if obj.status != "parcial":
            return None
        total_paid = sum(p.value for p in obj.payments.all())
        return obj.value - total_paid

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # 👇 Here we re-add the allocations in the final response
        data["event_allocations"] = EventAllocationSerializer(instance.event_allocations.all(), many=True).data
        data["account_allocations"] = AccountAllocationSerializer(instance.allocations.all(), many=True).data
        return data

    def create(self, validated_data):
        event_allocations_data = validated_data.pop('event_allocations', [])
        account_allocations_data = validated_data.pop('account_allocations', [])

        income = super().create(validated_data)

        for allocation in event_allocations_data:
            EventAllocation.objects.create(accrual=income, **allocation)
        for allocation in account_allocations_data:
            AccountAllocation.objects.create(accrual=income, **allocation)

        return income

    def update(self, instance, validated_data):
        event_allocations_data = validated_data.pop('event_allocations', [])
        account_allocations_data = validated_data.pop('account_allocations', [])

        instance = super().update(instance, validated_data)

        instance.event_allocations.all().delete()
        for allocation in event_allocations_data:
            EventAllocation.objects.create(accrual=instance, **allocation)

        instance.allocations.all().delete()
        for allocation in account_allocations_data:
            AccountAllocation.objects.create(accrual=instance, **allocation)

        return instance



class PaymentSerializer(serializers.ModelSerializer):
    bill_id = serializers.PrimaryKeyRelatedField(
        queryset=Bill.objects.all(),
        required=False,
        allow_null=True
    )
    income_id = serializers.PrimaryKeyRelatedField(
        queryset=Income.objects.all(),
        required=False,
        allow_null=True
    )
    bank_name = serializers.CharField(source="bank.name", read_only=True)
    person_name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ['id', 'bill_id', 'income_id', 'value', 'bank', 'bank_name', 'doc_number', 'date', 'person_name', 'description']

    def get_person_name(self, obj):
        if obj.payable and obj.payable.person:
            return obj.payable.person.name
        return None

    def get_description(self, obj):
        if obj.payable:
            return obj.payable.description
        return None

    def validate(self, attrs):
        bill = attrs.get('bill') or getattr(self.instance, 'bill', None)
        income = attrs.get('income') or getattr(self.instance, 'income', None)

        if not bill and not income:
            raise serializers.ValidationError("É necessário informar 'bill' ou 'income'.")

        if bill and income:
            raise serializers.ValidationError("Não é permitido preencher 'bill' e 'income' ao mesmo tempo.")

        return attrs


class BankSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bank
        fields = '__all__'
        read_only_fields = ('user',)

class CostCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostCenter
        fields = '__all__'
        read_only_fields = ('user',)
