# accounts/utils.py
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import Company

def get_current_company(request):
    company_id = request.query_params.get("company_id")
    if not company_id:
        raise ValidationError("company_id is required in query params")

    try:
        return Company.objects.get(id=company_id, user=request.user)
    except Company.DoesNotExist:
        raise PermissionDenied("You do not have access to this company")