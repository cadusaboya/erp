from django.db import models
from django.conf import settings
from events.models import Event  # Import Event model

class PaymentOrder(models.Model):
    PAYMENT_TYPES = [
        ("Despesa", "despesa"),
        ("Receita", "receita"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=PAYMENT_TYPES)
    person = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateField()
    doc_number = models.CharField(max_length=50, unique=True)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.type.capitalize()} - {self.person} ({self.date})"
