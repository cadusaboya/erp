from django.urls import path
from .views import create_payment_order, list_payment_orders

urlpatterns = [
    path("", list_payment_orders, name="list-payment-orders"),
    path("create/", create_payment_order, name="create-payment-order"),
]
