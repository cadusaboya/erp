# Generated by Django 5.1.7 on 2025-03-19 17:36

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0004_entry_client_entry_supplier'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Entry',
        ),
    ]
