document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refresh");
  const taskList = document.getElementById("task-list");
  const template = document.getElementById("task-template");
  const noteForm = document.getElementById("note-form");
  const notes = document.getElementById("notes");
  const statusFilter = document.getElementById("status-filter");
  const feedback = document.getElementById("feedback");

  function showFeedback(message, isError = false) {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.style.color = isError ? "#f87171" : "var(--muted)";
  }

  async function refreshTasks() {
    if (!taskList || !template || !refreshBtn) return;
    refreshBtn.disabled = true;
    refreshBtn.textContent = "再取得中...";
    const status = statusFilter?.value || "";
    const query = status ? `?status=${encodeURIComponent(status)}` : "";

    try {
      const response = await fetch(`/api/tasks/${query}`);
      const body = await response.json();

      if (!response.ok) {
        const detail = body?.error ? ` (${body.error})` : "";
        throw new Error(`APIリクエストが失敗しました${detail}`);
      }

      const { tasks } = body;
      renderTasks(tasks, status);
      showFeedback(
        tasks.length ? `${tasks.length}件を表示中${status ? `（${status}）` : ""}` : "該当するタスクはありません"
      );
    } catch (error) {
      console.error("タスクの再取得に失敗しました", error);
      showFeedback("再取得に失敗しました。時間をおいて再度お試しください。", true);
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "APIから再取得";
    }
  }

  function renderTasks(tasks, status) {
    taskList.innerHTML = "";

    if (!tasks.length) {
      const li = document.createElement("li");
      li.className = "task empty";
      li.textContent = status ? `「${status}」のタスクはありません` : "タスクはまだありません。";
      taskList.appendChild(li);
      return;
    }

    tasks.forEach((task) => {
      const node = template.content.cloneNode(true);
      node.querySelector(".task-title").textContent = task.title;
      node.querySelector(".task-meta").textContent = `担当: ${task.owner} · 状態: ${task.status}`;
      const link = node.querySelector(".task-link");
      link.href = task.url;
      taskList.appendChild(node);
    });
  }

  refreshBtn?.addEventListener("click", refreshTasks);
  statusFilter?.addEventListener("change", refreshTasks);

  noteForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const textarea = noteForm.querySelector("textarea");
    if (!textarea.value.trim()) return;
    const li = document.createElement("li");
    const now = new Date().toLocaleTimeString();
    li.textContent = `[${now}] ${textarea.value.trim()}`;
    notes.prepend(li);
    textarea.value = "";
  });
});
