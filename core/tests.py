from django.test import Client, TestCase
from django.urls import reverse


class CoreViewsTests(TestCase):
    def setUp(self) -> None:
        # テスト用クライアントを毎回初期化
        self.client = Client()

    def test_index_page_loads(self) -> None:
        # トップページが200で表示され、タイトル文言が含まれること
        response = self.client.get(reverse("core:index"))  # GET /
        self.assertEqual(response.status_code, 200)  # ステータス200
        self.assertContains(response, "PRダッシュボード")  # タイトルが入っている

    def test_tasks_api_returns_data(self) -> None:
        # APIがタスク配列を返し、要素が1件以上あること
        response = self.client.get(reverse("core:tasks_api"))  # GET /api/tasks/
        self.assertEqual(response.status_code, 200)  # ステータス200
        data = response.json()  # JSONを辞書化
        self.assertIn("tasks", data)  # tasksキーがある
        self.assertGreaterEqual(len(data["tasks"]), 1)  # 1件以上返る
        self.assertIn("title", data["tasks"][0])  # 1件目にtitleがある

    def test_tasks_api_filters_by_status(self) -> None:
        # statusパラメータでフィルタした結果のみ返ること
        response = self.client.get(reverse("core:tasks_api"), {"status": "修正あり"})  # クエリ付き
        self.assertEqual(response.status_code, 200)  # ステータス200
        data = response.json()
        tasks = data["tasks"]
        self.assertTrue(all(task["status"] == "修正あり" for task in tasks))  # すべて指定ステータス
        self.assertGreaterEqual(len(tasks), 1)  # 1件以上

    def test_tasks_api_rejects_unknown_status(self) -> None:
        # 未知のステータスは400エラーになること
        response = self.client.get(reverse("core:tasks_api"), {"status": "unknown"})  # 不正なステータス
        self.assertEqual(response.status_code, 400)  # ステータス400
        data = response.json()
        self.assertIn("error", data)  # エラーメッセージがある

    def test_pr_placeholder_page_is_japanese(self) -> None:
        # PR説明ページが日本語文言を含むこと
        response = self.client.get(reverse("core:pr_info"))  # GET /pr/
        self.assertEqual(response.status_code, 200)  # ステータス200
        self.assertContains(response, "PR プレビューについて")  # タイトル文言
        self.assertContains(response, "教材・デモ用のプレースホルダー")  # 説明文

    def test_pr_detail_page_shows_task_info(self) -> None:
        # 既存IDのPR詳細が200で表示され、担当者情報を含むこと
        response = self.client.get(reverse("core:pr_detail", args=["101"]))  # 既存ID
        self.assertEqual(response.status_code, 200)  # ステータス200
        self.assertContains(response, "PR 101")  # PR IDが表示される
        self.assertContains(response, "担当")  # 担当者情報がある

    def test_pr_detail_returns_404_for_unknown_id(self) -> None:
        # 存在しないIDは404で案内メッセージを返すこと
        response = self.client.get(reverse("core:pr_detail", args=["999"]))  # 不存在ID
        self.assertContains(response, "PR が見つかりませんでした", status_code=404)  # 404と案内文
