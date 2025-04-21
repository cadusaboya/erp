from django.contrib import admin
from .models import Income, Bill, ChartAccount

admin.site.register(Income)

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ("person", "value", "date_due", "status", "event")
    search_fields = ("person__name", "doc_number")
    list_filter = ("status", "date_due")

@admin.register(ChartAccount)
class ChartAccountAdmin(admin.ModelAdmin):
    list_display = ("code", "description")
    search_fields = ("code", "description")