from rest_framework.routers import DefaultRouter
from .views import BillViewSet, IncomeViewSet, combined_extract
from django.urls import path, include

router = DefaultRouter()
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'incomes', IncomeViewSet, basename='income')

urlpatterns = [
    path('', include(router.urls)),
    path('extract/', combined_extract),
]
