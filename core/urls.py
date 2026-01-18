from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.index, name="index"),
    path("pr/", views.pr_info, name="pr_info"),
    path("pr/<str:pr_id>/", views.pr_detail, name="pr_detail"),
    path("api/tasks/", views.tasks_api, name="tasks_api"),
]
