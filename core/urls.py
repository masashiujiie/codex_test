from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    path("", views.index, name="index"),  # トップページ（ダッシュボード）
    path("pr/", views.pr_info, name="pr_info"),  # デモ用PR説明ページ
    path("pr/<str:pr_id>/", views.pr_detail, name="pr_detail"),  # 個別PR詳細（存在しないIDは404）
    path("api/tasks/", views.tasks_api, name="tasks_api"),  # タスク一覧を返す簡易API
]
