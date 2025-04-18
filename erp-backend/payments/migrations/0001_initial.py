# Generated by Django 5.1.7 on 2025-03-17 20:12

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('events', '0005_alter_event_type'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Bill',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('person', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('date_due', models.DateField()),
                ('value', models.DecimalField(decimal_places=2, max_digits=10)),
                ('doc_number', models.CharField(blank=True, max_length=50, null=True, unique=True)),
                ('status', models.CharField(choices=[('em aberto', 'Em Aberto'), ('pago', 'Pago'), ('vencido', 'Vencido')], default='em aberto', max_length=10)),
                ('event', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s', to='events.event')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Entry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('Despesa', 'despesa'), ('Receita', 'receita')], max_length=10)),
                ('person', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('date', models.DateField()),
                ('doc_number', models.CharField(max_length=50, unique=True)),
                ('value', models.DecimalField(decimal_places=2, max_digits=10)),
                ('event', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='events.event')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Income',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('person', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('date_due', models.DateField()),
                ('value', models.DecimalField(decimal_places=2, max_digits=10)),
                ('doc_number', models.CharField(blank=True, max_length=50, null=True, unique=True)),
                ('status', models.CharField(choices=[('em aberto', 'Em Aberto'), ('pago', 'Pago'), ('vencido', 'Vencido')], default='em aberto', max_length=10)),
                ('event', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s', to='events.event')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
