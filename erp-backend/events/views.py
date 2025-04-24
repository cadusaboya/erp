from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, status, viewsets  # type: ignore
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from .models import Event
from .serializers import EventSerializer
from payments.models import Bill, Income
from payments.serializers import BillSerializer, IncomeSerializer
from decimal import Decimal
from events.utils.pdffunctions import (
    get_event_rows,
    draw_header,
    draw_rows,
    check_page_break,
)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_event_pdf(request, event_id):
    event = get_object_or_404(Event, id=event_id, user=request.user)

    payment_bills = get_event_rows(event, Bill, request.user, "payments")
    payment_incomes = get_event_rows(event, Income, request.user, "payments")

    total_despesas = sum(p["value"] for p in payment_bills)
    total_receitas = sum(p["value"] for p in payment_incomes)
    saldo_evento = total_receitas - total_despesas
    saldo_restante = event.total_value - total_receitas

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename=\"evento_{event.id}_report.pdf\"'

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    cols = [50, width * 0.15, width * 0.3, width * 0.5, width * 0.75, width * 0.9]

    y = draw_header(pdf, width, height, event.event_name, event.id, "Contas Pagas e Recebidas")
    y, _ = draw_rows(pdf, payment_bills, y, width, height, "Despesas", cols, event.event_name, event.id, "Contas Pagas", is_income=False, total_label="Total Pago")
    y, _ = draw_rows(pdf, payment_incomes, y, width, height, "Receitas", cols, event.event_name, event.id, "Contas Recebidas", is_income=True, total_label="Total Recebido")

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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_event_accruals_pdf(request, event_id):
    event = get_object_or_404(Event, id=event_id, user=request.user)

    accrual_bills = get_event_rows(event, Bill, request.user, "accruals")
    accrual_incomes = get_event_rows(event, Income, request.user, "accruals")

    total_despesas = sum(b["value"] for b in accrual_bills)
    total_receitas = sum(i["value"] for i in accrual_incomes)
    saldo_evento = total_receitas - total_despesas
    saldo_restante = event.total_value - total_receitas

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename=\"evento_{event.id}_accruals.pdf\"'

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    cols = [50, width * 0.15, width * 0.3, width * 0.5, width * 0.75, width * 0.9]

    y = draw_header(pdf, width, height, event.event_name, event.id, "Lançamentos Contábeis por Evento")
    y, _ = draw_rows(pdf, accrual_bills, y, width, height, "Despesas", cols, event.event_name, event.id, "Lançamentos", is_income=False, total_label="Total Despesas")
    y, _ = draw_rows(pdf, accrual_incomes, y, width, height, "Receitas", cols, event.event_name, event.id, "Lançamentos", is_income=True, total_label="Total Receitas")


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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_event_contas_pdf(request, event_id):
    event = get_object_or_404(Event, id=event_id, user=request.user)

    remaining_bills = get_event_rows(event, Bill, request.user, "remaining")
    remaining_incomes = get_event_rows(event, Income, request.user, "remaining")

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename=\"evento_{event.id}_contas_restantes.pdf\"'

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    cols = [50, width * 0.15, width * 0.3, width * 0.5, width * 0.75, width * 0.9]

    y = draw_header(pdf, width, height, event.event_name, event.id, "Contas a Pagar e Receber")
    y, _ = draw_rows(pdf, remaining_bills, y, width, height, "Contas a Pagar", cols, event.event_name, event.id, "Contas Restantes", is_income=False, total_label="Total a Pagar")
    y, _ = draw_rows(pdf, remaining_incomes, y, width, height, "Contas a Receber", cols, event.event_name, event.id, "Contas Restantes", is_income=True, total_label="Total a Receber")

    pdf.setFont("Helvetica", 8)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()
    return response

class EventDetailView(generics.RetrieveAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def retrieve(self, request, *args, **kwargs):
        event = self.get_object()

        event_data = self.get_serializer(event).data

        # ✅ Fetch paid Incomes linked to the event
        incomes = Income.objects.filter(event=event, user=request.user, status="pago")
        incomes_data = IncomeSerializer(incomes, many=True).data
        total_incomes = sum(income.value for income in incomes)

        # ✅ Fetch paid Bills linked to the event
        bills = Bill.objects.filter(event=event, user=request.user, status="pago")
        bills_data = BillSerializer(bills, many=True).data
        total_bills = sum(bill.value for bill in bills)

        saldo_evento = total_incomes - total_bills
        valor_restante_pagar = event.total_value - total_incomes

        return Response({
            "event": event_data,
            "bills": bills_data,
            "incomes": incomes_data,
            "financial_summary": {
                "total_receitas": total_incomes,
                "total_despesas": total_bills,
                "saldo_evento": saldo_evento,
                "valor_restante_pagar": valor_restante_pagar
            }
        }, status=status.HTTP_200_OK)

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.filter(user=user)
        params = self.request.query_params

        # Filters from query params
        event_name = params.get("event_name")
        client = params.get("client")
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        min_value = params.get("min_value")
        max_value = params.get("max_value")
        event_types = params.getlist("type")  # Example: ?type=casamento&type=formatura

        # Apply filters dynamically
        if event_name:
            queryset = queryset.filter(name__icontains=event_name)
        if client:
            queryset = queryset.filter(client__name__icontains=client)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        if min_value:
            queryset = queryset.filter(value__gte=min_value)
        if max_value:
            queryset = queryset.filter(value__lte=max_value)
        if event_types:
            queryset = queryset.filter(type__in=event_types)

        return queryset

    def perform_create(self, serializer):
        # Associate the new supplier with the authenticated user
        serializer.save(user=self.request.user)
