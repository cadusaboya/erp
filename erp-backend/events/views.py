from rest_framework import status  # type: ignore
from rest_framework.decorators import api_view, permission_classes  # type: ignore
from rest_framework.response import Response  # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore
from .models import Event
from .serializers import EventSerializer

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_event(request):
    """
    Create a new event linked to the logged-in user.
    """
    data = request.data.copy()
    data["user"] = request.user.id  # Link event to logged-in user

    serializer = EventSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response({"message": "Evento criado com sucesso", "event": serializer.data}, status=status.HTTP_201_CREATED)
    
    return Response({"message": "Erro ao criar evento", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_events(request):
    """
    List events belonging to the logged-in user.
    """
    events = Event.objects.filter(user=request.user)
    serializer = EventSerializer(events, many=True)
    
    return Response({"message": "Eventos recuperados com sucesso", "events": serializer.data}, status=status.HTTP_200_OK)
