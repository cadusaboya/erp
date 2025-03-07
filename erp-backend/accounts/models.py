from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    cpf = models.CharField(max_length=11, default=0, unique=True)
    telefone = models.DecimalField(max_digits=11, decimal_places=0, default=0.00)
    email = models.EmailField(unique=True) # Making email field unique and non-null

    def __str__(self):
        return self.username