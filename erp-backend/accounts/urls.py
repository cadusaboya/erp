from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path("companies/", views.list_user_companies, name="list_user_companies"),
]