# Generated by Django 5.1.7 on 2025-03-07 20:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0007_alter_bill_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bill',
            name='status',
            field=models.CharField(choices=[('Em Aberto', 'em aberto'), ('Pago', 'pago'), ('Vencido', 'vencido')], default='Em Aberto', max_length=10),
        ),
    ]
