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
