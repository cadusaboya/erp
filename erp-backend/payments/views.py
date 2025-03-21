from rest_framework import status, viewsets  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from django.db import transaction # type: ignore
from .models import Bill, Income, Bank
from .serializers import BillSerializer, IncomeSerializer, BankSerializer

class BillViewSet(viewsets.ModelViewSet):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Bill.objects.filter(user=self.request.user)

        # Check if ?show_paid=true is in the query params
        show_paid = self.request.query_params.get('show_paid', 'false').lower()

        if show_paid != 'true':
            # By default exclude "pago"
            queryset = queryset.exclude(status='pago')

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        # Save instance
        instance = serializer.save(user=self.request.user)

        # If created as "pago", increase balance immediately
        if instance.status == "pago" and instance.bank:
            instance.bank.balance -= instance.value
            instance.bank.save()

    @transaction.atomic
    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        old_bank = instance.bank
        old_value = instance.value

        # Save new data
        updated_instance = serializer.save(user=self.request.user)

        # If marked as 'pago'
        if updated_instance.status == "pago" and old_status != "pago":
            # Increase bank balance
            updated_instance.bank.balance -= updated_instance.value
            updated_instance.bank.save()

        # If UNDO from 'pago' to another status
        elif old_status == "pago" and updated_instance.status != "pago":
            # Reverse balance
            if old_bank:
                old_bank.balance += old_value
                old_bank.save()

class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]

class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Income.objects.filter(user=self.request.user)

        show_paid = self.request.query_params.get('show_paid', 'false').lower()
        if show_paid != 'true':
            queryset = queryset.exclude(status='pago')

        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        # Save instance
        instance = serializer.save(user=self.request.user)

        # If created as "pago", increase balance immediately
        if instance.status == "pago" and instance.bank:
            instance.bank.balance += instance.value
            instance.bank.save()

    @transaction.atomic
    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        old_bank = instance.bank
        old_value = instance.value

        # Save new data
        updated_instance = serializer.save(user=self.request.user)

        # If marked as 'pago'
        if updated_instance.status == "pago" and old_status != "pago":
            # Increase bank balance
            updated_instance.bank.balance += updated_instance.value
            updated_instance.bank.save()

        # If UNDO from 'pago' to another status
        elif old_status == "pago" and updated_instance.status != "pago":
            # Reverse balance
            if old_bank:
                old_bank.balance -= old_value
                old_bank.save()

class BankViewSet(viewsets.ModelViewSet):
    serializer_class = BankSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure only Bank Accounts associated with the authenticated user are returned
        return Bank.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the new Bank account with the authenticated user
        serializer.save(user=self.request.user)
        
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def combined_extract(request):
    # Fetch paid Bills
    bills = Bill.objects.filter(user=request.user, status="pago").select_related('person', 'bank')
    # Fetch paid Incomes
    incomes = Income.objects.filter(user=request.user, status="pago").select_related('person', 'bank')

    # Serialize both
    bills_data = BillSerializer(bills, many=True).data
    incomes_data = IncomeSerializer(incomes, many=True).data

    # Add "type" field to differentiate
    for b in bills_data:
        b["type"] = "Despesa"
    for i in incomes_data:
        i["type"] = "Receita"

    # Combine and sort by date (optional)
    combined = bills_data + incomes_data
    combined.sort(key=lambda x: x["date_due"])  # Or "date"

    return Response({"orders": combined})