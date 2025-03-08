from django.db import models
from django.conf import settings
from events.models import Event  # Import Event model
from django.utils.timezone import now

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
    
class Bill(models.Model):
    STATUS_CHOICES = [
        ('em aberto', 'Em Aberto'),  # DB stores 'em aberto', UI displays 'Em Aberto'
        ('pago', 'Pago'),
        ('vencido', 'Vencido')
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    person = models.CharField(max_length=255)
    description = models.TextField()
    date_due = models.DateField()
    value = models.DecimalField(max_digits=10, decimal_places=2)
    doc_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    event = models.ForeignKey('events.Event', on_delete=models.SET_NULL, blank=True, null=True, related_name="bills")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='em aberto')

    def __str__(self):
        return f"{self.person.name} - {self.value} - {self.status}"
    
class Income(models.Model):
    STATUS_CHOICES = [
        ('em aberto', 'Em Aberto'),
        ('pago', 'Pago'),
        ('vencido', 'Vencido')
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    person = models.CharField(max_length=255)
    description = models.TextField()
    date_due = models.DateField()
    value = models.DecimalField(max_digits=10, decimal_places=2)
    doc_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    event = models.ForeignKey('events.Event', on_delete=models.SET_NULL, blank=True, null=True, related_name="incomes")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='em aberto')

    def __str__(self):
        return f"{self.person.name} - {self.value} - {self.status}"
    
    def update_status(self):
        """Updates the status based on the due date."""
        if self.status == 'em aberto' and self.date_due < now().date():
            self.status = 'vencido'
            self.save()

    def save(self, *args, **kwargs):
        """Override save to auto-update status."""
        self.update_status()
        super().save(*args, **kwargs)
