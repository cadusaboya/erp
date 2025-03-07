from rest_framework import status  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from .models import Client
from .serializers import ClientSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_client(request):
    """
    Create a new client linked to the logged-in user.
    """
    data = request.data.copy()
    data["user"] = request.user.id  # Link client to logged-in user

    serializer = ClientSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response({"message": "Cliente criado com sucesso", "client": serializer.data}, status=status.HTTP_201_CREATED)
    
    return Response({"message": "Erro ao criar cliente", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_clients(request):
    """
    List clients belonging to the logged-in user.
    """
    clients = Client.objects.filter(user=request.user)
    serializer = ClientSerializer(clients, many=True)
    
    return Response({"message": "Clientes recuperados com sucesso", "clients": serializer.data}, status=status.HTTP_200_OK)
