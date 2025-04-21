from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from .models import Bill, Income, Bank, Payment, CostCenter, EventAllocation

class EventAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventAllocation
        fields = ['event', 'value']

class BillSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.name", read_only=True)
    bank_name = serializers.CharField(source="bank.name", read_only=True)
    remaining_value = serializers.SerializerMethodField()
    event_allocations = EventAllocationSerializer(many=True, required=False)

    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ('user', 'person_name', 'bank_name')

    def get_remaining_value(self, obj):
        if obj.status != "parcial":
            return None
        total_paid = sum(p.value for p in obj.payments.all())
        return obj.value - total_paid

    def create(self, validated_data):
        event_allocations_data = validated_data.pop('event_allocations', [])
        bill = super().create(validated_data)
        for allocation in event_allocations_data:
            EventAllocation.objects.create(accrual=bill, **allocation)
        return bill

    def update(self, instance, validated_data):
        event_allocations_data = validated_data.pop('event_allocations', [])
        instance = super().update(instance, validated_data)
        instance.event_allocations.all().delete()
        for allocation in event_allocations_data:
            EventAllocation.objects.create(accrual=instance, **allocation)
        return instance

class IncomeSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.name", read_only=True)
    bank_name = serializers.CharField(source="bank.name", read_only=True)
    remaining_value = serializers.SerializerMethodField()
    event_allocations = EventAllocationSerializer(many=True, required=False)

    class Meta:
        model = Income
        fields = '__all__'
        read_only_fields = ('user', 'person_name', 'bank_name')

    def get_remaining_value(self, obj):
        if obj.status != "parcial":
            return None
        total_paid = sum(p.value for p in obj.payments.all())
        return obj.value - total_paid

    def create(self, validated_data):
        event_allocations_data = validated_data.pop('event_allocations', [])
        income = super().create(validated_data)
        for allocation in event_allocations_data:
            EventAllocation.objects.create(accrual=income, **allocation)
        return income

    def update(self, instance, validated_data):
        event_allocations_data = validated_data.pop('event_allocations', [])
        instance = super().update(instance, validated_data)
        instance.event_allocations.all().delete()
        for allocation in event_allocations_data:
            EventAllocation.objects.create(accrual=instance, **allocation)
        return instance

class PaymentSerializer(serializers.ModelSerializer):
    content_type = serializers.SlugRelatedField(
        slug_field='model',
        queryset=ContentType.objects.filter(model__in=['bill', 'income'])
    )

    class Meta:
        model = Payment
        fields = ['id', 'content_type', 'object_id', 'value', 'bank', 'doc_number', 'date']

    def to_representation(self, instance):
        data = super().to_representation(instance)

        if instance.payable:
            data['person_name'] = instance.payable.person.name
            data['description'] = instance.payable.description

        if instance.bank:
            data['bank_name'] = instance.bank.name

        return data

    def validate(self, attrs):
        content_type = attrs.get('content_type') or getattr(self.instance, 'content_type', None)
        object_id = attrs.get('object_id') or getattr(self.instance, 'object_id', None)

        if not content_type or not object_id:
            raise serializers.ValidationError("É necessário informar 'content_type' e 'object_id'.")

        ModelClass = content_type.model_class()

        try:
            ModelClass.objects.get(pk=object_id)
        except ObjectDoesNotExist:
            raise serializers.ValidationError({
                "object_id": f"O ID {object_id} não corresponde a um {content_type.model} existente."
            })

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
