from rest_framework.routers import DefaultRouter
from .views import BillViewSet, IncomeViewSet, BankViewSet, combined_extract, PaymentViewSet, CostCenterViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'incomes', IncomeViewSet, basename='income')
router.register(r'banks', BankViewSet, basename='bank')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'costcenter', CostCenterViewSet, basename='costcenter')

urlpatterns = [
    path('', include(router.urls)),
    path('extract/', combined_extract),
]
