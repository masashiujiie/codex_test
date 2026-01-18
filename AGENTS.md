# AGENTS.md — Codex用PRレビュー方針

## Purpose
Codex が本リポジトリの PR をレビューするときの行動規範・チェックリスト。Codex の出力は必ず日本語とする。

## Scope
- 対象: 本リポジトリのコード/ドキュメント/インフラ設定
- 例外: 緊急リリース時はメンテナ承認で簡略化可

## Roles
- Author: 変更を小さく分割し、再現手順、テスト結果、リスク、スクショ/動画を PR に記載
- Reviewer (Codex): 24h 以内に一次応答。具体的提案でフィードバックし、日本語で回答
- Maintainer: 最終判断・マージ担当

## PR Template 要求
- 変更概要 / 変更タイプ (feat/fix/docs/refactor/chore)
- テスト結果 (実行コマンド/要約ログ)
- リスク・影響範囲・ロールバック方法
- スクショ/動画 (UI 変更時)
- 関連 Issue/チケットリンク

## Review Checklist
- 仕様整合 / リグレッションなし
- テスト追加・実行 / CI 通過
- セキュリティ (入力バリデーション/認可)
- パフォーマンス・可観測性 (ログ/メトリクス)
- 後方互換性 (API, config, migration)
- ドキュメント更新

## Communication
- 具体的・建設的コメント。個人攻撃禁止
- 不一致時はメンテナにエスカレーション
- Codex は日本語で回答

## Merge Policy
- マージ操作はメンテナが PR 画面で手動実施。Codex の「merge 推奨」は推奨のみで自動マージしない
- マージ方式: Squash 推奨だが、コミット履歴を残したい場合は通常の Merge を選択。緊急時はメンテナ判断で例外可

## Labels
- needs-review / changes-requested / ready-to-merge / blocked / security / breaking-change など、運用するラベルの意味を合わせて使う
