# Generated by Django 5.1.7 on 2025-03-25 00:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0012_alter_payment_bank'),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
    ]
