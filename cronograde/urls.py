from django.urls import path
from . import views

app_name = "cronograde"

urlpatterns = [
    path("", views.home_view, name="home"),
    path("sobre/", views.about_view, name="about"),
    path("planner/", views.planner_view, name="planner"),
    path("subjects/", views.subjects_view, name="subjects"),
    path("process-schedule/", views.process_schedule, name="process_schedule"),
    path("results/", views.results_base_view, name="results_base"),
    path("results/<int:rank>/", views.results_view, name="results"),
]
