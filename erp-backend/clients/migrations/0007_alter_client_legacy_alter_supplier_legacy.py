# Generated by Django 5.1.7 on 2025-05-06 03:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0006_supplier_legacy'),
    ]

    operations = [
        migrations.AlterField(
            model_name='client',
            name='legacy',
            field=models.IntegerField(null=True),
        ),
        migrations.AlterField(
            model_name='supplier',
            name='legacy',
            field=models.IntegerField(null=True),
        ),
    ]
