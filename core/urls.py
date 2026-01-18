from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.index, name="index"),
    path("api/tasks/", views.tasks_api, name="tasks_api"),
]
