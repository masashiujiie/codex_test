document.addEventListener("DOMContentLoaded", () => {
  const MAX_NOTE_LENGTH = 220;
  const STORAGE_KEY = "codex_review_notes";
  const refreshBtn = document.getElementById("refresh");
  const taskList = document.getElementById("task-list");
  const template = document.getElementById("task-template");
  const noteForm = document.getElementById("note-form");
  const notes = document.getElementById("notes");
  const statusFilter = document.getElementById("status-filter");
  const feedback = document.getElementById("feedback");
  const noteCount = document.getElementById("note-count");
  let savedNotes = [];

  function showFeedback(message, isError = false) {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.style.color = isError ? "#f87171" : "var(--muted)";
  }

  function readNotesFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.warn("メモの読み込みに失敗しました", error);
      return [];
    }
  }

  function persistNotes(notesToSave) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesToSave));
    } catch (error) {
      console.warn("メモの保存に失敗しました", error);
    }
  }

  function updateNoteCount(value = "") {
    if (!noteCount) return;
    const length = value.trim().length;
    noteCount.textContent = `${length}/${MAX_NOTE_LENGTH}`;
    noteCount.style.color = length > MAX_NOTE_LENGTH * 0.9 ? "#fcd34d" : "var(--muted)";
  }

  function renderNotes() {
    if (!notes) return;
    notes.innerHTML = "";

    if (!savedNotes.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "まだメモはありません。レビュー時のメモ取りに使ってください。";
      notes.appendChild(li);
      return;
    }

    savedNotes.forEach((note) => {
      const li = document.createElement("li");
      const wrapper = document.createElement("div");
      wrapper.className = "note-body";

      const text = document.createElement("p");
      text.className = "note-text";
      text.textContent = note.text;

      const meta = document.createElement("p");
      meta.className = "note-meta";
      const timestamp = note.createdAt ? new Date(note.createdAt) : new Date();
      meta.textContent = `保存: ${timestamp.toLocaleString()}`;

      wrapper.appendChild(text);
      wrapper.appendChild(meta);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "note-delete";
      deleteBtn.textContent = "削除";
      deleteBtn.addEventListener("click", () => {
        savedNotes = savedNotes.filter((item) => item.id !== note.id);
        persistNotes(savedNotes);
        renderNotes();
      });

      li.appendChild(wrapper);
      li.appendChild(deleteBtn);
      notes.appendChild(li);
    });
  }

  function hydrateNotes() {
    savedNotes = readNotesFromStorage();
    renderNotes();
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
    const text = textarea.value.trim();

    if (!text) {
      showFeedback("メモが空です。内容を入力してください。", true);
      return;
    }

    if (text.length > MAX_NOTE_LENGTH) {
      showFeedback(`メモは${MAX_NOTE_LENGTH}文字以内にしてください。`, true);
      return;
    }

    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      createdAt: new Date().toISOString(),
    };

    savedNotes = [entry, ...savedNotes].slice(0, 50);
    persistNotes(savedNotes);
    renderNotes();
    textarea.value = "";
    updateNoteCount("");
    showFeedback("メモを保存しました。");
  });

  noteForm?.querySelector("textarea")?.addEventListener("input", (event) => {
    updateNoteCount(event.target.value);
  });

  hydrateNotes();
  updateNoteCount(noteForm?.querySelector("textarea")?.value || "");
});
