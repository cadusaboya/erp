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
from reportlab.lib import colors
from events.utils.pdffunctions import draw_header, draw_rows, check_page_break, truncate_text
from events.models import Event
from datetime import datetime
from collections import defaultdict
from functools import reduce
from decimal import Decimal, ROUND_HALF_UP
import logging
from rest_framework.pagination import PageNumberPagination

def safe_decimal(value):
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

import locale
try:
    locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
except:
    locale.setlocale(locale.LC_ALL, '')

def format_currency(value: Decimal) -> str:
    return locale.currency(value, grouping=True)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_bank_statement_report(request):
    from django.utils import timezone

    def shorten_text(text, max_width, canvas, font_name="Helvetica", font_size=9):
        canvas.setFont(font_name, font_size)
        original_text = text
        while canvas.stringWidth(text) > max_width and len(text) > 0:
            text = text[:-1]
        if len(text) < len(original_text):
            return text.strip() + "..."
        return text

    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")
    bank_id = request.query_params.get("bank_id")
    user = request.user

    payments = Payment.objects.filter(user=user)

    if date_min:
        payments = payments.filter(date__gte=date_min)
    if date_max:
        payments = payments.filter(date__lte=date_max)
    if bank_id:
        payments = payments.filter(bank_id=bank_id)

    payments = payments.select_related('bank', 'bill__person', 'income__person').order_by("date", "id")  # Mais antigos primeiro

    if bank_id:
        bank = Bank.objects.get(id=bank_id, user=user)
        initial_balance = bank.balance
        bank_name = bank.name
    else:
        initial_balance = sum(bank.balance for bank in Bank.objects.filter(user=user))
        bank_name = "Consolidado"

    # Retroagir saldo para o início do período
    balance = initial_balance
    for p in reversed(list(payments)):
        if p.bill:
            balance += p.value
        elif p.income:
            balance -= p.value

    # Montar extrato
    balance_moving = balance
    lines = []
    for p in payments:
        if p.bill:
            tipo = "Despesa"
            favorecido = p.bill.person.name if p.bill.person else "-"
            descricao = p.bill.description
            balance_moving -= p.value
            value_display = -p.value  # Negativo
        elif p.income:
            tipo = "Receita"
            favorecido = p.income.person.name if p.income.person else "-"
            descricao = p.income.description
            balance_moving += p.value
            value_display = p.value  # Positivo
        else:
            continue

        lines.append({
            "date": p.date,
            "favorecido": favorecido,
            "descricao": descricao,
            "value": value_display,
            "balance": balance_moving
        })

    # Definir data do saldo
    if date_max:
        saldo_date = timezone.datetime.strptime(date_max, "%Y-%m-%d").date()
    else:
        saldo_date = timezone.now().date()

    # Criar PDF
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=relatorio_completo_contas.pdf"

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    margin = 30

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, height - 40, "Arquitetura de Eventos")

    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(width / 2, height - 60, f"Extrato Bancário - {bank_name}")

    pdf.setFont("Helvetica", 9)
    periodo_text = f"Período: {date_min or '--'} a {date_max or '--'}"
    pdf.drawString(margin, height - 90, periodo_text)

    saldo_text = f"Saldo Atual: R$ {initial_balance:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    data_saldo_text = f"Data do Saldo: {saldo_date.strftime('%d/%m/%Y')}"
    pdf.drawString(margin, height - 110, saldo_text)
    pdf.drawString(margin, height - 125, data_saldo_text)

    # Cabeçalho
    y = height - 155
    pdf.setFont("Helvetica-Bold", 9)

    col_date = margin
    col_fav = margin + 60
    col_desc = margin + 180
    col_value = width - margin - 90
    col_balance = width - margin

    pdf.drawString(col_date, y, "Data")
    pdf.drawString(col_fav, y, "Favorecido")
    pdf.drawString(col_desc, y, "Descrição")
    pdf.drawRightString(col_value, y, "Valor")
    pdf.drawRightString(col_balance, y, "Saldo")
    y -= 5

    pdf.line(margin, y, width - margin, y)
    y -= 15

    pdf.setFont("Helvetica", 9)

    for line in lines:
        if y < 60:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 9)

            # Reescrever cabeçalho
            pdf.setFont("Helvetica-Bold", 9)
            pdf.drawString(col_date, y, "Data")
            pdf.drawString(col_fav, y, "Favorecido")
            pdf.drawString(col_desc, y, "Descrição")
            pdf.drawRightString(col_value, y, "Valor")
            pdf.drawRightString(col_balance, y, "Saldo")
            y -= 5
            pdf.line(margin, y, width - margin, y)
            y -= 15
            pdf.setFont("Helvetica", 9)

        pdf.drawString(col_date, y, line["date"].strftime("%d/%m/%Y"))
        pdf.drawString(col_fav, y, truncate_text(line["favorecido"], 18))   # ✅ added truncate
        pdf.drawString(col_desc, y, truncate_text(line["descricao"], 37))
        pdf.drawRightString(col_value, y, f"{'-' if line['value'] < 0 else ''}R$ {abs(line['value']):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        pdf.drawRightString(col_balance, y, f"R$ {line['balance']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

        y -= 20

    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()

    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_chart_account_balance(request):
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")
    user = request.user

    # Filtrar pagamentos
    payments = Payment.objects.filter(user=user)

    if date_min:
        payments = payments.filter(date__gte=date_min)
    if date_max:
        payments = payments.filter(date__lte=date_max)

    # Só considerar pagamentos relacionados a bills ou incomes que têm alocação
    payments = payments.filter(
        Q(bill__isnull=False) | Q(income__isnull=False)
    )

    # Mapeamento ChartAccount -> valor pago proporcional
    chartaccount_totals = defaultdict(Decimal)

    for payment in payments:
        accrual = payment.payable
        if not accrual:
            continue

        original_value = accrual.value or Decimal("0.00")
        if original_value == 0:
            continue  # evita divisão por zero

        # Razão proporcional de pagamento sobre o valor total
        payment_ratio = payment.value / original_value

        for allocation in accrual.allocations.all():
            proportional_paid = allocation.value * payment_ratio
            chartaccount_totals[allocation.chart_account_id] += proportional_paid

    # Buscar contas usadas + parents
    chart_accounts = ChartAccount.objects.all().select_related("parent")

    account_map = {acc.id: acc for acc in chart_accounts}
    parent_children = defaultdict(list)

    for acc in chart_accounts:
        if acc.parent_id:
            parent_children[acc.parent_id].append(acc.id)

    # Somar valores recursivamente
    totals_with_children = {}

    def sum_children(account_id):
        total = chartaccount_totals.get(account_id, Decimal("0.00"))
        for child_id in parent_children.get(account_id, []):
            total += sum_children(child_id)
        totals_with_children[account_id] = total
        return total

    for acc_id in account_map:
        if account_map[acc_id].parent_id is None:
            sum_children(acc_id)

    # Iniciar PDF
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=relatorio_completo_contas.pdf"

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    margin = 40

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, height - 50, "Arquitetura de Eventos")

    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(width / 2, height - 70, "Balancete por Plano de Contas")

    pdf.setFont("Helvetica", 9)
    periodo_text = f"Período {date_min or '--'} a {date_max or '--'}"
    pdf.drawString(margin, height - 100, periodo_text)

    # Cabeçalho
    y = height - 130
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(margin, y, "Conta")
    pdf.drawString(margin + 80, y, "Descrição")
    pdf.drawRightString(width - margin, y, "Valor")
    y -= 5

    # Linha horizontal abaixo do cabeçalho
    pdf.line(margin, y, width - margin, y)
    y -= 15

    total_receitas = Decimal("0.00")
    total_despesas = Decimal("0.00")

    # Função para desenhar
    def draw_account(account_id, indent=0):
        nonlocal y
        acc = account_map.get(account_id)
        if not acc:
            return

        total = totals_with_children.get(account_id, Decimal("0.00"))
        if total == 0:
            return

        font_size = 9
        if indent == 0:
            pdf.setFont("Helvetica-Bold", font_size)
        else:
            pdf.setFont("Helvetica", font_size)

        pdf.drawString(margin + indent * 20, y, acc.code)
        pdf.drawString(margin + 80 + indent * 20, y, acc.description.upper() if indent == 0 else acc.description)
        pdf.drawRightString(width - margin, y, f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

        if indent == 0:
            if acc.code.startswith("1"):
                nonlocal total_receitas
                total_receitas += total
            elif acc.code.startswith("2"):
                nonlocal total_despesas
                total_despesas += total

        y -= 15

        if y < 60:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 9)

        for child_id in parent_children.get(account_id, []):
            draw_account(child_id, indent + 1)

    # Imprimir contas raiz
    drawn = set()
    for acc_id, acc in account_map.items():
        if acc.parent_id is None and acc_id not in drawn:
            draw_account(acc_id)
            drawn.add(acc_id)

    # Resultado
    resultado = total_receitas - total_despesas

    y -= 20
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(margin, y, "Resultado")
    pdf.drawRightString(width - margin, y, f"R$ {resultado:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()

    return response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_cost_center_consolidated_report(request):
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")
    status = request.query_params.get("status", "todos")
    type_filter = request.query_params.get("type")

    if type_filter not in ["bills", "incomes"]:
        return Response({"error": "É necessário especificar 'type=bills' ou 'type=incomes'."}, status=400)

    user = request.user

    # Filtrar pagamentos
    payments = Payment.objects.filter(user=user)

    if date_min:
        payments = payments.filter(date__gte=date_min)
    if date_max:
        payments = payments.filter(date__lte=date_max)

    if type_filter == "bills":
        payments = payments.filter(bill__isnull=False)
    else:
        payments = payments.filter(income__isnull=False)

    # Preparar o total consolidado
    cost_center_totals = defaultdict(lambda: Decimal("0.00"))

    for payment in payments:
        accrual = payment.payable  # Bill ou Income
        if not accrual:
            continue

        # Pega o centro de custo
        label = accrual.cost_center.name if accrual.cost_center else "#Sem Centro"

        # Decide quanto somar
        if status == "pago":
            if accrual.status in ["pago", "parcial"]:
                cost_center_totals[label] += payment.value
        elif status == "em_aberto":
            if accrual.status in ["em aberto", "parcial"]:
                cost_center_totals[label] += payment.value
        else:  # todos
            cost_center_totals[label] += payment.value

    # Ordenar por valor decrescente
    sorted_totals = sorted(cost_center_totals.items(), key=lambda x: x[1], reverse=True)

    # PDF
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=relatorio_completo_contas.pdf"

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    margin = 40

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, height - 50, "Arquitetura de Eventos")

    pdf.setFont("Helvetica", 12)
    titles = {
        "bills": {
            "pago": "Pagamentos de Despesas por Centro de Custo",
            "em_aberto": "Pagamentos de Contas a Pagar por Centro de Custo",
            "todos": "Pagamentos de Despesas por Centro de Custo",
        },
        "incomes": {
            "pago": "Recebimentos de Receitas por Centro de Custo",
            "em_aberto": "Recebimentos de Contas a Receber por Centro de Custo",
            "todos": "Recebimentos de Receitas por Centro de Custo",
        }
    }
    titulo = titles.get(type_filter, {}).get(status, "Relatório por Centro de Custo")
    pdf.drawCentredString(width / 2, height - 70, titulo)

    pdf.setFont("Helvetica", 9)
    periodo_text = f"Período {date_min or '--'} a {date_max or '--'}"
    pdf.drawString(margin, height - 100, periodo_text)

    y = height - 130
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(margin, y, "Centro de Custo")
    pdf.drawRightString(width - margin, y, "Valor")
    y -= 20

    total_geral = Decimal("0.00")
    pdf.setFont("Helvetica", 9)

    for idx, (cost_center_name, total) in enumerate(sorted_totals):
        if idx % 2 == 0:
            pdf.setFillColor(colors.whitesmoke)
            pdf.rect(margin, y - 4, width - 2 * margin, 18, fill=True, stroke=False)
            pdf.setFillColor(colors.black)

        pdf.drawString(margin, y, cost_center_name)
        pdf.drawRightString(width - margin, y, f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        total_geral += total
        y -= 20

        if y < 60:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 9)

    # Linha Total
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(margin, y, "Total")
    pdf.drawRightString(width - margin, y, f"R$ {total_geral:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

    # Footer
    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()

    return response


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

    bills = []
    incomes = []

    if status == "pago":
        payments = Payment.objects.filter(
            user=user,
        ).select_related('bill', 'income', 'bill__person', 'income__person').prefetch_related('bill__event_allocations', 'income__event_allocations')

        if date_min:
            payments = payments.filter(date__gte=date_min)
        if date_max:
            payments = payments.filter(date__lte=date_max)
        if person_id:
            payments = payments.filter(
                Q(bill__person_id=person_id) | Q(income__person_id=person_id)
            )
        if event_id:
            payments = payments.filter(
                Q(bill__event_allocations__event_id=event_id) |
                Q(income__event_allocations__event_id=event_id)
            )
        if cost_center_id:
            payments = payments.filter(
                Q(bill__cost_center_id=cost_center_id) |
                Q(income__cost_center_id=cost_center_id)
            )

        for p in payments:
            accrual = p.payable  # Bill or Income

            # Find event allocation for the selected event
            if event:
                allocation = accrual.event_allocations.filter(event_id=event.id).first()
                if allocation:
                    ratio = allocation.value / accrual.value if accrual.value else 0
                    adjusted_value = round(p.value * ratio, 2)
                else:
                    continue  # this payment has no allocation to the event, skip
            else:
                adjusted_value = round(p.value, 2)

            if p.bill and type_filter in ["both", "bills"]:
                bills.append({
                    "id": p.id,
                    "date": p.date,
                    "person": accrual.person.name if accrual.person else "-",
                    "description": p.description,
                    "doc_number": p.doc_number or "DN",
                    "value": adjusted_value,
                })
            elif p.income and type_filter in ["both", "incomes"]:
                incomes.append({
                    "id": p.id,
                    "date": p.date,
                    "person": accrual.person.name if accrual.person else "-",
                    "description": p.description,
                    "doc_number": p.doc_number or "DN",
                    "value": adjusted_value,
                })

    else:
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
        if status == "em aberto":
            bill_qs = bill_qs.filter(status__in=["em aberto", "parcial"])
            income_qs = income_qs.filter(status__in=["em aberto", "parcial"])
        if event_id:
            bill_qs = bill_qs.filter(event_allocations__event_id=event_id).distinct()
            income_qs = income_qs.filter(event_allocations__event_id=event_id).distinct()
        if cost_center_id:
            bill_qs = bill_qs.filter(cost_center_id=cost_center_id)
            income_qs = income_qs.filter(cost_center_id=cost_center_id)

        def get_rows(qs):
            rows = []
            for item in qs:
                if event:
                    allocation = item.event_allocations.filter(event_id=event.id).first()
                    if not allocation:
                        continue
                    original_value = allocation.value
                    ratio = allocation.value / item.value if item.value else 0
                    total_paid = sum(p.value for p in item.payments.all()) * ratio
                else:
                    original_value = item.value
                    total_paid = sum(p.value for p in item.payments.all()) if hasattr(item, "payments") else 0

                if status == "em aberto":
                    value = round(original_value - total_paid, 2)
                else:
                    value = round(original_value, 2)

                if status == "em aberto" and value <= 0:
                    continue

                rows.append({
                    "id": item.id,
                    "date": item.date_due,
                    "person": item.person.name if item.person else "-",
                    "description": item.description,
                    "doc_number": item.doc_number or "DN",
                    "value": value,
                })
            return rows

        if type_filter in ["both", "bills"]:
            bills = get_rows(bill_qs)
        if type_filter in ["both", "incomes"]:
            incomes = get_rows(income_qs)

    # ------------------------- PDF ---------------------------------

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=relatorio_completo_contas.pdf"

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    cols = [50, width * 0.12, width * 0.2, width * 0.45, width * 0.8, width * 0.9]

    event_name = event.event_name if event else "Todos os Eventos"

    if status == "pago":
        title = {
            "bills": "Pagamentos Efetuados",
            "incomes": "Pagamentos Recebidos",
            "both": "Pagamentos Efetuados e Recebidos"
        }.get(type_filter, "Pagamentos Efetuados e Recebidos")
    elif status == "em aberto":
        title = {
            "bills": "Contas a Pagar",
            "incomes": "Contas a Receber",
            "both": "Contas a Pagar e Receber"
        }.get(type_filter, "Contas a Pagar e Receber")
    else:
        title = {
            "bills": "Despesas",
            "incomes": "Receitas"
        }.get(type_filter, "Lançamentos Contábeis")
        
    y = draw_header(pdf, width, height, event_name, event.id if event else "Geral", title)

    def draw_table(pdf, items, label, y):
        if not items:
            return y, Decimal("0.00")

        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(cols[0], y, label)
        y -= 20

        total = Decimal("0.00")
        pdf.setFont("Helvetica", 8)

        for row in items:
            y = check_page_break(pdf, y, height, width, event_name, event_id, title)
            pdf.setFont("Helvetica", 9)
            pdf.drawString(cols[0], y, str(row["id"]))
            pdf.drawString(cols[1], y, row["date"].strftime("%d/%m/%y"))
            pdf.drawString(cols[2], y, truncate_text(row["person"], 35))
            pdf.drawString(cols[3], y, truncate_text(row["description"], 52))
            pdf.drawString(cols[4], y, row["doc_number"])
            pdf.drawString(cols[5], y, f"R$ {row['value']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
            total += row["value"]
            y -= 15

        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(cols[4], y, f"Total {label}")
        pdf.drawString(cols[5], y, f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 15
        return y, total

    total_bills = Decimal("0.00")
    total_incomes = Decimal("0.00")

    if bills:
        y, total_bills = draw_table(pdf, bills, "Despesas", y)
    if incomes:
        y, total_incomes = draw_table(pdf, incomes, "Receitas", y)

    # Saldo
    if status == "pago" and event:
        saldo = total_incomes - total_bills
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(cols[4], y, "Saldo do Evento")
        pdf.drawString(cols[5], y, f"R$ {saldo:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 20

    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.save()
    return response


class BillViewSet(viewsets.ModelViewSet):   
    serializer_class = BillSerializer
    pagination_class = StandardResultsSetPagination
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
        
        return queryset.order_by("date_due")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

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
        
        return queryset.order_by("date_due")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    pagination_class = StandardResultsSetPagination
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
        bill_id = params.get("bill_id")
        income_id = params.get("income_id")

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
            qs = qs.filter(
                Q(bill__person__name__icontains=person) |
                Q(income__person__name__icontains=person)
            )

        if type_filter:
            conditions = []
            for t in type_filter:
                if t.lower() == "despesa":
                    conditions.append(Q(bill__isnull=False))
                elif t.lower() == "receita":
                    conditions.append(Q(income__isnull=False))
            if conditions:
                qs = qs.filter(reduce(lambda x, y: x | y, conditions))

        if bill_id:
            qs = qs.filter(bill_id=bill_id)
        if income_id:
            qs = qs.filter(income_id=income_id)

        return qs.order_by("-date")  

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        payment = serializer.save(user=user)

        parent = payment.bill or payment.income
        if not parent:
            raise ValidationError("Pagamento inválido: objeto relacionado não encontrado.")

        if not payment.description and parent.description:
            payment.description = parent.description
            payment.save(update_fields=["description"])

        # Get all existing payments for this bill/income
        if payment.bill:
            existing_payments = Payment.objects.filter(bill=payment.bill)
        elif payment.income:
            existing_payments = Payment.objects.filter(income=payment.income)
        else:
            raise ValidationError("Pagamento inválido: sem bill ou income.")

        total_paid = sum(safe_decimal(p.value) for p in existing_payments)
        parent_value = safe_decimal(parent.value)

        if parent_value == 0:
            parent.status = "pago"
        elif abs(total_paid - parent_value) < Decimal("0.01"):
            parent.status = "pago"
        elif total_paid > 0:
            parent.status = "parcial"
        else:
            parent.status = "em aberto"

        parent.save()

        # Update bank balance
        if payment.bank:
            if payment.bill:
                payment.bank.balance -= payment.value
            elif payment.income:
                payment.bank.balance += payment.value
            payment.bank.save()


    @transaction.atomic
    def perform_update(self, serializer):
        user = self.request.user
        old_instance = self.get_object()
        old_value = old_instance.value
        old_bank = old_instance.bank
        old_bill = old_instance.bill
        old_income = old_instance.income

        # Save updated payment
        payment = serializer.save(user=user)

        parent = payment.bill or payment.income
        if not parent:
            raise ValidationError("Pagamento inválido: objeto relacionado não encontrado.")

        # ✅ If parent exists → auto-fill description + update parent status
        if parent:
            if not payment.description and parent.description:
                payment.description = parent.description
                payment.save(update_fields=["description"])

            # Parent status update (same logic as perform_create)
            if payment.bill:
                existing_payments = Payment.objects.filter(bill=payment.bill)
            elif payment.income:
                existing_payments = Payment.objects.filter(income=payment.income)

            total_paid = sum(safe_decimal(p.value) for p in existing_payments)
            parent_value = safe_decimal(parent.value)

            if parent_value == 0:
                parent.status = "pago"
            elif abs(total_paid - parent_value) < Decimal("0.01"):
                parent.status = "pago"
            elif total_paid > 0:
                parent.status = "parcial"
            else:
                parent.status = "em aberto"

            parent.save()

        # ✅ Always update bank balance
        value_diff = payment.value - old_value

        if old_bank == payment.bank and old_bill == payment.bill and old_income == payment.income:
            # Same bank + same parent (or no parent) → adjust balance
            if payment.bill:
                payment.bank.balance -= value_diff
            elif payment.income:
                payment.bank.balance += value_diff
        else:
            if old_bank:
                if old_bill:
                    old_bank.balance += old_value
                elif old_income:
                    old_bank.balance -= old_value
                old_bank.save()

            if payment.bank:
                if payment.bill:
                    payment.bank.balance -= payment.value
                elif payment.income:
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
    user = request.user
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    event_allocs = EventAllocation.objects.select_related("accrual").filter(event_id=event_id)

    # Group allocations by accrual ID and keep their ratio
    accrual_ratios = {
        alloc.accrual.id: (alloc.value / alloc.accrual.value)
        for alloc in event_allocs if alloc.accrual.value > 0
    }

    # Get all payments related to those accruals
    payments = Payment.objects.filter(user=user).select_related("bill", "income")

    if start_date:
        payments = payments.filter(date__gte=start_date)
    if end_date:
        payments = payments.filter(date__lte=end_date)

    payments_bills = []
    payments_incomes = []
    total_despesas = 0
    total_receitas = 0

    for payment in payments:
        accrual = None

        if payment.bill:
            accrual = payment.bill
        elif payment.income:
            accrual = payment.income

        if not accrual or accrual.id not in accrual_ratios:
            continue

        ratio = accrual_ratios[accrual.id]
        allocated_value = round(payment.value * ratio, 2)

        if payment.bill:
            total_despesas += allocated_value
            payments_bills.append({
                "id": payment.id,
                "date": payment.date,
                "description": accrual.description,
                "value": allocated_value,
            })
        elif payment.income:
            total_receitas += allocated_value
            payments_incomes.append({
                "id": payment.id,
                "date": payment.date,
                "description": accrual.description,
                "value": allocated_value,
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