from rest_framework import status  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from .models import PaymentOrder, Bill, Income
from .serializers import PaymentOrderSerializer, BillSerializer, IncomeSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_payment_order(request):
    """
    Create a new payment order linked to the logged-in user.
    """
    data = request.data.copy()
    data["user"] = request.user.id  # Link order to logged-in user

    serializer = PaymentOrderSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response({"message": "Ordem de pagamento criada com sucesso", "order": serializer.data}, status=status.HTTP_201_CREATED)
    
    return Response({"message": "Erro ao criar ordem de pagamento", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_payment_orders(request):
    """
    List payment orders belonging to the logged-in user.
    """
    orders = PaymentOrder.objects.filter(user=request.user)
    serializer = PaymentOrderSerializer(orders, many=True)
    
    return Response({"message": "Ordens de pagamento recuperadas com sucesso", "orders": serializer.data}, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_bill(request):
    """
    Create a new bill linked to the specified person.
    """
    data = request.data.copy()
    
    serializer = BillSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Conta criada com sucesso", "bill": serializer.data}, status=status.HTTP_201_CREATED)
    
    return Response({"message": "Erro ao criar conta", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_bills(request):
    """
    List all bills.
    """
    bills = Bill.objects.all()
    serializer = BillSerializer(bills, many=True)
    
    return Response({"message": "Contas recuperadas com sucesso", "bills": serializer.data}, status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_income(request):
    """
    Create a new income entry.
    """
    data = request.data.copy()
    
    serializer = IncomeSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Recebimento criado com sucesso", "income": serializer.data}, status=status.HTTP_201_CREATED)
    
    return Response({"message": "Erro ao criar recebimento", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_incomes(request):
    """
    List all incomes.
    """
    incomes = Income.objects.all()
    serializer = IncomeSerializer(incomes, many=True)
    
    return Response({"message": "Recebimentos recuperados com sucesso", "incomes": serializer.data}, status=status.HTTP_200_OK)
