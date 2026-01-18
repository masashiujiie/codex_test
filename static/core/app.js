document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refresh");
  const taskList = document.getElementById("task-list");
  const template = document.getElementById("task-template");
  const noteForm = document.getElementById("note-form");
  const notes = document.getElementById("notes");

  async function refreshTasks() {
    if (!taskList || !template || !refreshBtn) return;
    refreshBtn.disabled = true;
    refreshBtn.textContent = "再取得中...";
    try {
      const response = await fetch("/api/tasks/");
      const { tasks } = await response.json();
      renderTasks(tasks);
    } catch (error) {
      console.error("タスクの再取得に失敗しました", error);
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = "APIから再取得";
    }
  }

  function renderTasks(tasks) {
    taskList.innerHTML = "";
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
