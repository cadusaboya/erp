from rest_framework import status # type: ignore
from rest_framework.decorators import api_view # type: ignore
from rest_framework.response import Response # type: ignore
from django.contrib.auth import authenticate # type: ignore
from django.middleware.csrf import get_token # type: ignore
from .serializers import UserSerializer
from rest_framework.decorators import api_view, permission_classes # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import status # type: ignore
from django.contrib.auth import authenticate # type: ignore
from rest_framework_simplejwt.tokens import RefreshToken # type: ignore
from rest_framework.permissions import AllowAny # type: ignore
from django.utils.encoding import force_str  # type: ignore
from django.shortcuts import redirect # type: ignore
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode # type: ignore
from django.utils.encoding import force_bytes # type: ignore
from django.core.mail import send_mail # type: ignore
from django.http import JsonResponse # type: ignore
from .models import User, Company
from django.contrib.auth.tokens import PasswordResetTokenGenerator # type: ignore
from rest_framework.permissions import IsAuthenticated  # type: ignore

@api_view(['POST'])
def login(request):
    """
    Handle user login.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)
    if user is not None:
        refresh = RefreshToken.for_user(user)
        response_data = {
            'message': 'Login successful',
            'token': str(refresh.access_token),
        }
        return Response(response_data, status=status.HTTP_200_OK)
    else:
        # Check if username exists in the database
        if User.objects.filter(username=username).exists():
            # Username exists, password is incorrect
            response_data = {
                'message': 'Senha incorreta',
            }
        else:
            # Username doesn't exist
            response_data = {
                'message': 'Usuário não encontrado',
            }
        return Response(response_data, status=status.HTTP_401_UNAUTHORIZED)
    
@api_view(['POST'])
def register(request):
        
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        response_data = {'data': serializer.data, 'message': 'User created successfully'}
        return Response(response_data, status=status.HTTP_201_CREATED)
    else:
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_user_companies(request):
    companies = Company.objects.all().values("id", "name")
    return Response(list(companies))