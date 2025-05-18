from django.db import models
from django.conf import settings

class Person(models.Model):
    name = models.CharField(max_length=255)  # Required
    telephone = models.CharField(max_length=15, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    cpf_cnpj = models.CharField(max_length=18, blank=True, null=True)  # Accepts both CPF and CNPJ
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Owner of the record

    class Meta:
        abstract = True

    def __str__(self):
        return self.name

class Client(Person):
    legacy = models.IntegerField(null=True, unique=False)
    # Additional fields or methods specific to clients
    pass

class Supplier(Person):
    legacy = models.IntegerField(null=True, unique=False)
    # Additional fields or methods specific to suppliers
    pass
