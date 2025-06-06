# Generated by Django 5.1.7 on 2025-05-05 21:51

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0011_bill_legacy_income_legacy'),
    ]

    operations = [
        migrations.AlterField(
            model_name='payment',
            name='bank',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to='payments.bank'),
        ),
        migrations.AlterField(
            model_name='payment',
            name='value',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
