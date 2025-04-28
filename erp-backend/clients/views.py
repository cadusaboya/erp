from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Client, Supplier
from .serializers import ClientSerializer, SupplierSerializer

class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params

        queryset = Client.objects.filter(user=user)

        name = params.get("name")
        cpf_cnpj = params.get("cpf_cnpj")
        email = params.get("email")
        telephone = params.get("telephone")

        if name:
            queryset = queryset.filter(name__icontains=name)
        if cpf_cnpj:
            queryset = queryset.filter(cpf_cnpj__icontains=cpf_cnpj)
        if email:
            queryset = queryset.filter(email__icontains=email)
        if telephone:
            queryset = queryset.filter(telephone__icontains=telephone)

        return queryset.order_by("-id")

    def perform_create(self, serializer):
        # Associate the new supplier with the authenticated user
        serializer.save(user=self.request.user)

class SupplierViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params

        queryset = Supplier.objects.filter(user=user)

        name = params.get("name")
        cpf_cnpj = params.get("cpf_cnpj")
        email = params.get("email")
        telephone = params.get("telephone")

        if name:
            queryset = queryset.filter(name__icontains=name)
        if cpf_cnpj:
            queryset = queryset.filter(cpf_cnpj__icontains=cpf_cnpj)
        if email:
            queryset = queryset.filter(email__icontains=email)
        if telephone:
            queryset = queryset.filter(telephone__icontains=telephone)

        return queryset.order_by("-id")

    def perform_create(self, serializer):
        # Associate the new supplier with the authenticated user
        serializer.save(user=self.request.user)
