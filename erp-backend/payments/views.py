from rest_framework import status, viewsets  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from django.db import transaction # type: ignore
from django.db.models import Q # type: ignore
from .models import Bill, Income, Bank, Payment, CostCenter, EventAllocation
from django.contrib.contenttypes.models import ContentType
from .serializers import BillSerializer, IncomeSerializer, BankSerializer, PaymentSerializer, CostCenterSerializer
from django.core.exceptions import ValidationError

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

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

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

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params

        qs = Payment.objects.filter(user=user)

        # Filters
        start_date = params.get("startDate")
        end_date = params.get("endDate")
        min_value = params.get("minValue")
        max_value = params.get("maxValue")
        bank_name = params.getlist("bank_name")
        person = params.get("person")
        type_filter = params.getlist("type")
        content_type_param = params.get("content_type")  # "bill" or "income"
        object_id_param = params.get("object_id")

        if content_type_param and object_id_param:
            target_ct = ContentType.objects.get(model=content_type_param)
            qs = qs.filter(content_type=target_ct, object_id=object_id_param)

        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
        if min_value:
            qs = qs.filter(value__gte=min_value)
        if max_value:
            qs = qs.filter(value__lte=max_value)
        if bank_name:
            qs = qs.filter(bank__name__in=bank_name)

        if person:
            qs = qs.filter(person__name__icontains=person)

        if type_filter:
            type_map = {"Despesa": "bill", "Receita": "income"}
            content_type_names = [type_map[t] for t in type_filter]
            qs = qs.filter(content_type__model__in=content_type_names)

        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        payment = serializer.save(user=user)

        parent = payment.payable
        if not parent:
            raise ValidationError("Pagamento inválido: objeto relacionado não encontrado.")

        # Get all existing payments for this bill/income
        existing_payments = Payment.objects.filter(
            content_type=payment.content_type,
            object_id=payment.object_id
        )

        total_paid = sum(p.value for p in existing_payments)

        if total_paid > parent.value:
            raise ValidationError("Total pago excede o valor da conta/receita. Pagamento não registrado.")

        elif total_paid == parent.value:
            parent.status = "pago"
            parent.save()

        elif total_paid > 0:
            parent.status = "parcial"
            parent.save()

        # Update bank balance (subtract if Bill, add if Income)
        if payment.bank:
            if payment.content_type.model == "bill":
                payment.bank.balance -= payment.value
            elif payment.content_type.model == "income":
                payment.bank.balance += payment.value
            payment.bank.save()

    @transaction.atomic
    def perform_update(self, serializer):
        user = self.request.user
        old_instance = self.get_object()
        old_value = old_instance.value
        old_bank = old_instance.bank
        old_content_type = old_instance.content_type.model

        payment = serializer.save(user=user)
        parent = payment.payable

        if not parent:
            raise ValidationError("Pagamento inválido: objeto relacionado não encontrado.")

        # Recalculate total paid after the update
        existing_payments = Payment.objects.filter(
            content_type=payment.content_type,
            object_id=payment.object_id
        )

        total_paid = sum(p.value for p in existing_payments)

        if total_paid > parent.value:
            raise ValidationError("Total pago excede o valor da conta/receita. Pagamento não atualizado.")

        elif total_paid == parent.value:
            parent.status = "pago"
            parent.save()

        elif total_paid > 0:
            parent.status = "parcial"
            parent.save()
        else:
            parent.status = "em aberto"
            parent.save()

        # Adjust bank balance (consider value difference and model type)
        if payment.bank:
            value_diff = payment.value - old_value

            if old_bank == payment.bank and old_content_type == payment.content_type.model:
                # Same bank & type, adjust difference
                if payment.content_type.model == "bill":
                    payment.bank.balance -= value_diff
                elif payment.content_type.model == "income":
                    payment.bank.balance += value_diff

            else:
                # Revert old bank
                if old_bank:
                    if old_content_type == "bill":
                        old_bank.balance += old_value
                    elif old_content_type == "income":
                        old_bank.balance -= old_value
                    old_bank.save()

                # Apply to new bank
                if payment.content_type.model == "bill":
                    payment.bank.balance -= payment.value
                elif payment.content_type.model == "income":
                    payment.bank.balance += payment.value

            payment.bank.save()

class BankViewSet(viewsets.ModelViewSet):
    serializer_class = BankSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure only Bank Accounts associated with the authenticated user are returned
        return Bank.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the new Bank account with the authenticated user
        serializer.save(user=self.request.user)

class CostCenterViewSet(viewsets.ModelViewSet):
    serializer_class = CostCenterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure only Bank Accounts associated with the authenticated user are returned
        return CostCenter.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the new Bank account with the authenticated user
        serializer.save(user=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def event_accruals_view(request, event_id):
    # Get all allocations for the event
    allocation_ids = EventAllocation.objects.filter(event_id=event_id).values_list('accrual_id', flat=True)

    # Separate Bills and Incomes
    bills = Bill.objects.filter(id__in=allocation_ids, user=request.user)
    incomes = Income.objects.filter(id__in=allocation_ids, user=request.user)

    return Response({
        "bills": BillSerializer(bills, many=True).data,
        "incomes": IncomeSerializer(incomes, many=True).data
    })
        
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