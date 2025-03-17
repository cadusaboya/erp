from rest_framework import status, viewsets  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from .models import Entry, Bill, Income
from .serializers import EntrySerializer, BillSerializer, IncomeSerializer

class EntryViewSet(viewsets.ModelViewSet):
    serializer_class = EntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure only Bills associated with the authenticated user are returned
        return Entry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the new Bill with the authenticated user
        serializer.save(user=self.request.user)

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
        