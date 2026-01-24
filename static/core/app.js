// ページのDOMが読み込まれてからスクリプトを実行する
document.addEventListener("DOMContentLoaded", () => {
  // メモの最大文字数
  const MAX_NOTE_LENGTH = 220; // 220文字以上はエラーにする
  // localStorageでメモを保存する際のキー
  const STORAGE_KEY = "codex_review_notes"; // 保存・読み出しで同じキーを使う
  // 画面内の要素をまとめて取得しておく
  const refreshBtn = document.getElementById("refresh"); // 「APIから再取得」ボタン
  const taskList = document.getElementById("task-list"); // タスク一覧のul
  const template = document.getElementById("task-template"); // タスク表示用テンプレート
  const noteForm = document.getElementById("note-form"); // メモ入力フォーム
  const notes = document.getElementById("notes"); // メモ表示用のul
  const statusFilter = document.getElementById("status-filter"); // ステータス絞り込みセレクトボックス
  const feedback = document.getElementById("feedback"); // ステータスメッセージを表示するp
  const noteCount = document.getElementById("note-count"); // 文字数カウンター
  let savedNotes = []; // 画面内で扱うメモ配列（localStorageから読み書きする）

  // 画面上部にステータスメッセージを表示する（エラー時は色を赤に）
  function showFeedback(message, isError = false) {
    if (!feedback) return; // 要素が見つからない場合は何もしない
    feedback.textContent = message; // メッセージ本文を差し込む
    feedback.style.color = isError ? "#f87171" : "var(--muted)"; // エラー時だけ赤系の色にする
  }

  // localStorageに保存されたメモを取り出す。JSON.parseに失敗したら空配列を返す
  function readNotesFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY); // 保存済み文字列を取得
      return raw ? JSON.parse(raw) : []; // JSONに復元し、ない場合は空配列
    } catch (error) {
      console.warn("メモの読み込みに失敗しました", error); // 想定外の例外をログに出す
      return []; // 壊れたデータの場合も安全に空配列を返す
    }
  }

  // メモ配列をlocalStorageへ保存する。失敗してもアプリは落とさない
  function persistNotes(notesToSave) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notesToSave)); // 配列を文字列化して保存
    } catch (error) {
      console.warn("メモの保存に失敗しました", error); // 容量オーバーなどの例外を捕捉
    }
  }

  // テキストエリアの文字数カウンターを更新する。9割超えたら警告色
  function updateNoteCount(value = "") {
    if (!noteCount) return; // カウンター要素がなければスキップ
    const length = value.trim().length; // 先頭末尾の空白を除いてカウント
    noteCount.textContent = `${length}/${MAX_NOTE_LENGTH}`; // 例: "37/220" の形式で表示
    noteCount.style.color = length > MAX_NOTE_LENGTH * 0.9 ? "#fcd34d" : "var(--muted)"; // 9割超えで色を変える
  }

  // メモ一覧を描画する（空の場合は案内文を出す）
  function renderNotes() {
    if (!notes) return; // ULが存在しない場合は描画しない
    notes.innerHTML = ""; // 既存の子要素をすべてクリア

    if (!savedNotes.length) {
      const li = document.createElement("li"); // 空状態用の行
      li.className = "empty"; // スタイル用クラス
      li.textContent = "まだメモはありません。レビュー時のメモ取りに使ってください。"; // 案内文
      notes.appendChild(li); // リストに追加
      return; // 以降の描画は不要
    }

    // 保存済みメモを1件ずつリストに追加
    savedNotes.forEach((note) => {
      const li = document.createElement("li"); // メモ1件分のli
      const wrapper = document.createElement("div"); // テキストとメタ情報を囲うdiv
      wrapper.className = "note-body"; // スタイル用クラス

      const text = document.createElement("p"); // 本文表示
      text.className = "note-text"; // 本文用クラス
      text.textContent = note.text; // 保存していたテキストを反映

      const meta = document.createElement("p"); // メタ情報表示
      meta.className = "note-meta"; // メタ用クラス
      const timestamp = note.createdAt ? new Date(note.createdAt) : new Date(); // 保存時刻がなければ現在時刻
      meta.textContent = `保存: ${timestamp.toLocaleString()}`; // ローカライズした日時を表示

      wrapper.appendChild(text); // 本文をラッパーに追加
      wrapper.appendChild(meta); // メタ情報も追加

      const deleteBtn = document.createElement("button"); // 削除ボタン生成
      deleteBtn.type = "button"; // フォーム送信を防ぐためbutton型
      deleteBtn.className = "note-delete"; // スタイル用クラス
      deleteBtn.textContent = "削除"; // ボタンラベル
      deleteBtn.addEventListener("click", () => {
        savedNotes = savedNotes.filter((item) => item.id !== note.id); // 削除対象だけ除外
        persistNotes(savedNotes); // 保存
        renderNotes(); // 画面を再描画
      });

      li.appendChild(wrapper); // 本文＋メタをliに追加
      li.appendChild(deleteBtn); // 削除ボタンを追加
      notes.appendChild(li); // 完成したliを一覧に追加
    });
  }

  // ページ初期表示時にlocalStorageからメモを復元
  function hydrateNotes() {
    savedNotes = readNotesFromStorage(); // localStorageから最新の配列を取得
    renderNotes(); // 取得したデータで描画
  }

  // APIからタスクを再取得し、一覧に反映する
  async function refreshTasks() {
    if (!taskList || !template || !refreshBtn) return; // 必要要素が揃っていなければ何もしない
    refreshBtn.disabled = true; // 二重押し防止
    refreshBtn.textContent = "再取得中..."; // ローディング表示
    const status = statusFilter?.value || ""; // 絞り込み条件
    const query = status ? `?status=${encodeURIComponent(status)}` : ""; // URLクエリ文字列

    try {
      const response = await fetch(`/api/tasks/${query}`); // API呼び出し
      const body = await response.json(); // JSONへパース

      if (!response.ok) {
        const detail = body?.error ? ` (${body.error})` : "";
        throw new Error(`APIリクエストが失敗しました${detail}`);
      }

      const { tasks } = body; // タスク配列を取り出す
      renderTasks(tasks, status); // 画面を更新
      showFeedback(
        tasks.length ? `${tasks.length}件を表示中${status ? `（${status}）` : ""}` : "該当するタスクはありません"
      );
    } catch (error) {
      console.error("タスクの再取得に失敗しました", error);
      showFeedback("再取得に失敗しました。時間をおいて再度お試しください。", true);
    } finally {
      refreshBtn.disabled = false; // ボタンを戻す
      refreshBtn.textContent = "APIから再取得";
    }
  }

  // タスク配列を受け取り、テンプレートを使って描画する
  function renderTasks(tasks, status) {
    taskList.innerHTML = ""; // いったん中身を空にする（前回の表示をリセット）

    if (!tasks.length) {
      const li = document.createElement("li"); // 空表示用li
      li.className = "task empty"; // スタイル指定
      li.textContent = status ? `「${status}」のタスクはありません` : "タスクはまだありません。"; // メッセージ
      taskList.appendChild(li); // リストに追加
      return; // 以降の処理は不要
    }

    tasks.forEach((task) => {
      const node = template.content.cloneNode(true); // template内の要素を複製（deep clone）
      node.querySelector(".task-title").textContent = task.title; // タイトルを反映
      node.querySelector(".task-meta").textContent = `担当: ${task.owner} · 状態: ${task.status}`; // メタ情報を整形
      const link = node.querySelector(".task-link"); // a要素を取得
      link.href = task.url; // PRへのリンク設定
      taskList.appendChild(node); // 完成したノードをリストへ追加
    });
  }

  // ボタンクリックとセレクト変更でAPIを再取得
  refreshBtn?.addEventListener("click", refreshTasks);
  statusFilter?.addEventListener("change", refreshTasks); // セレクト変更でも再取得

  // メモ送信時のバリデーションと保存処理
  noteForm?.addEventListener("submit", (event) => {
    event.preventDefault(); // ページリロードを防止
    const textarea = noteForm.querySelector("textarea"); // 入力欄を取得
    const text = textarea.value.trim(); // 前後スペースを除去した文字列

    if (!text) {
      showFeedback("メモが空です。内容を入力してください。", true);
      return;
    }

    if (text.length > MAX_NOTE_LENGTH) {
      showFeedback(`メモは${MAX_NOTE_LENGTH}文字以内にしてください。`, true);
      return;
    }

    const entry = {
      // 可能ならcrypto.randomUUIDを使い、なければ時刻＋乱数で簡易IDを生成
      id:
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text, // 入力内容そのまま
      createdAt: new Date().toISOString(), // 保存時刻
    };

    savedNotes = [entry, ...savedNotes].slice(0, 50); // 新しいメモを先頭に追加し最大50件に制限
    persistNotes(savedNotes); // localStorageへ保存
    renderNotes(); // 画面を更新
    textarea.value = ""; // 入力欄をクリア
    updateNoteCount(""); // カウンターをリセット
    showFeedback("メモを保存しました。"); // 成功メッセージ
  });

  // 入力しながら文字数カウンターを更新
  noteForm?.querySelector("textarea")?.addEventListener("input", (event) => {
    updateNoteCount(event.target.value); // 現在の文字数を表示
  });

  // 初期表示：メモ復元とカウンター表示
  hydrateNotes(); // localStorageからメモを復元して描画
  updateNoteCount(noteForm?.querySelector("textarea")?.value || ""); // 既存入力があればその文字数を表示
});
