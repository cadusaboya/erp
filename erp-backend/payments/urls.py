from rest_framework.routers import DefaultRouter
from .views import BillViewSet, IncomeViewSet, EntryViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'bills', BillViewSet, basename='bill')
router.register(r'incomes', IncomeViewSet, basename='income')
router.register(r'entries', EntryViewSet, basename='entry')

urlpatterns = [
    path('', include(router.urls)),
]
