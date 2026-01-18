from django.test import Client, TestCase
from django.urls import reverse


class CoreViewsTests(TestCase):
    def setUp(self) -> None:
        self.client = Client()

    def test_index_page_loads(self) -> None:
        response = self.client.get(reverse("core:index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "PRダッシュボード")

    def test_tasks_api_returns_data(self) -> None:
        response = self.client.get(reverse("core:tasks_api"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("tasks", data)
        self.assertGreaterEqual(len(data["tasks"]), 1)
        self.assertIn("title", data["tasks"][0])

    def test_tasks_api_filters_by_status(self) -> None:
        response = self.client.get(reverse("core:tasks_api"), {"status": "修正あり"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        tasks = data["tasks"]
        self.assertTrue(all(task["status"] == "修正あり" for task in tasks))
        self.assertGreaterEqual(len(tasks), 1)

    def test_tasks_api_rejects_unknown_status(self) -> None:
        response = self.client.get(reverse("core:tasks_api"), {"status": "unknown"})
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("error", data)

    def test_pr_placeholder_page_is_japanese(self) -> None:
        response = self.client.get(reverse("core:pr_info"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "PR プレビューについて")
        self.assertContains(response, "教材・デモ用のプレースホルダー")

    def test_pr_detail_page_shows_task_info(self) -> None:
        response = self.client.get(reverse("core:pr_detail", args=["101"]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "PR 101")
        self.assertContains(response, "担当")

    def test_pr_detail_returns_404_for_unknown_id(self) -> None:
        response = self.client.get(reverse("core:pr_detail", args=["999"]))
        self.assertContains(response, "PR が見つかりませんでした", status_code=404)
