from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, status, viewsets  # type: ignore
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from django.shortcuts import get_object_or_404
from accounts.utils import get_company_or_404 
from django.http import HttpResponse
from django.db.models import Sum
from .models import Event
from .serializers import EventSerializer
from payments.models import Bill, Income, EventAllocation
from events.utils.pdffunctions import truncate_text
from payments.serializers import BillSerializer, IncomeSerializer
from collections import defaultdict
from decimal import Decimal
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

import locale
try:
    locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
except:
    locale.setlocale(locale.LC_ALL, '')  # fallback para Windows

def format_currency(value: Decimal) -> str:
    return locale.currency(value, grouping=True)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_events_summary_report(request):
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")
    user = request.user

    events = Event.objects.filter(user=user)

    if date_min:
        events = events.filter(date__gte=date_min)
    if date_max:
        events = events.filter(date__lte=date_max)

    events = events.order_by("date")

    event_data = []
    for event in events:
        # Contract value
        contract_value = event.total_value or Decimal('0.00')

        # Allocated value
        allocations = EventAllocation.objects.filter(
            event=event,
            accrual__in=Income.objects.filter(user=user)
        )
        allocated_value = allocations.aggregate(total=Sum('value'))['total'] or Decimal('0.00')

        # Paid value
        incomes = Income.objects.filter(user=user, event_allocations__event=event).distinct()
        total_paid = Decimal('0.00')
        for income in incomes:
            for payment in income.payments.all():
                total_paid += Decimal(payment.get_allocated_value_to_event(event.id))

        event_data.append({
            "name": event.event_name,
            "date": event.date,
            "client": event.client.name if event.client else "-",
            "contract_value": contract_value,
            "allocated_value": allocated_value,
            "paid_value": total_paid
        })

    # PDF generation
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=resumo_eventos.pdf"
    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    margin = 40

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, height - 40, "Arquitetura de Eventos")
    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(width / 2, height - 60, "Resumo de Eventos")

    pdf.setFont("Helvetica", 9)
    periodo_text = f"Período {date_min or '--'} a {date_max or '--'}"
    pdf.drawString(margin, height - 90, periodo_text)

    # Column positions
    col_date = margin
    col_client = margin + 55
    col_event = margin + 250
    col_contract = margin + 550
    col_allocated = margin + 650
    col_paid = margin + 750

    y = height - 120
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(col_date, y, "Data")
    pdf.drawString(col_client, y, "Cliente")
    pdf.drawString(col_event, y, "Evento")
    pdf.drawRightString(col_contract, y, "Contratado")
    pdf.drawRightString(col_allocated, y, "Alocado")
    pdf.drawRightString(col_paid, y, "Pago")
    y -= 5
    pdf.line(margin, y, width - margin, y)
    y -= 15

    totals = {"contract": Decimal('0.00'), "allocated": Decimal('0.00'), "paid": Decimal('0.00')}
    pdf.setFont("Helvetica", 9)

    for event in event_data:
        if y < 60:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica-Bold", 9)
            pdf.drawString(col_date, y, "Data")
            pdf.drawString(col_client, y, "Cliente")
            pdf.drawString(col_event, y, "Evento")
            pdf.drawRightString(col_contract, y, "Contratado")
            pdf.drawRightString(col_allocated, y, "Alocado")
            pdf.drawRightString(col_paid, y, "Pago")
            y -= 5
            pdf.line(margin, y, width - margin, y)
            y -= 15
            pdf.setFont("Helvetica", 9)

        pdf.drawString(col_date, y, event["date"].strftime("%d/%m/%Y"))
        pdf.drawString(col_client, y, truncate_text(event["client"], 30))
        pdf.drawString(col_event, y, truncate_text(event["name"], 30))
        pdf.drawRightString(col_contract, y, f"R$ {event['contract_value']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        pdf.drawRightString(col_allocated, y, f"R$ {event['allocated_value']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        pdf.drawRightString(col_paid, y, f"R$ {event['paid_value']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

        totals["contract"] += event["contract_value"]
        totals["allocated"] += event["allocated_value"]
        totals["paid"] += event["paid_value"]
        y -= 20

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(col_event, y, "Total")
    pdf.drawRightString(col_contract, y, f"R$ {totals['contract']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    pdf.drawRightString(col_allocated, y, f"R$ {totals['allocated']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
    pdf.drawRightString(col_paid, y, f"R$ {totals['paid']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()

    return response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_event_type_monthly_report(request):
    year = request.query_params.get("year")
    if not year:
        return Response({"error": "Year parameter is required."}, status=400)

    try:
        year = int(year)
    except ValueError:
        return Response({"error": "Year must be an integer."}, status=400)

    user = request.user
    event_type_labels = dict(Event.EVENT_TYPES)
    data = defaultdict(lambda: defaultdict(lambda: Decimal("0.00")))

    for db_value, label in Event.EVENT_TYPES:
        data[label]["total"] = Decimal("0.00")
        for m in range(1, 13):
            data[label][m] = Decimal("0.00")

    events = Event.objects.filter(user=user, date__year=year)

    for event in events:
        event_type_label = event.get_type_display() if event.type else "Sem Tipo"
        month = event.date.month
        value = event.total_value or Decimal("0.00")
        data[event_type_label][month] += value
        data[event_type_label]["total"] += value

    # PDF setup
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=relatorio_completo_contas.pdf"

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    margin = 40
    x_start = margin
    col_width = (width - 2 * margin) / 8  # 8 colunas: Tipo, Total, 6 meses
    y_start = height - 100
    row_height = 22

    # Define meses
    first_half = ["jan", "fev", "mar", "abr", "mai", "jun"]
    second_half = ["jul", "ago", "set", "out", "nov", "dez"]

    # --- Cabeçalho ---
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawCentredString(width / 2, height - 40, "Relatório de Receita Mensal por Tipo de Evento")
    pdf.setFont("Helvetica", 10)
    pdf.drawCentredString(width / 2, height - 60, f"Ano: {year}")

    # --- Cabeçalho da tabela ---
    y = y_start
    pdf.setFont("Helvetica-Bold", 9)

    headers = ["Tipo de Evento", "Total"] + first_half
    for i, col in enumerate(headers):
        pdf.setFillColor(colors.lightgrey)
        pdf.rect(x_start + i * col_width, y, col_width, row_height, fill=True, stroke=False)
        pdf.setFillColor(colors.black)
        pdf.drawString(x_start + i * col_width + 4, y + 6, col)
    y -= row_height

    # Table rows
    pdf.setFont("Helvetica", 8)
    total_geral_first = [Decimal("0.00")] * 6
    total_geral_second = [Decimal("0.00")] * 6
    total_global = Decimal("0.00")

    for idx, (_, event_type) in enumerate(Event.EVENT_TYPES):
        months = data[event_type]

        # Alternância de cor
        if idx % 2 == 0:
            pdf.setFillColor(colors.whitesmoke)
            pdf.rect(x_start, y, col_width * 8, row_height * 2, fill=True, stroke=False)
        pdf.setFillColor(colors.black)

        # Primeira linha: Tipo, Total, Jan-Jun
        x = x_start
        pdf.drawString(x + 4, y + row_height + 6, event_type[:18])
        x += col_width

        pdf.drawRightString(x + col_width - 4, y + row_height + 6, format_currency(months['total']))
        total_global += months["total"]

        for i in range(6):  # Janeiro a Junho
            x += col_width
            value = months.get(i + 1, Decimal("0.00"))
            if value > 0:
                pdf.drawRightString(x + col_width - 4, y + row_height + 6, format_currency(value))
            else:
                pdf.setFillGray(0.6)
                pdf.drawRightString(x + col_width - 4, y + row_height + 6, "-")
                pdf.setFillGray(0)
            total_geral_first[i] += value

        # Segunda linha: vazio, vazio, Jul-Dez
        x = x_start + col_width * 2
        for i in range(6, 12):
            value = months.get(i + 1, Decimal("0.00"))
            if value > 0:
                pdf.drawRightString(x + col_width - 4, y + 6, format_currency(value))
            else:
                pdf.setFillGray(0.6)
                pdf.drawRightString(x + col_width - 4, y + 6, "-")
                pdf.setFillGray(0)
            total_geral_second[i - 6] += value
            x += col_width

        y -= row_height * 2
        if y < 60:
            pdf.showPage()
            y = height - 60
            pdf.setFont("Helvetica", 8)

    # TOTAL GERAL
    pdf.setFont("Helvetica-Bold", 9)
    pdf.setFillColor(colors.lightgrey)
    pdf.rect(x_start, y, col_width * 8, row_height * 2, fill=True, stroke=False)
    pdf.setFillColor(colors.black)

    x = x_start
    pdf.drawString(x + 4, y + row_height + 6, "TOTAL GERAL")
    x += col_width
    pdf.drawRightString(x + col_width - 4, y + row_height + 6, format_currency(total_global))

    for i in range(6):
        x += col_width
        pdf.drawRightString(x + col_width - 4, y + row_height + 6, format_currency(total_geral_first[i]))

    x = x_start + col_width * 2
    for i in range(6):
        pdf.drawRightString(x + col_width - 4, y + 6, format_currency(total_geral_second[i]))
        x += col_width

    # Footer
    pdf.setFont("Helvetica", 7)
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
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company = get_company_or_404(self.request)
        queryset = Event.objects.filter(company=company)
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
            queryset = queryset.filter(event_name__icontains=event_name)
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

        return queryset.order_by("date")

    def perform_create(self, serializer):
        # Associate the new supplier with the authenticated user
        serializer.save(user=self.request.user)
