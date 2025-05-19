from rest_framework import status, filters, viewsets  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from django.db import transaction, models # type: ignore
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
from reportlab.lib.colors import red, blue, black
from events.utils.pdffunctions import draw_header, draw_rows, check_page_break, truncate_text
from accounts.utils import get_company_or_404
from events.models import Event
from datetime import datetime
from collections import defaultdict
from functools import reduce
from decimal import Decimal, ROUND_HALF_UP
import logging
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status as drf_status

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
    page_size = 10
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

    company = get_company_or_404(request)

    # 🔵 1. Obter saldo atual do banco
    if bank_id:
        bank = Bank.objects.get(id=bank_id)
        saldo_atual = bank.balance
        bank_name = bank.name
    else:
        saldo_atual = sum(bank.balance for bank in Bank.objects.all())
        bank_name = "Consolidado"

    # 🔵 2. Obter todos os pagamentos de date_min até hoje
    today = timezone.now().date()
    payments_range = Payment.objects.filter(date__gte=date_min, date__lte=today)
    if bank_id:
        payments_range = payments_range.filter(bank_id=bank_id)

    payments_range = payments_range.select_related('bill__person', 'income__person').order_by('-date', '-id')  # do mais recente ao mais antigo

    saldo = saldo_atual
    for p in payments_range:
        if p.bill:
            saldo += p.value  # desfaz o pagamento
        elif p.income:
            saldo -= p.value  # desfaz o recebimento

    saldo_inicial = saldo

    # 🔵 3. Filtrar apenas os pagamentos do período solicitado (para mostrar no extrato)
    payments = Payment.objects.filter(date__gte=date_min)
    if date_max:
        payments = payments.filter(date__lte=date_max)
    if bank_id:
        payments = payments.filter(bank_id=bank_id)

    payments = payments.select_related('bill__person', 'income__person').order_by("date", "id")

    # 🔵 4. Montar extrato
    balance_moving = saldo_inicial
    lines = []
    for p in payments:
        if p.bill:
            favorecido = p.bill.person.name if p.bill.person else "-"
            descricao = p.bill.description
            balance_moving -= p.value
            value_display = -p.value
        elif p.income:
            favorecido = p.income.person.name if p.income.person else "-"
            descricao = p.income.description
            balance_moving += p.value
            value_display = p.value
        else:
            continue

        lines.append({
            "date": p.date,
            "favorecido": favorecido,
            "descricao": descricao,
            "value": value_display,
            "balance": balance_moving
        })

    # 🔵 5. Gerar PDF
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=extrato_bancario.pdf"

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    margin = 30

    col_date = margin
    col_fav = margin + 60
    col_desc = margin + 180
    col_value = width - margin - 90
    col_balance = width - margin

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, height - 40, "Arquitetura de Eventos")

    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(width / 2, height - 60, f"Extrato Bancário - {bank_name}")

    pdf.setFont("Helvetica", 9)
    periodo_text = f"Período: {date_min or '--'} a {date_max or '--'}"
    pdf.drawString(margin, height - 90, periodo_text)

    data_saldo_text = f"Data do Saldo: {date_min}"
    saldo_text = f"Saldo Inicial: R$ {saldo_inicial:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    pdf.drawRightString(col_balance, height - 125, data_saldo_text)
    pdf.drawRightString(col_balance, height - 110, saldo_text)
    

    y = height - 155
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

    for line in lines:
        if y < 60:
            pdf.showPage()
            y = height - 50
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
        pdf.drawString(col_fav, y, shorten_text(line["favorecido"], 100, pdf))
        pdf.drawString(col_desc, y, shorten_text(line["descricao"], 180, pdf))
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
def generate_chartaccount_summary_report(request):
    from django.utils import timezone

    code = request.query_params.get("code")
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")

    user = request.user
    company = get_company_or_404(request)

    if not code:
        return Response({"error": "chart_account_code is required"}, status=400)

    # 1. Buscar conta base e suas descendentes
    root = get_object_or_404(ChartAccount, code=code)
    accounts = ChartAccount.objects.select_related("parent")

    descendants = []

    def collect_descendants(acc_id):
        children = [a for a in accounts if a.parent_id == acc_id]
        for c in children:
            descendants.append(c.id)
            collect_descendants(c.id)

    collect_descendants(root.id)
    all_ids = [root.id] + descendants

    # 2. Filtrar pagamentos alocados a essas contas
    payments = Payment.objects.filter(company=company).order_by("date")
    if date_min:
        payments = payments.filter(date__gte=date_min)
    if date_max:
        payments = payments.filter(date__lte=date_max)

    payments = payments.select_related("bill__person", "income__person").prefetch_related("bill__allocations", "income__allocations")
    results = []

    for p in payments:
        accrual = p.payable
        if not accrual:
            continue

        allocations = accrual.allocations.filter(chart_account_id__in=all_ids)
        for allocation in allocations:
            ratio = allocation.value / accrual.value if accrual.value else 0
            paid_value = round(p.value * ratio, 2)

            results.append({
                "date": p.date,
                "type": "Despesa" if p.bill else "Receita",
                "person": accrual.person.name if accrual.person else "-",
                "description": accrual.description,
                "doc_number": p.doc_number or "DN",
                "value": paid_value,
            })

    # 3. Gerar PDF
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f"inline; filename=relatorio_resumo_plano_{code}.pdf"

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    margin = 40

    # X positions
    cols = [
        margin,
        margin + 100,
        margin + 290,
        width - 200,
        width - margin - 70
    ]

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, height - 50, "Arquitetura de Eventos")
    pdf.setFont("Helvetica", 12)
    pdf.drawCentredString(width / 2, height - 70, f"Resumo Plano de Conta - {root.code} - {root.description}")
    pdf.setFont("Helvetica", 9)
    periodo_text = f"Período {date_min or '--'} a {date_max or '--'}"
    pdf.drawString(margin, height - 100, periodo_text)

    # Cabeçalho
    y = height - 130
    def draw_header():
        nonlocal y
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(cols[0], y, "Data")
        pdf.drawString(cols[1], y, "Pessoa")
        pdf.drawString(cols[2], y, "Descrição")
        pdf.drawString(cols[3], y, "Doc.")
        pdf.drawString(cols[4], y, "Valor")
        y -= 5
        pdf.line(margin, y, width - margin, y)
        y -= 15

    draw_header()

    total = Decimal("0.00")
    pdf.setFont("Helvetica", 9)

    for row in results:
        if y < 60:
            pdf.showPage()
            y = height - 50
            draw_header()
            pdf.setFont("Helvetica", 9)

        pdf.drawString(cols[0], y, row["date"].strftime("%d/%m/%Y"))
        pdf.drawString(cols[1], y, truncate_text(row["person"], 30))
        pdf.drawString(cols[2], y, truncate_text(row["description"], 45))
        pdf.drawString(cols[3], y, row["doc_number"])
        pdf.drawString(cols[4], y, f"R$ {row['value']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

        total += row["value"]
        y -= 15

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(cols[3], y - 10, "Total")
    pdf.drawString(cols[4], y - 10, f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

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

    company = get_company_or_404(request)
    payments = Payment.objects.filter(company=company)

    if date_min:
        payments = payments.filter(date__gte=date_min)
    if date_max:
        payments = payments.filter(date__lte=date_max)

    payments = payments.filter(Q(bill__isnull=False) | Q(income__isnull=False))

    chartaccount_totals = defaultdict(Decimal)
    receitas_payments = []

    for payment in payments:
        accrual = payment.payable
        if not accrual:
            continue

        original_value = accrual.value or Decimal("0.00")
        if original_value == 0:
            continue

        payment_ratio = payment.value / original_value

        for allocation in accrual.allocations.all():
            proportional_paid = allocation.value * payment_ratio
            chartaccount_totals[allocation.chart_account_id] += proportional_paid

    chart_accounts = ChartAccount.objects.all().select_related("parent")
    account_map = {acc.id: acc for acc in chart_accounts}
    parent_children = defaultdict(list)
    for acc in chart_accounts:
        if acc.parent_id:
            parent_children[acc.parent_id].append(acc.id)

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

    y = height - 130
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(margin, y, "Conta")
    pdf.drawString(margin + 80, y, "Descrição")
    pdf.drawRightString(width - margin, y, "Valor")
    y -= 5
    pdf.line(margin, y, width - margin, y)
    y -= 15

    total_receitas = Decimal("0.00")
    total_despesas = Decimal("0.00")

    def draw_account(account_id, indent=0):
        nonlocal y
        acc = account_map.get(account_id)
        if not acc:
            return
        total = totals_with_children.get(account_id, Decimal("0.00"))
        if total == 0:
            return

        font_size = 9
        pdf.setFont("Helvetica-Bold" if indent == 0 else "Helvetica", font_size)
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

    root_accounts = [acc for acc in account_map.values() if not acc.parent_id]
    root_accounts.sort(
        key=lambda acc: (
            str(acc.code or "")[0] not in ("1", "2"),
            str(acc.code or "")[0],
            str(acc.code or "")
        )
    )

    for acc in root_accounts:
        draw_account(acc.id)

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
    company = get_company_or_404(request)
    payments = Payment.objects.filter(company=company)


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
    status = request.query_params.get("status")
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")
    person_id = request.query_params.get("person")
    event_id = request.query_params.get("event_id")
    cost_center_id = request.query_params.get("cost_center")

    user = request.user
    company = get_company_or_404(request)
    event = get_object_or_404(Event, id=event_id) if event_id else None

    def get_open_accruals():
        bill_qs = Bill.objects.order_by("date_due")
        income_qs = Income.objects.order_by("date_due")
        if date_min:
            bill_qs = bill_qs.filter(date_due__gte=date_min)
            income_qs = income_qs.filter(date_due__gte=date_min)
        if date_max:
            bill_qs = bill_qs.filter(date_due__lte=date_max)
            income_qs = income_qs.filter(date_due__lte=date_max)
        if person_id:
            bill_qs = bill_qs.filter(person_id=person_id)
            income_qs = income_qs.filter(person_id=person_id)
        if cost_center_id:
            bill_qs = bill_qs.filter(cost_center_id=cost_center_id)
            income_qs = income_qs.filter(cost_center_id=cost_center_id)
        if event_id:
            bill_qs = bill_qs.filter(event_allocations__event_id=event_id).distinct()
            income_qs = income_qs.filter(event_allocations__event_id=event_id).distinct()

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
                    total_paid = sum(p.value for p in item.payments.all())
                value = round(original_value - total_paid, 2)
                if value <= 0:
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

        return get_rows(bill_qs), get_rows(income_qs)

    def get_paid_payments():
        payments = Payment.objects.order_by("date")
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

        bills, incomes = [], []
        for p in payments.select_related('bill', 'income', 'bill__person', 'income__person').prefetch_related('bill__event_allocations', 'income__event_allocations'):
            accrual = p.payable
            if event:
                allocation = accrual.event_allocations.filter(event_id=event.id).first()
                if allocation:
                    ratio = allocation.value / accrual.value if accrual.value else 0
                    adjusted_value = round(p.value * ratio, 2)
                else:
                    continue
            else:
                adjusted_value = round(p.value, 2)
            row = {
                "id": p.id,
                "date": p.date,
                "person": accrual.person.name if accrual.person else "-",
                "description": p.description,
                "doc_number": p.doc_number or "DN",
                "value": adjusted_value,
            }
            if p.bill:
                bills.append(row)
            elif p.income:
                incomes.append(row)
        return bills, incomes

    # --- Data
    bills_open, incomes_open, bills_paid, incomes_received = [], [], [], []
    if not status or status == "em aberto":
        bills_open, incomes_open = get_open_accruals()
    if not status or status == "pago":
        bills_paid, incomes_received = get_paid_payments()

    # --- PDF
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
        }.get(type_filter, "Lançamentos")

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
        pdf.drawString(cols[4], y, f"Total")
        pdf.drawString(cols[5], y, f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 20
        return y, total

    total_bills = total_incomes = total_paid = total_received = Decimal("0.00")

    if type_filter in ["incomes", "both"]:
        if incomes_open:
            y, total_incomes = draw_table(pdf, incomes_open, "Contas a Receber", y)
        if incomes_received:
            y, total_received = draw_table(pdf, incomes_received, "Contas Recebidas", y)
    if type_filter in ["bills", "both"]:
        if bills_open:
            y, total_bills = draw_table(pdf, bills_open, "Contas a Pagar", y)
        if bills_paid:
            y, total_paid = draw_table(pdf, bills_paid, "Contas Pagas", y)


    if event and type_filter == "both":
        total_receitas = total_received + total_incomes
        total_despesas = total_paid + total_bills
        saldo = total_receitas - total_despesas

        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(cols[4], y, "Total Receitas")
        pdf.drawString(cols[5], y, f"R$ {total_receitas:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 15

        pdf.drawString(cols[4], y, "Total Despesas")
        pdf.drawString(cols[5], y, f"R$ {total_despesas:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 15

        pdf.drawString(cols[4], y, "Saldo do Evento")
        pdf.drawString(cols[5], y, f"R$ {saldo:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 20

    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()
    return response


class BillViewSet(viewsets.ModelViewSet):   
    serializer_class = BillSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company = get_company_or_404(self.request)
        queryset = Bill.objects.filter(company=company)
        params = self.request.query_params

        # Filters
        id = params.get("id")
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        status = params.getlist("status")  # ["pago", "vencido", "em aberto"]
        description = params.get("description")
        person_name = params.get("person")
        doc_number = params.get("doc_number")
        
        # Apply filters dynamically
        if id:
            queryset = queryset.filter(id=id)
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
        company = get_company_or_404(self.request)
        serializer.save(user=self.request.user, company=company)

    def perform_update(self, serializer):
        company = get_company_or_404(self.request)
        serializer.save(user=self.request.user, company=company)

class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        company = get_company_or_404(self.request)
        queryset = Income.objects.filter(company=company)
        params = self.request.query_params

        # Filters
        id = params.get("id")
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        status = params.getlist("status")  # ["pago", "vencido", "em aberto"]
        description = params.get("description")
        person_name = params.get("person")
        doc_number = params.get("doc_number")
        
        # Apply filters dynamically
        if id:
            queryset = queryset.filter(id = id)
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
        company = get_company_or_404(self.request)
        serializer.save(user=self.request.user, company=company)

    def perform_update(self, serializer):
        company = get_company_or_404(self.request)
        serializer.save(user=self.request.user, company=company)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        company = get_company_or_404(self.request)
        params = self.request.query_params

        qs = Payment.objects.filter(company=company)  # sempre começa assim

        if self.action == "list":
            status_list = params.getlist("status")
            if status_list:
                qs = qs.filter(status__in=status_list)
            else:
                qs = qs.filter(status="pago")

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
        id = params.get("id")

        if id:
            qs = qs.filter(id = id)
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
        company = get_company_or_404(self.request)

        payment = serializer.save(user=user, company=company)

        parent = payment.bill or payment.income
        if not parent:
            raise ValidationError("Pagamento inválido: objeto relacionado não encontrado.")

        if not payment.description and parent.description:
            payment.description = parent.description
            payment.save(update_fields=["description"])

        # Se o pagamento está apenas agendado, não atualiza saldo nem status
        if payment.status == "agendado":
            parent.status = "agendado"
            parent.save()
            return

        # Get all existing payments efetivados
        if payment.bill:
            existing_payments = Payment.objects.filter(bill=payment.bill, company=company, status="pago")
        elif payment.income:
            existing_payments = Payment.objects.filter(income=payment.income, company=company, status="pago")

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
        company = get_company_or_404(self.request)

        old_instance = self.get_object()
        old_value = old_instance.value
        old_bank = old_instance.bank
        old_bill = old_instance.bill
        old_income = old_instance.income

        # Save updated payment
        payment = serializer.save(user=user, company=company)

        parent = payment.bill or payment.income
        if not parent:
            raise ValidationError("Pagamento inválido: objeto relacionado não encontrado.")

        if not payment.description and parent.description:
            payment.description = parent.description
            payment.save(update_fields=["description"])

        # 🔁 Atualiza status da conta SEMPRE (usando apenas pagamentos efetivos)
        if payment.bill:
            existing_payments = Payment.objects.filter(
                bill=payment.bill, company=company, status="pago"
            )
        elif payment.income:
            existing_payments = Payment.objects.filter(
                income=payment.income, company=company, status="pago"
            )

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

        # ⚠️ Só altera saldo do banco se pagamento estiver efetivado (pago)
        if payment.status != "pago":
            return

        value_diff = payment.value - old_value

        if old_bank == payment.bank and old_bill == payment.bill and old_income == payment.income:
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

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        company = get_company_or_404(request)
        instance = self.get_object()

        parent = instance.bill or instance.income
        if not parent:
            raise ValidationError("Pagamento inválido: objeto relacionado não encontrado.")

        # Estorna o valor no saldo do banco se já estava efetivado
        if instance.status == "pago" and instance.bank:
            if instance.bill:
                instance.bank.balance += instance.value
            elif instance.income:
                instance.bank.balance -= instance.value
            instance.bank.save()

        # Exclui o pagamento
        instance.delete()

        # Atualiza o status da conta (considerando apenas pagamentos efetivados restantes)
        if instance.bill:
            remaining_payments = Payment.objects.filter(bill=instance.bill, company=company, status="pago")
        else:
            remaining_payments = Payment.objects.filter(income=instance.income, company=company, status="pago")

        total_paid = sum(safe_decimal(p.value) for p in remaining_payments)
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

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["patch"], url_path="marcar-pago")
    @transaction.atomic
    def marcar_como_pago(self, request, pk=None):
        company = get_company_or_404(request)
        payment = self.get_object()

        if payment.status == "pago":
            return Response({"detail": "Este pagamento já está marcado como pago."}, status=400)

        date = request.data.get("date")
        if not date:
            return Response({"detail": "Campo 'date' é obrigatório."}, status=400)

        # Atualiza status e data
        payment.status = "pago"
        payment.date = date
        payment.save(update_fields=["status", "date"])

        # Atualiza saldo do banco
        if payment.bank:
            if payment.bill:
                payment.bank.balance -= payment.value
            elif payment.income:
                payment.bank.balance += payment.value
            payment.bank.save()

        # Atualiza status da conta vinculada
        parent = payment.bill or payment.income
        if parent:
            if payment.bill:
                pagamentos = Payment.objects.filter(bill=payment.bill, company=company, status="pago")
            else:
                pagamentos = Payment.objects.filter(income=payment.income, company=company, status="pago")

            total_pago = sum(p.value for p in pagamentos)
            if parent.value == 0:
                parent.status = "pago"
            elif abs(total_pago - parent.value) < Decimal("0.01"):
                parent.status = "pago"
            elif total_pago > 0:
                parent.status = "parcial"
            else:
                parent.status = "em aberto"
            parent.save()

        return Response({"detail": "Pagamento marcado como pago com sucesso."}, status=drf_status.HTTP_200_OK)


class BankViewSet(viewsets.ModelViewSet):
    serializer_class = BankSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bank.objects.all()

    def perform_create(self, serializer):
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
    payments = Payment.objects.select_related("bill", "income")

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
    company = get_company_or_404(request)
    filters = Q(company=company, status="pago")

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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_quadro_espelho_report(request):
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")
    user = request.user
    company = get_company_or_404(request)

    payments = Payment.objects.filter(company=company)
    if date_min:
        payments = payments.filter(date__gte=date_min)
    if date_max:
        payments = payments.filter(date__lte=date_max)

    events = Event.objects.all()
    if date_min:
        events = events.filter(date__gte=date_min)
    if date_max:
        events = events.filter(date__lte=date_max)

    total_faturamento_bruto = events.aggregate(total=models.Sum("total_value"))["total"] or Decimal("0.00")

    event_ids = events.values_list("id", flat=True)
    event_allocations = EventAllocation.objects.filter(event_id__in=event_ids)

    accrual_ids = event_allocations.values_list("accrual_id", flat=True)
    bill_ids = set(Bill.objects.filter(pk__in=accrual_ids).values_list("pk", flat=True))

    total_despesas_eventos = Decimal("0.00")
    for alloc in event_allocations:
        if alloc.accrual_id in bill_ids:
            total_despesas_eventos += alloc.value

    despesas_fixas = Decimal("0.00")
    pro_labore = Decimal("0.00")
    investimentos = Decimal("0.00")
    manutencoes = Decimal("0.00")

    for payment in payments:
        accrual = payment.payable
        if not accrual:
            continue
        original_value = accrual.value or Decimal("0.00")
        if original_value == 0:
            continue

        payment_ratio = payment.value / original_value

        for allocation in accrual.allocations.all():
            proportional_paid = allocation.value * payment_ratio
            group = allocation.chart_account.group

            if not group:
                continue

            if group.lower() == "despesas fixas":
                despesas_fixas += proportional_paid
            elif group.lower() == "pró-labore":
                pro_labore += proportional_paid
            elif group.lower() == "investimentos":
                investimentos += proportional_paid
            elif group.lower() == "manutenções":
                manutencoes += proportional_paid

    subtotal_despesas1 = despesas_fixas + pro_labore
    subtotal_despesas2 = investimentos + manutencoes
    saldo_bruto = total_faturamento_bruto - total_despesas_eventos
    saldo_final = saldo_bruto - subtotal_despesas1 - subtotal_despesas2

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=quadro_espelho.pdf"

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    margin = 40
    y = height - 50

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawCentredString(width / 2, y, "Arquitetura de Eventos")
    y -= 30

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, y, "Quadro Espelho")
    y -= 40

    pdf.setFont("Helvetica", 11)
    periodo_text = f"Período {date_min or '--'} a {date_max or '--'}"
    pdf.drawString(margin, y, periodo_text)
    y -= 30

    def draw_line(label, value, color=black, bold=False, separator=False):
        nonlocal y
        if bold:
            pdf.setFont("Helvetica-Bold", 12)
        else:
            pdf.setFont("Helvetica", 11)
        pdf.setFillColor(color)
        pdf.drawString(margin, y, label)
        pdf.drawRightString(width - margin, y, f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 20
        if separator:
            y -= 10
            pdf.line(margin, y, width - margin, y)
            y -= 20

    draw_line("Faturamento Bruto", total_faturamento_bruto, black, bold=True)
    draw_line("Despesas Eventos", total_despesas_eventos, red, bold=True, separator=True)
    draw_line("Saldo Bruto", saldo_bruto, blue, bold=True)
    y -= 10

    draw_line("Despesas Fixas", despesas_fixas, red, bold=True)
    draw_line("Pró-Labore", pro_labore, black, bold=False)
    draw_line("Sub Total Despesas 1", subtotal_despesas1, red, bold=True, separator=True)

    draw_line("Investimentos", investimentos, black, bold=False)
    draw_line("Manutenções", manutencoes, black, bold=False)
    draw_line("SubTotal Despesas 2", subtotal_despesas2, red, bold=True, separator=True)

    draw_line("Saldo Final", saldo_final, black, bold=True)

    pdf.setFillColor(black)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()

    return response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_quadro_realizado_report(request):
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")
    user = request.user
    company = get_company_or_404(request)

    payments = Payment.objects.filter(company=company)
    if date_min:
        payments = payments.filter(date__gte=date_min)
    if date_max:
        payments = payments.filter(date__lte=date_max)

    total_recebimento_bruto = Decimal("0.00")
    total_despesas_eventos = Decimal("0.00")
    despesas_fixas = Decimal("0.00")
    pro_labore = Decimal("0.00")
    investimentos = Decimal("0.00")
    manutencoes = Decimal("0.00")

    for payment in payments:
        accrual = payment.payable
        if not accrual:
            continue
        original_value = accrual.value or Decimal("0.00")
        if original_value == 0:
            continue

        payment_ratio = payment.value / original_value

        for allocation in accrual.allocations.all():
            proportional_paid = allocation.value * payment_ratio
            account = allocation.chart_account

            # Recebimento Bruto
            if account.code == "10101":
                total_recebimento_bruto += proportional_paid

            # Despesas
            elif account.group:
                group = account.group.lower()
                if group == "eventos":
                    total_despesas_eventos += proportional_paid
                elif group == "despesas fixas":
                    despesas_fixas += proportional_paid
                elif group == "pró-labore":
                    pro_labore += proportional_paid
                elif group == "investimentos":
                    investimentos += proportional_paid
                elif group == "manutenções":
                    manutencoes += proportional_paid

    subtotal_despesas1 = despesas_fixas + pro_labore
    subtotal_despesas2 = investimentos + manutencoes
    saldo_bruto = total_recebimento_bruto - total_despesas_eventos
    saldo_final = saldo_bruto - subtotal_despesas1 - subtotal_despesas2

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=quadro_realizado.pdf"

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    margin = 40
    y = height - 50

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawCentredString(width / 2, y, "Arquitetura de Eventos")
    y -= 30

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, y, "Quadro Realizado")
    y -= 40

    pdf.setFont("Helvetica", 11)
    periodo_text = f"Período {date_min or '--'} a {date_max or '--'}"
    pdf.drawString(margin, y, periodo_text)
    y -= 30

    def draw_line(label, value, color=black, bold=False, separator=False):
        nonlocal y
        if bold:
            pdf.setFont("Helvetica-Bold", 12)
        else:
            pdf.setFont("Helvetica", 11)
        pdf.setFillColor(color)
        pdf.drawString(margin, y, label)
        pdf.drawRightString(width - margin, y, f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 20
        if separator:
            y -= 10
            pdf.line(margin, y, width - margin, y)
            y -= 20

    draw_line("Recebimento Bruto", total_recebimento_bruto, black, bold=True)
    draw_line("Despesas Eventos", total_despesas_eventos, red, bold=True, separator=True)
    draw_line("Saldo Bruto", saldo_bruto, blue, bold=True)
    y -= 10

    draw_line("Despesas Fixas", despesas_fixas, red, bold=True)
    draw_line("Pró-labore", pro_labore, black, bold=False)
    draw_line("Sub Total Despesas 1", subtotal_despesas1, red, bold=True, separator=True)

    draw_line("Investimentos", investimentos, black, bold=False)
    draw_line("Manutenções", manutencoes, black, bold=False)
    draw_line("SubTotal Despesas 2", subtotal_despesas2, red, bold=True, separator=True)

    draw_line("Saldo Final", saldo_final, black, bold=True)

    pdf.setFillColor(black)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()

    return response

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_scheduled_payments_report(request):
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.pdfgen import canvas
    from events.utils.pdffunctions import draw_header, check_page_break, truncate_text

    user = request.user
    company = get_company_or_404(request)
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")

    # 🔎 Filtrar apenas os pagamentos agendados
    payments = Payment.objects.filter(company=company, status="agendado")
    if date_min:
        payments = payments.filter(date__gte=date_min)
    if date_max:
        payments = payments.filter(date__lte=date_max)

    payments = payments.select_related("bill__person", "income__person").order_by("date")

    bills = []
    incomes = []

    for p in payments:
        parent = p.bill or p.income
        if not parent:
            continue
        row = {
            "id": p.id,
            "date": p.date,
            "person": parent.person.name if parent.person else "-",
            "description": p.description or parent.description or "-",
            "doc_number": p.doc_number or "DN",
            "value": p.value,
        }
        if p.bill:
            bills.append(row)
        elif p.income:
            incomes.append(row)

    # 📄 Gerar PDF
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=pagamentos_agendados.pdf"

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    cols = [50, width * 0.12, width * 0.2, width * 0.45, width * 0.8, width * 0.9]

    y = draw_header(pdf, width, height, "Geral", "Pagamentos Agendados", "Pagamentos Agendados")

    def draw_table(pdf, items, label, y):
        if not items:
            return y, Decimal("0.00")
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(cols[0], y, label)
        y -= 20
        total = Decimal("0.00")
        pdf.setFont("Helvetica", 8)
        for row in items:
            y = check_page_break(pdf, y, height, width, "Geral", None, "Pagamentos Agendados")
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
        pdf.drawString(cols[4], y, "Total")
        pdf.drawString(cols[5], y, f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 20
        return y, total

    y, total_bills = draw_table(pdf, bills, "Despesas Agendadas", y)
    y, total_incomes = draw_table(pdf, incomes, "Receitas Agendadas", y)

    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(cols[4], y, "Total Geral")
    total_geral = total_bills + total_incomes
    pdf.drawString(cols[5], y, f"R$ {total_geral:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))

    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
    pdf.showPage()
    pdf.save()

    return response

