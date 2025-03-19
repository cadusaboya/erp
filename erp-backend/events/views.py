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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_event_pdf(request, event_id):
    event = get_object_or_404(Event, id=event_id, user=request.user)

    expenses = Bill.objects.filter(event=event, status="pago")
    incomes = Income.objects.filter(event=event, status="pago")

    total_receitas = sum(order.value for order in incomes)
    total_despesas = sum(bill.value for bill in expenses)
    saldo_evento = total_receitas - total_despesas
    saldo_restante = event.total_value - total_receitas

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="evento_{event.id}_report.pdf"'

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    pdf.setFont("Helvetica-Bold", 12)

    col_positions = [
        50, width * 0.15, width * 0.3, width * 0.5, width * 0.75, width * 0.9
    ]

    def draw_header(pdf, y_position):
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(width * 0.06, height - 40, "Arquitetura de Eventos")
        pdf.setFont("Helvetica", 10)
        pdf.drawString(width * 0.06, height - 60, "Contas Pagas e Recebidas por Evento")
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(50, height - 110, f"{event.id} - {event.event_name}")

        # Table header
        pdf.setFont("Helvetica-Bold", 9)
        y_position = height - 140
        pdf.drawString(col_positions[0], y_position, "Nro.")
        pdf.drawString(col_positions[1], y_position, "Data")
        pdf.drawString(col_positions[2], y_position, "Favorecido")
        pdf.drawString(col_positions[3], y_position, "Memo")
        pdf.drawString(col_positions[4], y_position, "Doc.")
        pdf.drawString(col_positions[5], y_position, "Valor")
        y_position -= 5
        pdf.line(width * 0.05, y_position, width * 0.95, y_position)
        y_position -= 15
        return y_position

    y_position = draw_header(pdf, height)

    def check_page_break(pdf, y_position):
        if y_position < 50:
            pdf.showPage()
            return draw_header(pdf, height)
        return y_position

    # Expenses Section
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(40, y_position, "Despesas")
    y_position -= 15

    for bill in expenses:
        y_position = check_page_break(pdf, y_position)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(col_positions[0], y_position, str(bill.id))
        pdf.drawString(col_positions[1], y_position, bill.date_due.strftime("%d/%m/%y"))
        pdf.drawString(col_positions[2], y_position, bill.person.name)
        pdf.drawString(col_positions[3], y_position, bill.description)
        pdf.drawString(col_positions[4], y_position, bill.doc_number or "DN")
        pdf.drawString(col_positions[5], y_position, f"-{bill.value:.2f}")
        y_position -= 15

    y_position = check_page_break(pdf, y_position - 2)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(col_positions[4], y_position, "Total Despesas")
    pdf.drawString(col_positions[5], y_position, f"-{total_despesas:.2f}")
    y_position -= 25

    # Incomes Section
    y_position = check_page_break(pdf, y_position)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(40, y_position, "Receitas")
    y_position -= 15

    for income in incomes:
        y_position = check_page_break(pdf, y_position)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(col_positions[0], y_position, str(income.id))
        pdf.drawString(col_positions[1], y_position, income.date_due.strftime("%d/%m/%y"))
        pdf.drawString(col_positions[2], y_position, income.person.name)
        pdf.drawString(col_positions[3], y_position, income.description)
        pdf.drawString(col_positions[4], y_position, income.doc_number or "DN")
        pdf.drawString(col_positions[5], y_position, f"{income.value:.2f}")
        y_position -= 15

    y_position = check_page_break(pdf, y_position - 2)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(col_positions[4], y_position, "Total Receitas")
    pdf.drawString(col_positions[5], y_position, f"{total_receitas:.2f}")
    y_position -= 25

    # Event Balance
    y_position = check_page_break(pdf, y_position)
    pdf.drawString(col_positions[4], y_position, "Saldo do Evento")
    pdf.drawString(col_positions[5], y_position, f"{saldo_evento:.2f}")
    y_position -= 15

    y_position = check_page_break(pdf, y_position)
    pdf.drawString(col_positions[4], y_position, "Restante a receber")
    pdf.drawString(col_positions[5], y_position, f"{saldo_restante:.2f}")

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
        # Ensure only suppliers associated with the authenticated user are returned
        return Event.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the new supplier with the authenticated user
        serializer.save(user=self.request.user)
