from rest_framework import status, viewsets  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from .models import Bill, Income
from .serializers import BillSerializer, IncomeSerializer

class BillViewSet(viewsets.ModelViewSet):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure only Bills associated with the authenticated user are returned
        return Bill.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the new Bill with the authenticated user
        serializer.save(user=self.request.user)

class IncomeViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure only Incomes associated with the authenticated user are returned
        return Income.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the new Income with the authenticated user
        serializer.save(user=self.request.user)
        
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def combined_extract(request):
    # Fetch paid Bills
    bills = Bill.objects.filter(user=request.user, status="pago")
    # Fetch paid Incomes
    incomes = Income.objects.filter(user=request.user, status="pago")

    # Serialize both
    bills_data = BillSerializer(bills, many=True).data
    incomes_data = IncomeSerializer(incomes, many=True).data

    # Add "type" field to differentiate
    for b in bills_data:
        b["type"] = "Despesa"
    for i in incomes_data:
        i["type"] = "Receita"

    # Combine and sort by date (optional)
    combined = bills_data + incomes_data
    combined.sort(key=lambda x: x["date_due"])  # Or "date"

    return Response({"orders": combined})