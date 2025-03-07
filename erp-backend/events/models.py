from django.db import models
from django.conf import settings
from clients.models import Client  # Import the Client model

class Event(models.Model):
    EVENT_TYPES = [
        ("meeting", "Meeting"),
        ("delivery", "Delivery"),
        ("other", "Other"),
    ]

    PAYMENT_FORMS = [
        ("cash", "Cash"),
        ("credit", "Credit Card"),
        ("debit", "Debit Card"),
        ("transfer", "Bank Transfer"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=EVENT_TYPES)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)  # Link to Client model
    date = models.DateField()
    total_value = models.DecimalField(max_digits=10, decimal_places=2)
    payment_form = models.CharField(max_length=20, choices=PAYMENT_FORMS)

    def __str__(self):
        return f"{self.type} - {self.client.name} ({self.date})"
