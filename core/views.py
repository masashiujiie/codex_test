from __future__ import annotations

from dataclasses import asdict, dataclass  # dataclassを辞書化するために使用
from typing import Final  # 不変タプルを明示するための型ヒント

from django.http import HttpRequest, HttpResponse, JsonResponse  # 各種HTTPレスポンスを生成
from django.shortcuts import render  # テンプレート描画ヘルパー


@dataclass(frozen=True)  # イミュータブルなPRタスクのデータモデル
class Task:
    pr_id: str  # PR番号。URLパラメータと一致させる
    title: str  # 表示用のタイトル。タスク一覧と詳細で出す
    owner: str  # 担当者名。メタ情報表示に利用
    status: str  # ステータス。フィルターやラベルに使う
    url: str  # 詳細ページへのURL。フロントがそのままリンクに使う


# タスク情報を固定データとして持たせておき、APIやビューで使い回す（DBの代わり）
TASKS: Final[tuple[Task, ...]] = (
    Task(
        pr_id="101",  # 一意のID
        title="CI スモークテストを追加",  # 画面で見せるタイトル
        owner="Alex",  # 担当者
        status="レビュー中",  # 現在の状態
        url="/pr/101/",  # 詳細ページへのリンク
    ),
    Task(
        pr_id="102",  # ID
        title="CORS 設定を厳格化",  # タイトル
        owner="Jamie",  # 担当者
        status="マージ可能",  # 状態
        url="/pr/102/",  # リンク
    ),
    Task(
        pr_id="103",  # ID
        title="空データの表示を改善",  # タイトル
        owner="Riley",  # 担当者
        status="修正あり",  # 状態
        url="/pr/103/",  # リンク
    ),
)

# タスクのステータス一覧を事前計算して再利用する
STATUS_SET: Final[set[str]] = {task.status for task in TASKS}
STATUSES: Final[tuple[str, ...]] = tuple(sorted(STATUS_SET))
TASKS_BY_ID: Final[dict[str, Task]] = {task.pr_id: task for task in TASKS}  # ID検索をO(1)にする辞書
ALLOWED_TASKS_API_PARAMS: Final[frozenset[str]] = frozenset({"status"})  # tasks_apiで受け付けるクエリパラメータをホワイトリスト化


def index(request: HttpRequest) -> HttpResponse:
    # トップページを表示。事前計算済みのステータス一覧をフィルターに渡す
    return render(request, "core/index.html", {"tasks": TASKS, "statuses": STATUSES})


INFO_DESCRIPTION = (
    "ここは教材・デモ用のプレースホルダーです。実プロダクトのPRはこのURLでは公開されません。"
)  # PR情報ページで使い回す説明文


def pr_info(request: HttpRequest) -> HttpResponse:
    # ダミーのPR情報ページ。実際のPRは存在しないことを案内する
    return render(
        request,
        "core/pr.html",  # 利用テンプレート
        {
            "title": "PR プレビューについて",  # ページ見出し
            "description": INFO_DESCRIPTION,  # 説明文
        },
    )


def pr_detail(request: HttpRequest, pr_id: str) -> HttpResponse:
    # 指定されたIDのタスクを探し、見つかれば詳細を表示。なければ404ページを返す
    task = TASKS_BY_ID.get(pr_id)  # ID一致のタスクをO(1)で取得
    if not task:
        return render(
            request,
            "core/pr.html",  # 共通テンプレートを流用
            {
                "title": "PR が見つかりませんでした",  # 404用タイトル
                "description": "指定されたPR IDは存在しないか、デモ用データに含まれていません。ダッシュボードに戻って別のPRを選択してください。",  # 案内文
                "back_link": True,  # 戻るリンクを表示するフラグ
            },
            status=404,  # HTTPステータスを404にする
        )

    return render(
        request,
        "core/pr.html",  # 詳細ページも同じテンプレートを使用
        {
            "title": f"PR {task.pr_id}: {task.title}",  # 見出しにIDとタイトルを埋め込む
            "description": (
                "これはデモ用のPRプレビューです。実際のリポジトリにはこのURLではアクセスできません。"
                "概要やテスト結果はPR本文に、スクリーンショットはPR添付に記載してください。"
            ),  # 固定の案内文
            "task": task,  # テンプレートで詳細表示に使うタスクデータ
            "back_link": True,  # 戻るリンクを表示する
        },
    )


def tasks_api(request: HttpRequest) -> JsonResponse:
    # GETクエリの許可パラメータを検証し、必要ならフィルタしたリストを返す
    unknown_params = set(request.GET.keys()) - ALLOWED_TASKS_API_PARAMS  # 許可されていないパラメータを検出し早期リターン
    if unknown_params:
        return JsonResponse(
            {
                "error": f"Unknown parameters: {', '.join(sorted(unknown_params))}",  # 不許可のパラメータ名を列挙
                "allowed_parameters": sorted(ALLOWED_TASKS_API_PARAMS),  # 許可リストを返してクライアントが修正しやすくする
            },
            status=400,
        )

    status_filter = request.GET.get("status")  # クエリ文字列からステータス値を取得

    if status_filter and status_filter not in STATUS_SET:
        return JsonResponse(
            {
                "error": f"Unknown status '{status_filter}'",  # 不正値のエラーメッセージ
                "allowed_statuses": STATUSES,  # 許可リストも返してクライアントが修正しやすくする
            },
            status=400,
        )

    filtered_tasks = (
        [task for task in TASKS if task.status == status_filter] if status_filter else list(TASKS)
    )  # ステータス指定があれば一致するものだけ返す。なければ全件
    payload = [asdict(task) for task in filtered_tasks]  # dataclassを辞書に変換してシリアライズ可能にする
    return JsonResponse({"tasks": payload})  # JSONとしてレスポンス
