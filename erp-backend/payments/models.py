from django.db import models
from django.conf import settings
from events.models import Event  # Import Event model
from django.utils.timezone import now
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericRelation

class CostCenter(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
class Accrual(models.Model):
    STATUS_CHOICES = [
        ('em aberto', 'Em Aberto'),
        ('pago', 'Pago'),
        ('vencido', 'Vencido'),
        ('parcial', 'Parcial')
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    description = models.TextField()
    date_due = models.DateField()
    value = models.DecimalField(max_digits=10, decimal_places=2)
    doc_number = models.CharField(max_length=50, blank=True, null=True)
    event = models.ForeignKey('events.Event', on_delete=models.SET_NULL, blank=True, null=True, related_name="%(class)s")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='em aberto')
    cost_center = models.ForeignKey(CostCenter, on_delete=models.SET_NULL, null=True, blank=True)


class Income(Accrual):
    person = models.ForeignKey('clients.Client', on_delete=models.PROTECT, related_name='incomes')
    legacy = models.IntegerField(unique=False)

    def __str__(self):
        return f"Receita de {self.client.name} - {self.value}"


class Bill(Accrual):
    person = models.ForeignKey('clients.Supplier', on_delete=models.PROTECT, related_name='bills')
    legacy = models.IntegerField(unique=False)

    def __str__(self):
        return f"Conta de {self.supplier.name} - {self.value}"
    
class Payment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    bill = models.ForeignKey('Bill', on_delete=models.CASCADE, null=True, blank=True, related_name='payments')
    income = models.ForeignKey('Income', on_delete=models.CASCADE, null=True, blank=True, related_name='payments')
    description = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField()
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bank = models.ForeignKey('Bank', on_delete=models.PROTECT, null=True, blank=True)
    doc_number = models.CharField(max_length=100, blank=True)

    @property
    def payable(self):
        return self.bill or self.income

    def __str__(self):
        return f"Pagamento de R$ {self.value} em {self.date}"
    
    def get_allocated_value_to_event(self, event_id):
        alloc = None
        total = None

        if self.bill:
            alloc = self.bill.event_allocations.filter(event_id=event_id).first()
            total = self.bill.value
        elif self.income:
            alloc = self.income.event_allocations.filter(event_id=event_id).first()
            total = self.income.value

        if not alloc or not total:
            return 0

        ratio = alloc.value / total if total else 0
        return round(self.value * ratio, 2)


class Bank(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bank_accounts")
    name = models.CharField(max_length=255)
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    legacy = models.IntegerField(unique=False)

    def __str__(self):
        return f"{self.name} - R$ {self.balance:.2f}"
    
class ChartAccount(models.Model):
    code = models.CharField(max_length=20)
    description = models.CharField(max_length=200)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children"
    )

    def __str__(self):
        return f"{self.code} - {self.description}"

    
class AccountAllocation(models.Model):
    accrual = models.ForeignKey(Accrual, on_delete=models.CASCADE, related_name="allocations")  # bill or income
    chart_account = models.ForeignKey(ChartAccount, on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=10, decimal_places=2)

class EventAllocation(models.Model):
    accrual = models.ForeignKey(Accrual, on_delete=models.PROTECT, related_name="event_allocations")
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    value = models.DecimalField(max_digits=10, decimal_places=2)


