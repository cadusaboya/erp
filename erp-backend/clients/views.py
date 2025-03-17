from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Client, Supplier
from .serializers import ClientSerializer, SupplierSerializer

class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure only suppliers associated with the authenticated user are returned
        return Client.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the new supplier with the authenticated user
        serializer.save(user=self.request.user)

class SupplierViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Ensure only suppliers associated with the authenticated user are returned
        return Supplier.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Associate the new supplier with the authenticated user
        serializer.save(user=self.request.user)
