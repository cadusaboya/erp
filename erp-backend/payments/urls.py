from rest_framework.routers import DefaultRouter
from .views import BillViewSet, IncomeViewSet, BankViewSet, generate_quadro_realizado_report, generate_quadro_espelho_report, combined_extract, PaymentViewSet, generate_bank_statement_report, generate_chart_account_balance, generate_payments_report, generate_cost_center_consolidated_report, CostCenterViewSet, event_accruals_view, ChartAccountViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'incomes', IncomeViewSet, basename='income')
router.register(r'banks', BankViewSet, basename='bank')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'costcenter', CostCenterViewSet, basename='costcenter')
router.register(r'chartaccounts', ChartAccountViewSet, basename='chartaccount')

urlpatterns = [
    path('', include(router.urls)),
    path('extract/', combined_extract),
    path("event-allocations/<int:event_id>/", event_accruals_view),
    path("report/", generate_payments_report),
    path("report/costcenter/", generate_cost_center_consolidated_report),
    path("report/chartaccount/", generate_chart_account_balance),
    path("report/bank/", generate_bank_statement_report),
    path("report/espelho/", generate_quadro_espelho_report),
    path("report/realizado/", generate_quadro_realizado_report)
]
