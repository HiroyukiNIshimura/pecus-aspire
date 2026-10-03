## ドキュメント索引

このディレクトリ内のドキュメント一覧と簡単な説明です。ファイル名をクリックして該当ファイルを開いてください。

### 🔴 最重要事項

- [config-management.md](./config-management.md) — **【必読】設定ファイル管理方式（config/settings.base.json が唯一のソース）**。

### コードベース解説

- [codebase/INDEX.md](./codebase/INDEX.md) — 現行コードを根拠にしたCoatiの構成・機能・連携の技術解説。既存の仕様書・開発ガイドとは区別して参照してください。

### コーディングルール・ガイドライン

- [api-list-response-design.md](./api-list-response-design.md) — API の一覧レスポンス設計指針。
- [backend-guidelines.md](./backend-guidelines.md) — バックエンド実装のガイドライン。
- [db-concurrency.md](./db-concurrency.md) — DB の同時実行（競合）制御ポリシーと実装例。
- [db-seed-optimization.md](./db-seed-optimization.md) — DB シードデータの最適化手法。
- [Flyonui-color.md](./Flyonui-color.md) — FlyonUI 用のカラーパレットと利用ルール。
- [frontend-guidelines.md](./frontend-guidelines.md) — フロントエンド実装のガイドライン（SSR/Server Actions 等）。
- [frontend-url-security.md](./frontend-url-security.md) — フロントでの URL/ルーティングに関するセキュリティ指針。
- [app-settings-provider.md](./app-settings-provider.md) — AppSettingsProvider（組織設定・ユーザー設定の全体共有）の使い方。
- [global-exception-handling.md](./global-exception-handling.md) — 例外処理とグローバルフィルタの設計。
- [layout-template.md](./layout-template.md) — **【必読】レイアウトテンプレート設計ガイドライン（h-screen/min-h-screen 禁止ルール）**。
- [list-query-best-practices.md](./list-query-best-practices.md) — **【必読】一覧検索クエリのベストプラクティス（Include禁止、DB側COUNT必須）**。
- [modal-dialog-template.md](./modal-dialog-template.md) — モーダルダイアログ実装リファレンス（AI エージェント向け）。
- [ssr-design-guidelines.md](./ssr-design-guidelines.md) — SSR設計ガイドライン（Server/Client Component の使い分け）。
- [tailwind-arbitrary-values.md](./tailwind-arbitrary-values.md) — Tailwind CSS 任意値（`z-[10]` 等）禁止ルール。
- [ui-component-guidelines.md](./ui-component-guidelines.md) — UI コンポーネント実装の必須ルール（エラー表示位置、モーダル、スクロール等）。
- [ui-writing-guidelines.md](./ui-writing-guidelines.md) — UI 文言・コピーの作法と例。
- [use-infinite-scroll.md](./use-infinite-scroll.md) — 無限スクロール用カスタムフック（useInfiniteScroll）の使い方。
- [workspace-viewer-permission.md](./workspace-viewer-permission.md) — ワークスペース Viewer 権限のフロントエンド実装ガイド（canEdit パターン）。
- [ai-client-factory.md](./ai-client-factory.md) — AIクライアントファクトリーの利用ガイド。
- [ai-tools-architecture.md](./ai-tools-architecture.md) — AIツールのアーキテクチャ設計と拡張方法。
- [data-directory-structure.md](./data-directory-structure.md) — 永続データディレクトリ構成と運用ルール。
- [deterministic-time-selector.md](./deterministic-time-selector.md) — 決定論的時刻ベースセレクターの設計とユースケース。
- [monitoring-prometheus-spec.md](./monitoring-prometheus-spec.md) — Prometheus監視導入仕様と運用設計。
- [ui-hint-components.md](./ui-hint-components.md) — ヒント・空状態コンポーネントのガイドライン。

### バックグラウンドタスク

- [bot-hangfire-tasks.md](./bot-hangfire-tasks.md) — Bot Hangfire タスク一覧（AI チャット返信、通知、リマインダー等）。

### 仕様書 (docs/spec)

- 仕様書・設計ドキュメントの一覧は [spec/INDEX.md](./spec/INDEX.md) を参照してください。

更新履歴:

- 2025-12-16: 仕様書を `docs/spec` へ移動し、カテゴリ分けを実施。
- 2025-12-12: 初版作成（自動生成）
