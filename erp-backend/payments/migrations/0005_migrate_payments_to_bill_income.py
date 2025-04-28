from django.db import migrations

def migrate_payments(apps, schema_editor):
    Payment = apps.get_model('payments', 'Payment')
    ContentType = apps.get_model('contenttypes', 'ContentType')

    # Recupera os content types
    bill_content_type = ContentType.objects.get(model="bill")
    income_content_type = ContentType.objects.get(model="income")

    for payment in Payment.objects.all():
        if payment.content_type_id == bill_content_type.id:
            payment.bill_id = payment.object_id
            payment.save()
        elif payment.content_type_id == income_content_type.id:
            payment.income_id = payment.object_id
            payment.save()

class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0004_payment_bill_payment_income'),  # Corrija aqui o nome
    ]

    operations = [
        migrations.RunPython(migrate_payments),
    ]
