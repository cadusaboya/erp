from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Company

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'cnpj', 'created_at')
    search_fields = ('name', 'cnpj')
    ordering = ('name',)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Add 'company' and 'role' to list display
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')
    ordering = ('username',)

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {'fields': ('role')}),
    )
