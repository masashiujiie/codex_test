from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Final

from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render


@dataclass(frozen=True)
class Task:
    pr_id: str
    title: str
    owner: str
    status: str
    url: str


TASKS: Final[tuple[Task, ...]] = (
    Task(
        pr_id="101",
        title="CI スモークテストを追加",
        owner="Alex",
        status="レビュー中",
        url="/pr/101/",
    ),
    Task(
        pr_id="102",
        title="CORS 設定を厳格化",
        owner="Jamie",
        status="マージ可能",
        url="/pr/102/",
    ),
    Task(
        pr_id="103",
        title="空データの表示を改善",
        owner="Riley",
        status="修正あり",
        url="/pr/103/",
    ),
)


def index(request: HttpRequest) -> HttpResponse:
    statuses = sorted({task.status for task in TASKS})
    return render(request, "core/index.html", {"tasks": TASKS, "statuses": statuses})


INFO_DESCRIPTION = "ここは教材・デモ用のプレースホルダーです。実プロダクトのPRはこのURLでは公開されません。"


def pr_info(request: HttpRequest) -> HttpResponse:
    return render(request, "core/pr.html", {"title": "PR プレビューについて", "description": INFO_DESCRIPTION})


def pr_detail(request: HttpRequest, pr_id: str) -> HttpResponse:
    task = next((task for task in TASKS if task.pr_id == pr_id), None)
    if not task:
        return render(
            request,
            "core/pr.html",
            {
                "title": "PR が見つかりませんでした",
                "description": "指定されたPR IDは存在しないか、デモ用データに含まれていません。ダッシュボードに戻って別のPRを選択してください。",
                "back_link": True,
            },
            status=404,
        )

    return render(
        request,
        "core/pr.html",
        {
            "title": f"PR {task.pr_id}: {task.title}",
            "description": (
                "これはデモ用のPRプレビューです。実際のリポジトリにはこのURLではアクセスできません。"
                "概要やテスト結果はPR本文に、スクリーンショットはPR添付に記載してください。"
            ),
            "task": task,
            "back_link": True,
        },
    )


def tasks_api(request: HttpRequest) -> JsonResponse:
    allowed_statuses = {task.status for task in TASKS}
    status_filter = request.GET.get("status")

    if status_filter and status_filter not in allowed_statuses:
        return JsonResponse(
            {"error": f"Unknown status '{status_filter}'", "allowed_statuses": sorted(allowed_statuses)},
            status=400,
        )

    filtered_tasks = (
        [task for task in TASKS if task.status == status_filter] if status_filter else list(TASKS)
    )
    payload = [asdict(task) for task in filtered_tasks]
    return JsonResponse({"tasks": payload})
