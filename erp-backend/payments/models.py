from django.db import models
from django.conf import settings
from events.models import Event  # Import Event model
from django.utils.timezone import now
    
class Accrual(models.Model):
    STATUS_CHOICES = [
        ('em aberto', 'Em Aberto'),
        ('pago', 'Pago'),
        ('vencido', 'Vencido')
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    description = models.TextField()
    date_due = models.DateField()
    value = models.DecimalField(max_digits=10, decimal_places=2)
    doc_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    event = models.ForeignKey('events.Event', on_delete=models.SET_NULL, blank=True, null=True, related_name="%(class)s")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='em aberto')

    class Meta:
        abstract = True


class Income(Accrual):
    person = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='incomes')

    def __str__(self):
        return f"Receita de {self.client.name} - {self.value}"


class Bill(Accrual):
    person = models.ForeignKey('clients.Supplier', on_delete=models.CASCADE, related_name='bills')

    def __str__(self):
        return f"Conta de {self.supplier.name} - {self.value}"

