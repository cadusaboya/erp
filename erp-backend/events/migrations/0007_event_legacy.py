# Generated by Django 5.1.7 on 2025-05-05 20:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0006_alter_event_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='legacy',
            field=models.IntegerField(default=0),
            preserve_default=False,
        ),
    ]
