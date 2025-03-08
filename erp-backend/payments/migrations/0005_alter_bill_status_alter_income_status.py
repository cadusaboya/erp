# Generated by Django 5.1.7 on 2025-03-07 19:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0004_alter_bill_person_alter_income_person'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bill',
            name='status',
            field=models.CharField(choices=[('Em aberto', 'em aberto'), ('Pago', 'pago'), ('Vencido', 'vencido')], default='open', max_length=10),
        ),
        migrations.AlterField(
            model_name='income',
            name='status',
            field=models.CharField(choices=[('Em aberto', 'em Aberto'), ('Pago', 'pago'), ('Vencido', 'vencido')], default='open', max_length=10),
        ),
    ]
