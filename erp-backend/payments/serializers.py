from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from .models import Bill, Income, Bank, Payment

# serializers.py
class BillSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.name", read_only=True)
    bank_name = serializers.CharField(source="bank.name", read_only=True)

    class Meta:
        model = Bill
        fields = '__all__'
        read_only_fields = ('user', 'person_name', 'bank_name')

class IncomeSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source="person.name", read_only=True)
    bank_name = serializers.CharField(source="bank.name", read_only=True)

    class Meta:
        model = Income
        fields = '__all__'
        read_only_fields = ('user', 'person_name', 'bank_name')

class PaymentSerializer(serializers.ModelSerializer):
    content_type = serializers.SlugRelatedField(
        slug_field='model',
        queryset=ContentType.objects.filter(model__in=['bill', 'income'])
    )

    class Meta:
        model = Payment
        fields = ['id', 'content_type', 'object_id', 'value', 'bank', 'doc_number', 'date', 'description']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.payable:
            data['person_name'] = instance.payable.person.name
        if instance.bank:
            data['bank_name'] = instance.bank.name

        return data


    def validate(self, attrs):
        content_type = attrs.get('content_type')
        object_id = attrs.get('object_id')

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



