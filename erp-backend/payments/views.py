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
    List payment orders belonging to the logged-in user in descending order (most recent first).
    """
    orders = PaymentOrder.objects.filter(user=request.user).order_by("-date")  # Order by date descending
    serializer = PaymentOrderSerializer(orders, many=True)
    
    return Response({"message": "Ordens de pagamento recuperadas com sucesso", "orders": serializer.data}, status=200)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_bill(request):
    """
    Create a new bill linked to the specified person.
    """
    data = request.data.copy()
    data["user"] = request.user.id  # Link order to logged-in user

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
    bills = Bill.objects.filter(user=request.user).order_by("date_due")  # Order by date ascending
    serializer = BillSerializer(bills, many=True)
    
    return Response({"message": "Contas recuperadas com sucesso", "bills": serializer.data}, status=status.HTTP_200_OK)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_bill(request, bill_id):
    """
    Update an existing bill. The user must own the bill.
    Supports both full (PUT) and partial (PATCH) updates.
    """
    try:
        bill = Bill.objects.get(id=bill_id, user=request.user)  # Ensure the bill belongs to the user
    except Bill.DoesNotExist:
        return Response({"message": "Conta não encontrada"}, status=status.HTTP_404_NOT_FOUND)

    serializer = BillSerializer(bill, data=request.data, partial=True)  # Allow partial updates
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Conta atualizada com sucesso", "bill": serializer.data}, status=status.HTTP_200_OK)
    
    return Response({"message": "Erro ao atualizar conta", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_income(request, income_id):
    """
    Update an existing income. The user must own the income.
    Supports both full (PUT) and partial (PATCH) updates.
    """
    try:
        income = Income.objects.get(id=income_id, user=request.user)  # Ensure the income belongs to the user
    except Income.DoesNotExist:
        return Response({"message": "Conta não encontrada"}, status=status.HTTP_404_NOT_FOUND)

    serializer = IncomeSerializer(income, data=request.data, partial=True)  # Allow partial updates
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Conta atualizada com sucesso", "income": serializer.data}, status=status.HTTP_200_OK)
    
    return Response({"message": "Erro ao atualizar conta", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_income(request):
    """
    Create a new income entry.
    """
    data = request.data.copy()
    data["user"] = request.user.id  # Link order to logged-in user

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
    incomes = Income.objects.filter(user=request.user).order_by("date_due")
    serializer = IncomeSerializer(incomes, many=True)
    
    return Response({"message": "Recebimentos recuperados com sucesso", "incomes": serializer.data}, status=status.HTTP_200_OK)
