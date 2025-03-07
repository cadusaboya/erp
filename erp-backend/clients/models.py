from django.db import models
from django.conf import settings

class Client(models.Model):
    name = models.CharField(max_length=255)
    telephone = models.CharField(max_length=15, unique=True)
    email = models.EmailField(unique=True)
    address = models.TextField()
    cpf_cnpj = models.CharField(max_length=18, unique=True)  # Handles both CPF (11 digits) and CNPJ (14 digits)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Owner of the client

    def __str__(self):
        return self.name
