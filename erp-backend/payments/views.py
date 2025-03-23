from rest_framework import status, viewsets  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from django.db import transaction # type: ignore
from django.db.models import Q # type: ignore
from .models import Bill, Income, Bank
from .serializers import BillSerializer, IncomeSerializer, BankSerializer

class BillViewSet(viewsets.ModelViewSet):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Bill.objects.filter(user=user)
        params = self.request.query_params

        # Filters
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        status = params.getlist("status")  # ["pago", "vencido", "em aberto"]
        description = params.get("description")
        person_name = params.get("person")
        doc_number = params.get("doc_number")
        
        # Apply filters dynamically
        if start_date:
            queryset = queryset.filter(date_due__gte=start_date)
        if end_date:
            queryset = queryset.filter(date_due__lte=end_date)
        if status:
            queryset = queryset.filter(status__in=status)
        if description:
            queryset = queryset.filter(description__icontains=description)
        if person_name:
            queryset = queryset.filter(person__name__icontains=person_name)
        if doc_number:
            queryset = queryset.filter(doc_number=doc_number)
        
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

    def get_queryset(self):
        user = self.request.user
        queryset = Income.objects.filter(user=user)
        params = self.request.query_params

        # Filters
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        status = params.getlist("status")  # ["pago", "vencido", "em aberto"]
        description = params.get("description")
        person_name = params.get("person")
        doc_number = params.get("doc_number")
        
        # Apply filters dynamically
        if start_date:
            queryset = queryset.filter(date_due__gte=start_date)
        if end_date:
            queryset = queryset.filter(date_due__lte=end_date)
        if status:
            queryset = queryset.filter(status__in=status)
        if description:
            queryset = queryset.filter(description__icontains=description)
        if person_name:
            queryset = queryset.filter(person__name__icontains=person_name)
        if doc_number:
            queryset = queryset.filter(doc_number=doc_number)
        
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
    user = request.user

    # Filters from query params
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")
    person = request.GET.get("person")
    description = request.GET.get("description")
    min_value = request.GET.get("min_value")
    max_value = request.GET.get("max_value")
    bank_names = request.GET.getlist("bank_name")
    types = request.GET.getlist("type")  # e.g. ?type=Despesa&type=Receita

    # Base filters
    filters = Q(user=user, status="pago")

    # Apply queryset filters
    if start_date and end_date:
        filters &= Q(date_due__range=[start_date, end_date])
    elif start_date:
        filters &= Q(date_due__gte=start_date)
    elif end_date:
        filters &= Q(date_due__lte=end_date)

    if person:
        filters &= Q(person__name__icontains=person)
    if description:
        filters &= Q(description__icontains=description)
    if min_value and max_value:
        filters &= Q(value__range=[min_value, max_value])
    elif min_value:
        filters &= Q(value__gte=min_value)
    elif max_value:
        filters &= Q(value__lte=max_value)
    if bank_names:
        filters &= Q(bank__name__in=bank_names)

    # Fetch Bills & Incomes separately
    bills = Bill.objects.filter(filters).select_related('person', 'bank')
    incomes = Income.objects.filter(filters).select_related('person', 'bank')

    # Serialize both
    bills_data = BillSerializer(bills, many=True).data
    incomes_data = IncomeSerializer(incomes, many=True).data

    # Add type field inline
    for b in bills_data:
        b["type"] = "Despesa"
    for i in incomes_data:
        i["type"] = "Receita"

    # Combine
    combined = bills_data + incomes_data

    # Python-side filter for "type"
    if types:
        combined = [c for c in combined if c["type"] in types]

    # Sort by due date
    combined.sort(key=lambda x: x["date_due"])

    return Response({"orders": combined})