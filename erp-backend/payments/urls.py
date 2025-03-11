from django.urls import path
from .views import create_payment_order, list_payment_orders, list_bills, create_bill, create_income, list_incomes, update_bill, update_income

urlpatterns = [
    path("", list_payment_orders, name="list-payment-orders"),
    path("create/", create_payment_order, name="create-payment-order"),
    path("bills/", list_bills, name="list-bills"),
    path("bills/create/", create_bill, name="create-bill"),
    path("bills/<int:bill_id>/", update_bill, name="update_bill"),
    path("incomes/<int:income_id>/", update_income, name="update_income"),
    path("incomes/create/", create_income, name="create_income"),
    path("incomes/", list_incomes, name="list_incomes"),
]
