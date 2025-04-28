from django.db import migrations

def migrate_payments(apps, schema_editor):
    Payment = apps.get_model('payments', 'Payment')
    ContentType = apps.get_model('contenttypes', 'ContentType')
    Bill = apps.get_model('payments', 'Bill')
    Income = apps.get_model('payments', 'Income')

    # Descobre os content types
    bill_content_type = ContentType.objects.get(model="bill")
    income_content_type = ContentType.objects.get(model="income")

    for payment in Payment.objects.all():
        # CUIDADO: agora não temos mais content_type e object_id no modelo,
        # então só funciona se você rodar isso antes de aplicar a migração que remove os campos!
        # Se já aplicou, não dá mais para migrar por aqui.
        pass

def no_op(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0004_payment_bill_payment_income'),  # adapte o nome correto aqui
    ]

    operations = [
        migrations.RunPython(no_op, reverse_code=no_op),
    ]
