from celery import shared_task
from django.utils.timezone import now
from .models import Bill, Income

@shared_task
def update_overdue_status():
    """Updates all Bills and Incomes that are overdue and still 'Em Aberto'."""
    
    # Update overdue Bills
    overdue_bills = Bill.objects.filter(status='em aberto', date_due__lt=now().date())
    count_bills = overdue_bills.update(status='vencido')

    # Update overdue Incomes
    overdue_incomes = Income.objects.filter(status='em aberto', date_due__lt=now().date())
    count_incomes = overdue_incomes.update(status='vencido')

    return f"Updated {count_bills} overdue Bills and {count_incomes} overdue Incomes to 'Vencido'."
