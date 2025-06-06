# Generated by Django 5.1.7 on 2025-05-14 16:37

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0007_alter_client_legacy_alter_supplier_legacy'),
        ('payments', '0018_accountallocation_company_accrual_company_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bill',
            name='person',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bills', to='clients.supplier'),
        ),
        migrations.AlterField(
            model_name='income',
            name='person',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='incomes', to='clients.client'),
        ),
    ]
