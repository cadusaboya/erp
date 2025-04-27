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
from events.utils.pdffunctions import draw_header, draw_rows, check_page_break
from events.models import Event
from decimal import Decimal
from datetime import datetime
from collections import defaultdict

import locale
try:
    locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
except:
    locale.setlocale(locale.LC_ALL, '')

def format_currency(value: Decimal) -> str:
    return locale.currency(value, grouping=True)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_chart_account_balance(request):
    date_min = request.query_params.get("date_min")
    date_max = request.query_params.get("date_max")
    user = request.user

    # Filtro inicial
    bill_qs = Bill.objects.filter(user=user, status__in=["pago", "parcial"])
    income_qs = Income.objects.filter(user=user, status__in=["pago", "parcial"])

    if date_min:
        bill_qs = bill_qs.filter(date_due__gte=date_min)
        income_qs = income_qs.filter(date_due__gte=date_min)

    if date_max:
        bill_qs = bill_qs.filter(date_due__lte=date_max)
        income_qs = income_qs.filter(date_due__lte=date_max)

    qs = list(bill_qs) + list(income_qs)

    # Mapeamento ChartAccount -> valor pago proporcional
    chartaccount_totals = defaultdict(Decimal)

    for accrual in qs:
        total_paid = sum(p.value for p in accrual.payments.all()) if hasattr(accrual, "payments") else Decimal("0.00")
        original_value = accrual.value

        payment_ratio = min(total_paid / original_value, Decimal("1.00")) if original_value else Decimal("0.00")

        for allocation in accrual.allocations.all():
            proportional_paid = allocation.value * payment_ratio
            chartaccount_totals[allocation.chart_account_id] += proportional_paid

    # Buscar contas usadas + parents
    used_accounts = ChartAccount.objects.filter(id__in=chartaccount_totals.keys()).select_related("parent")
    parent_ids = [acc.parent_id for acc in used_accounts if acc.parent_id]
    all_ids = set(chartaccount_totals.keys()) | set(parent_ids)
    chart_accounts = ChartAccount.objects.filter(id__in=all_ids).select_related("parent")

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
    response["Content-Disposition"] = 'attachment; filename="balancete_plano_contas.pdf"'

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

    # Imprimir tudo
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

    if type_filter == "bills":
        qs = Bill.objects.filter(user=user)
    else:
        qs = Income.objects.filter(user=user)

    if date_min:
        qs = qs.filter(date_due__gte=date_min)
    if date_max:
        qs = qs.filter(date_due__lte=date_max)

    if status == "pago":
        qs = qs.filter(status__in=["pago", "parcial"])
    elif status == "em_aberto":
        qs = qs.filter(status__in=["em aberto", "parcial"])

    # Preparar o total consolidado
    cost_center_totals = defaultdict(lambda: Decimal("0.00"))

    for item in qs:
        if not hasattr(item, "payments"):
            total_paid = Decimal("0.00")
        else:
            total_paid = sum(p.value for p in item.payments.all())

        original_value = item.value

        # Agora decide o valor a considerar conforme status
        if status == "pago":
            value = min(total_paid, original_value)
        elif status == "em_aberto":
            value = max(original_value - total_paid, Decimal("0.00"))
        else:  # status == todos
            value = original_value

        # Se estiver filtrando pagos e total_pago == 0, ignora
        if status == "pago" and total_paid == 0:
            continue

        label = item.cost_center.name if item.cost_center else "#Sem Centro"
        cost_center_totals[label] += value

    # Ordenar por valor decrescente
    sorted_totals = sorted(cost_center_totals.items(), key=lambda x: x[1], reverse=True)

    # PDF
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename=relatorio_consolidado_centros_custo.pdf'

    pdf = canvas.Canvas(response, pagesize=A4)
    width, height = A4
    margin = 40

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawCentredString(width / 2, height - 50, "Arquitetura de Eventos")

    pdf.setFont("Helvetica", 12)
    # Mapear os títulos de acordo com type e status
    titles = {
        "bills": {
            "pago": "Contas Pagas por Centro de Custo",
            "em_aberto": "Contas a Pagar por Centro de Custo",
            "todos": "Despesas por Centro de Custo",
        },
        "incomes": {
            "pago": "Contas Recebidas por Centro de Custo",
            "em_aberto": "Contas a Receber por Centro de Custo",
            "todos": "Receitas por Centro de Custo",
        }
    }

    # Pegar título baseado no filtro selecionado
    titulo = titles.get(type_filter, {}).get(status, "Relatório por Centro de Custo")
    pdf.drawCentredString(width / 2, height - 70, titulo)

    # Período
    pdf.setFont("Helvetica", 9)
    periodo_text = f"Período {date_min or '--'} a {date_max or '--'}"
    pdf.drawString(margin, height - 100, periodo_text)

    # Cabeçalho da tabela
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
        pdf.drawRightString(width - margin, y, f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))  # formato brasileiro
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
            content_type__model__in=["bill", "income"],
        )

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
            accrual = p.payable  # bill or income
            if p.content_type.model == "bill":
                if type_filter in ["both", "bills"]:
                    bills.append({
                        "id": p.id,
                        "date": p.date,
                        "person": accrual.person.name if accrual.person else "-",
                        "description": accrual.description,
                        "doc_number": accrual.doc_number or "DN",
                        "value": round(p.value, 2),
                    })
            elif p.content_type.model == "income":
                if type_filter in ["both", "incomes"]:
                    incomes.append({
                        "id": p.id,
                        "date": p.date,
                        "person": accrual.person.name if accrual.person else "-",
                        "description": accrual.description,
                        "doc_number": accrual.doc_number or "DN",
                        "value": round(p.value, 2),
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

        def get_rows(qs, is_bill):
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
            bills = get_rows(bill_qs, True)
        if type_filter in ["both", "incomes"]:
            incomes = get_rows(income_qs, False)

    # ------------------------- PDF ---------------------------------

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = "attachment; filename=relatorio_completo_contas.pdf"

    pdf = canvas.Canvas(response, pagesize=landscape(A4))
    width, height = landscape(A4)
    cols = [50, width * 0.15, width * 0.3, width * 0.5, width * 0.75, width * 0.9]

    event_name = event.event_name if event else "Todos os Eventos"

    if status == "pago":
        title = "Pagamentos Recebidos e Efetuados"
    elif type_filter == "bills" and status == "em aberto":
        title = "Contas a Pagar"
    elif type_filter == "bills":
        title = "Despesas"
    elif type_filter == "incomes" and status == "em aberto":
        title = "Contas a Receber"
    elif type_filter == "incomes":
        title = "Receitas"
    else:
        title = "Lançamentos Contábeis"
        
    y = draw_header(pdf, width, height, event_name, event.id if event else "Geral", title)

    def draw_table(pdf, items, label, y, is_income=False):
        if not items:
            return y

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
            pdf.drawString(cols[2], y, row["person"])
            pdf.drawString(cols[3], y, row["description"])
            pdf.drawString(cols[4], y, row["doc_number"])
            pdf.drawString(cols[5], y, f"R$ {row['value']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
            total += row["value"]
            y -= 15

        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(cols[4], y, f"Total {label}")
        pdf.drawString(cols[5], y, f"R$ {total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        y -= 25
        return y

    if bills:
        y = draw_table(pdf, bills, "Despesas", y, is_income=False)
    if incomes:
        y = draw_table(pdf, incomes, "Receitas", y, is_income=True)

    pdf.setFont("Helvetica", 7)
    pdf.drawString(width - 100, 30, "Página 1 de 1")
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