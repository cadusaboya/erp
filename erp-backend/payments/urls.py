from rest_framework.routers import DefaultRouter
from .views import BillViewSet, IncomeViewSet, BankAccountViewSet, combined_extract
from django.urls import path, include

router = DefaultRouter()
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'incomes', IncomeViewSet, basename='income')
router.register(r'banks', BankAccountViewSet, basename='bank')

urlpatterns = [
    path('', include(router.urls)),
    path('extract/', combined_extract),
]
