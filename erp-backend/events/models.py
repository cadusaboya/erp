from django.db import models
from django.conf import settings
from clients.models import Client  # Import the Client model
from accounts.models import Company

class Event(models.Model):
    EVENT_TYPES = [
        ("15 anos", "15 Anos"),
        ("aniversário", "Aniversário"),
        ("batizado", "Batizado"),
        ("bodas", "Bodas"),
        ("casamento", "Casamento"),
        ("chá", "Chá"),
        ("formatura", "Formatura"),
        ("empresarial", "Empresarial"),
        ("outros", "Outros")
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event_name = models.CharField(max_length=255)  # New field for event name
    type = models.CharField(max_length=20, choices=EVENT_TYPES)
    client = models.ForeignKey(Client, on_delete=models.PROTECT)  # Link to Client model
    date = models.DateField()
    total_value = models.DecimalField(max_digits=10, decimal_places=2)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True)
    legacy = models.IntegerField(null=True, unique=False)

    def __str__(self):
        return f"{self.event_name} - {self.client.name} ({self.date})"
