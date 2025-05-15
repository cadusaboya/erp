from rest_framework.exceptions import ValidationError
from accounts.models import Company

def get_company_or_404(request):
    company_id = request.headers.get("X-Company-ID")
    if not company_id:
        raise ValidationError({"detail": "Company ID not provided."})

    try:
        return Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        raise ValidationError({"detail": "Company not found."})