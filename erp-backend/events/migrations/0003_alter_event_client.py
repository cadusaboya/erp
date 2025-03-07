# Generated by Django 5.1.7 on 2025-03-06 21:59

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0001_initial'),
        ('events', '0002_alter_event_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='client',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='clients.client'),
        ),
    ]
