# Generated by Django 5.1.7 on 2025-03-07 16:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0003_income'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bill',
            name='person',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='income',
            name='person',
            field=models.CharField(max_length=255),
        ),
    ]
