from django.urls import path, include
from .views import EventViewSet, EventDetailView, generate_event_pdf, generate_event_accruals_pdf, generate_event_contas_pdf
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'', EventViewSet, basename='event')

urlpatterns = [
    path('', include(router.urls)),
    path('view/<int:id>/', EventDetailView.as_view(), name='event-detail'),
    path('<int:event_id>/pdf/payments/', generate_event_pdf, name='generate_event_pdf'),
    path('<int:event_id>/pdf/accruals/', generate_event_accruals_pdf, name='generate_event_accruals_pdf'),
    path('<int:event_id>/pdf/contas/', generate_event_contas_pdf, name='generate_event_contas_pdf'),
]
