from django.db import migrations

def create_default_companies(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    Company = apps.get_model('accounts', 'Company')

    # ✅ Adjust these app labels if needed
    Event = apps.get_model('events', 'Event')
    Payment = apps.get_model('payments', 'Payment')
    Accrual = apps.get_model('payments', 'Accrual')
    Bank = apps.get_model('payments', 'Bank')
    EventAllocation = apps.get_model('payments', 'EventAllocation')
    AccountAllocation = apps.get_model('payments', 'AccountAllocation')

    print("\n👉 Assigning Default Companies to all existing data...")

    for user in User.objects.all():
        company, created = Company.objects.get_or_create(user=user, name="MACHADO SERVIÇOS")
        if created:
            print(f"✅ Created Default Company for user: {user.username}")

        Event.objects.filter(user=user, company__isnull=True).update(company=company)
        Payment.objects.filter(user=user, company__isnull=True).update(company=company)
        Accrual.objects.filter(user=user, company__isnull=True).update(company=company)
        Bank.objects.filter(user=user, company__isnull=True).update(company=company)
        EventAllocation.objects.filter(event__user=user, company__isnull=True).update(company=company)
        AccountAllocation.objects.filter(accrual__user=user, company__isnull=True).update(company=company)

    print("🎉 All existing records have now been assigned to Default Companies.\n")

class Migration(migrations.Migration):

    dependencies = [
        # ✅ Put your last migration file here
        ('accounts', '0002_company'),
    ]

    operations = [
        migrations.RunPython(create_default_companies),
    ]
