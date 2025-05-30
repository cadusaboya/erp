# Generated by Django 5.1.7 on 2025-05-12 14:12

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0013_alter_bank_legacy_alter_bill_legacy_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BankTransfer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.DecimalField(decimal_places=2, max_digits=10)),
                ('date', models.DateField(default=django.utils.timezone.now)),
                ('description', models.CharField(blank=True, max_length=255)),
                ('bank_from', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transfers_out', to='payments.bank')),
                ('bank_to', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transfers_in', to='payments.bank')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
