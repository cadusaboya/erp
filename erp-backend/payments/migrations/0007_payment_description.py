from django.db import migrations, models

def copy_description_from_parent(apps, schema_editor):
    Payment = apps.get_model('payments', 'Payment')
    Bill = apps.get_model('payments', 'Bill')
    Income = apps.get_model('payments', 'Income')

    updated_count = 0

    for payment in Payment.objects.all():
        description = None

        if payment.bill_id:
            bill = Bill.objects.filter(id=payment.bill_id).first()
            if bill:
                description = bill.description

        if payment.income_id and not description:
            income = Income.objects.filter(id=payment.income_id).first()
            if income:
                description = income.description

        if description:
            payment.description = description
            payment.save()
            updated_count += 1

    print(f"✅ Updated {updated_count} payments with description.")

class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0006_remove_payment_content_type_remove_payment_object_id'),  # 👈 replace with your last migration name
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='description',
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
        migrations.RunPython(copy_description_from_parent),
    ]
