from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, SupplierViewSet
from django.urls import path, include

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'suppliers', SupplierViewSet, basename='supplier')

urlpatterns = [
    path('', include(router.urls)),
    # Other URL patterns can be added here
]
