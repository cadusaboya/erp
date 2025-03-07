from rest_framework import status  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from .models import PaymentOrder
from .serializers import PaymentOrderSerializer

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
