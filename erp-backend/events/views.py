from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status  # type: ignore
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from .models import Event
from .serializers import EventSerializer
from payments.models import Bill, Income, PaymentOrder
from payments.serializers import BillSerializer, IncomeSerializer, PaymentOrderSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_event_pdf(request, event_id):
    event = get_object_or_404(Event, id=event_id, user=request.user)

    expenses = PaymentOrder.objects.filter(event=event, type="Despesa")
    incomes = PaymentOrder.objects.filter(event=event, type="Receita")

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
        """Draws the table headers and event title on a new page."""
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
        y_position -= 15  # Move below the header
        return y_position

    y_position = draw_header(pdf, height)

    def check_page_break(pdf, y_position):
        """Handles page breaks when the y_position reaches the bottom margin."""
        if y_position < 50:  # Bottom margin reached
            pdf.showPage()
            return draw_header(pdf, height)  # Reset position and draw header
        return y_position

    # Expenses Section
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(40, y_position, "Despesas")
    y_position -= 15

    for bill in expenses:
        y_position = check_page_break(pdf, y_position)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(col_positions[0], y_position, str(bill.id))
        pdf.drawString(col_positions[1], y_position, bill.date.strftime("%d/%m/%y"))
        pdf.drawString(col_positions[2], y_position, bill.person)
        pdf.drawString(col_positions[3], y_position, bill.description)
        pdf.drawString(col_positions[4], y_position, bill.doc_number if bill.doc_number else "DN")
        pdf.drawString(col_positions[5], y_position, f"-{bill.value:.2f}")
        y_position -= 15    

    # Total Expenses
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
        pdf.drawString(col_positions[1], y_position, income.date.strftime("%d/%m/%y"))
        pdf.drawString(col_positions[2], y_position, income.person)
        pdf.drawString(col_positions[3], y_position, income.description)
        pdf.drawString(col_positions[4], y_position, income.doc_number if income.doc_number else "DN")
        pdf.drawString(col_positions[5], y_position, f"{income.value:.2f}")
        y_position -= 15

    # Total Incomes
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

    # Footer with page count
    pdf.setFont("Helvetica", 8)
    pdf.drawString(width - 100, 30, "Página 1 de 1")  # Can be modified for actual pagination

    pdf.showPage()
    pdf.save()
    return response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_event_details(request, event_id):
    """
    Retrieve event details along with related financial summaries.
    """
    event = get_object_or_404(Event, id=event_id, user=request.user)
    
    # Serialize the event
    event_data = EventSerializer(event).data

    # Get all incomes (Receitas) from Payment Orders where type="income"
    income_orders = PaymentOrder.objects.filter(event=event, type="Receita")
    incomes_data = PaymentOrderSerializer(income_orders, many=True).data
    total_incomes = sum(order.value for order in income_orders)  

    # Get related payment orders (Ordens de Pagamento)
    expense_orders = PaymentOrder.objects.filter(event=event, type="Despesa")
    expenses_data = PaymentOrderSerializer(expense_orders, many=True).data
    total_expenses = sum(order.value for order in expense_orders)  # Total Despesas

    # Calculate financial summaries
    saldo_evento = total_incomes - total_expenses # Saldo do Evento
    valor_restante_pagar = event.total_value - total_incomes  # Valor restante a pagar

    return Response({
        "event": event_data,
        "bills": expenses_data,
        "incomes": incomes_data,
        "financial_summary": {
            "total_receitas": total_incomes,
            "total_despesas": total_expenses,
            "saldo_evento": saldo_evento,
            "valor_restante_pagar": valor_restante_pagar
        }
    }, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_event(request):
    """
    Create a new event linked to the logged-in user.
    """
    data = request.data.copy()
    data["user"] = request.user.id  # Link event to logged-in user

    serializer = EventSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response({"message": "Evento criado com sucesso", "event": serializer.data}, status=status.HTTP_201_CREATED)
    
    return Response({"message": "Erro ao criar evento", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_event(request, event_id):
    """
    Update an existing client.
    Supports both full (PUT) and partial (PATCH) updates.
    """
    try:
        event = Event.objects.get(id=event_id, user=request.user)
    except Event.DoesNotExist:
        return Response({"message": "Evento não encontrado"}, status=status.HTTP_404_NOT_FOUND)

    serializer = EventSerializer(event, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Evento atualizado com sucesso", "event": serializer.data}, status=status.HTTP_200_OK)
    
    return Response({"message": "Erro ao atualizar evento", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_events(request):
    """
    List events belonging to the logged-in user.
    """
    events = Event.objects.filter(user=request.user)
    serializer = EventSerializer(events, many=True)
    
    return Response({"message": "Eventos recuperados com sucesso", "events": serializer.data}, status=status.HTTP_200_OK)
