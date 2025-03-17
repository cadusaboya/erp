from django.db import models
from django.conf import settings

class Person(models.Model):
    name = models.CharField(max_length=255)
    telephone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True)
    address = models.TextField()
    cpf_cnpj = models.CharField(max_length=18, unique=True)  # Handles both CPF (11 digits) and CNPJ (14 digits)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Owner of the record

    class Meta:
        abstract = True

    def __str__(self):
        return self.name

class Client(Person):
    # Additional fields or methods specific to clients
    pass

class Supplier(Person):
    # Additional fields or methods specific to suppliers
    pass
