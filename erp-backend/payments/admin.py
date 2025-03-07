from django.contrib import admin
from .models import PaymentOrder, Bill

admin.site.register(PaymentOrder)

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ("person", "value", "date_due", "status", "event")
    search_fields = ("person__name", "doc_number")
    list_filter = ("status", "date_due")