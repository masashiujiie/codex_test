from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Final

from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render


@dataclass(frozen=True)
class Task:
    title: str
    owner: str
    status: str
    url: str


TASKS: Final[tuple[Task, ...]] = (
    Task(
        title="CI スモークテストを追加",
        owner="Alex",
        status="レビュー中",
        url="https://example.com/pr/101",
    ),
    Task(
        title="CORS 設定を厳格化",
        owner="Jamie",
        status="マージ可能",
        url="https://example.com/pr/102",
    ),
    Task(
        title="空データの表示を改善",
        owner="Riley",
        status="修正あり",
        url="https://example.com/pr/103",
    ),
)


def index(request: HttpRequest) -> HttpResponse:
    return render(request, "core/index.html", {"tasks": TASKS})


def tasks_api(request: HttpRequest) -> JsonResponse:
    payload = [asdict(task) for task in TASKS]
    return JsonResponse({"tasks": payload})
