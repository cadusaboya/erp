from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "cpf", "telefone", "password"]
        extra_kwargs = {
            "password": {"write_only": True},
            "cpf": {"required": True},
            "telefone": {"required": True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            cpf=validated_data["cpf"],
            telefone=validated_data["telefone"],
            password=validated_data["password"],
        )
        return user
