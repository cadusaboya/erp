# Generated by Django 5.1.7 on 2025-03-25 17:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0015_payment_user'),
    ]

    operations = [
        migrations.AlterField(
            model_name='payment',
            name='date',
            field=models.DateField(),
        ),
    ]
