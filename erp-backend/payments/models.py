from django.db import models
from django.conf import settings
from events.models import Event  # Import Event model
from django.utils.timezone import now
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericRelation
    
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
    payments = GenericRelation('payments.Payment', content_type_field='content_type', object_id_field='object_id')

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
    
class Payment(models.Model):
    # Generic FK to Bill or Income
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name="payment_target")
    object_id = models.PositiveIntegerField()
    payable = GenericForeignKey('content_type', 'object_id')
    description = models.TextField(blank=True, null=True)  # ✅ NEW FIELD

    date = models.DateField(auto_now_add=True)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    bank = models.ForeignKey('Bank', on_delete=models.CASCADE)  # ✅ NEW FK to Bank model
    doc_number = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Pagamento de R$ {self.value} em {self.date}"


class Bank(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bank_accounts")
    name = models.CharField(max_length=255)
    balance = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.name} - R$ {self.balance:.2f}"


