from rest_framework import status, filters, viewsets  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from django.db import transaction # type: ignore
from django.db.models import Q # type: ignore
from .models import Bill, Income, Bank, Payment, CostCenter, EventAllocation, ChartAccount
from django.contrib.contenttypes.models import ContentType
from .serializers import BillSerializer, IncomeSerializer, BankSerializer, PaymentSerializer, CostCenterSerializer, ChartAccountSerializer
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from events.utils.pdffunctions import draw_header, draw_rows
from payments.models import Bill, Income
from events.models import Event

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_payments_report(request):
    type_filter = request.query_params.get("type", "both")
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")
    person_id = request.query_params.get("person")
    status = request.query_params.get("status")
    event_id = request.query_params.get("event_id")
    cost_center_id = request.query_params.get("cost_center")

    user = request.user
    event = get_object_or_404(Event, id=event_id, user=user) if event_id else None

    bill_qs = Bill.objects.filter(user=user)
    income_qs = Income.objects.filter(user=user)

    if date_min:
        bill_qs = bill_qs.filter(date_due__gte=date_min)
        income_qs = income_qs.filter(date_due__gte=date_min)
    if date_max:
        bill_qs = bill_qs.filter(date_due__lte=date_max)
        income_qs = income_qs.filter(date_due__lte=date_max)
    if person_id:
        bill_qs = bill_qs.filter(person_id=person_id)
        income_qs = income_qs.filter(person_id=person_id)
    if status:
        if status == "pago":
            bill_qs = bill_qs.filter(status__in=["pago", "parcial"])
            income_qs = income_qs.filter(status__in=["pago", "parcial"])
        elif status == "em aberto":
            bill_qs = bill_qs.filter(status__in=["em aberto", "parcial"])
            income_qs = income_qs.filter(status__in=["em aberto", "parcial"])
    if event:
        bill_qs = bill_qs.filter(event_allocations__event_id=event.id).distinct()
        income_qs = income_qs.filter(event_allocations__event_id=event.id).distinct()
    if cost_center_id:
        bill_qs = bill_qs.filter(cost_center_id=cost_center_id)
        income_qs = income_qs.filter(cost_center_id=cost_center_id)

    def get_rows_from_queryset(qs, is_bill):
        rows = []
        for item in qs:
            if event:
                allocation = item.event_allocations.filter(event_id=event.id).first()
                if not allocation:
                    continue
                original_value = allocation.value

                # Ratio between allocation and full item
                ratio = allocation.value / item.value if item.value else 0
                total_paid = sum(p.value for p in item.payments.all()) * ratio
            else:
                original_value = item.value
                total_paid = sum(p.value for p in item.payments.all()) if hasattr(item, "payments") else 0

            # Decide what value to show
            if status in ["pago"]:
                value = round(min(total_paid, original_value), 2)
            elif status in ["em aberto"]:
                value = round(original_value - total_paid, 2)
            else:
                value = round(original_value, 2)
                
            # Decide what value to show
            if status in ["em aberto"]:
                value = round(original_value - total_paid, 2)


            # Skip if total_paid == 0 and filtering for "pago"
            if status in ["pago"] and total_paid == 0:
                continue

            rows.append({
                "id": item.id,
                "date": item.date_due,
                "person": item.person.name,
                "description": item.description,
                "doc_number": item.doc_number or "DN",
                "value": value,
                "is_bill": is_bill,
            })
        return rows



    bills = get_rows_from_queryset(bill_qs, True) if type_filter in ["both", "bills"] else []
    incomes = get_rows_from_queryset(income_qs, False) if type_filter in ["both", "incomes"] else []

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "attachment; filename=relatorio_completo_contas.pdf"

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    cols = [50, width * 0.15, width * 0.3, width * 0.5, width * 0.75, width * 0.9]

    event_name = event.event_name if event else "Todos os Eventos"

    # Title depending on type
    if type_filter == "bills":
        title = "Relatório de Despesas"
    elif type_filter == "incomes":
        title = "Relatório de Receitas"
    else:
        title = "Lançamentos Contábeis"

    y = draw_header(pdf, width, height, event_name, event.id if event else "Geral", title)

    if bills:
        y, _ = draw_rows(pdf, bills, y, width, height, "Despesas", cols, "Todos os Eventos", "Geral", title, is_income=False, total_label="Total Despesas")
    if incomes:
        y, _ = draw_rows(pdf, incomes, y, width, height, "Receitas", cols, "Todos os Eventos", "Geral", title, is_income=True, total_label="Total Receitas")

    if event and status == "pago":
        total_despesas = sum(b["value"] for b in bills)
        total_receitas = sum(i["value"] for i in incomes)
        saldo_evento = total_receitas - total_despesas
        saldo_restante = event.total_value - total_receitas

        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(cols[4], y, "Saldo do Evento")
        pdf.drawString(cols[5], y, f"{saldo_evento:.2f}")
        y -= 15
        pdf.drawString(cols[4], y, "Restante a Receber")
        pdf.drawString(cols[5], y, f"{saldo_restante:.2f}")

    pdf.setFont("Helvetica", 8)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()
    return response

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

class ChartAccountViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ChartAccountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'description']

    def get_queryset(self):
        return ChartAccount.objects.all()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def event_accruals_view(request, event_id):
    event_id = int(event_id)
    user = request.user

    payments_bills = []
    payments_incomes = []

    total_despesas = 0
    total_receitas = 0

    # Buscar contas com rateio para esse evento
    bills = Bill.objects.filter(user=user, event_allocations__event_id=event_id).distinct()
    incomes = Income.objects.filter(user=user, event_allocations__event_id=event_id).distinct()

    for bill in bills:
        bill_total = bill.value
        allocation = bill.event_allocations.filter(event_id=event_id).first()
        if not allocation:
            continue

        ratio = allocation.value / bill_total if bill_total else 0

        for payment in bill.payments.all():
            valor = round(payment.value * ratio, 2)
            total_despesas += valor
            payments_bills.append({
                "id": payment.id,
                "date": payment.date,
                "description": bill.description,
                "value": valor,
            })

    for income in incomes:
        income_total = income.value
        allocation = income.event_allocations.filter(event_id=event_id).first()
        if not allocation:
            continue

        ratio = allocation.value / income_total if income_total else 0

        for payment in income.payments.all():
            valor = round(payment.value * ratio, 2)
            total_receitas += valor
            payments_incomes.append({
                "id": payment.id,
                "date": payment.date,
                "description": income.description,
                "value": valor,
            })

    return Response({
        "payments_bills": payments_bills,
        "payments_incomes": payments_incomes,
        "total_despesas": round(total_despesas, 2),
        "total_receitas": round(total_receitas, 2),
        "saldo_evento": round(total_receitas - total_despesas, 2)
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