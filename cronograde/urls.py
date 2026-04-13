from django.urls import path
from . import views

urlpatterns = [
    path("", views.home_view, name="home"),
    path("api/subjects/", views.api_subjects, name="api_subjects"),
    path("api/optimize/", views.api_optimize, name="api_optimize"),
]
