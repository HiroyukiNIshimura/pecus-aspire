## ドキュメント索引

このディレクトリ内のドキュメント一覧と簡単な説明です。ファイル名をクリックして該当ファイルを開いてください。

### 🔴 最重要事項

- [config-management.md](./config-management.md) — **【必読】設定ファイル管理方式（config/settings.base.json が唯一のソース）**。

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

### バックグラウンドタスク

- [bot-hangfire-tasks.md](./bot-hangfire-tasks.md) — Bot Hangfire タスク一覧（AI チャット返信、通知、リマインダー等）。

### 仕様書 (docs/spec)

- [activity-requirements.md](./spec/activity-requirements.md) — 活動要件と仕様のまとめ。
- [auth-architecture-redesign.md](./spec/auth-architecture-redesign.md) — 認証／セッション設計の再設計案。
- [backfire-signalr-notification.md](./spec/backfire-signalr-notification.md) — BackFire (Hangfire) から SignalR 通知を送信する仕組み（Redis Pub/Sub 経由）。
- [chat-feature-design.md](./spec/chat-feature-design.md) — チャット機能の設計仕様。
- [dashboard-statistics.md](./spec/dashboard-statistics.md) — ダッシュボード向け集計・統計設計。
- [item-edit-status.md](./spec/item-edit-status.md) — アイテム編集ステータス管理の仕様。
- [lexical-grpc-service.md](./spec/lexical-grpc-service.md) — Lexical gRPC サービスの設計・契約。
- [mail-notifications.md](./spec/mail-notifications.md) — メール通知の設計とテンプレート運用方針。
- [mail.md](./spec/mail.md) — メール送信基盤と実装ガイド。
- [PRODUCT_VISION_PERSONAS_JA.md](./spec/PRODUCT_VISION_PERSONAS_JA.md) — プロダクトビジョンとペルソナ定義。
- [redis-database-separation.md](./spec/redis-database-separation.md) — Redis と DB の分離設計・運用指針。
- [signalr-implementation.md](./spec/signalr-implementation.md) — SignalR 実装の技術設計。
- [signalr-presence.md](./spec/signalr-presence.md) — プレゼンス管理（接続状態）設計。
- [skill-matching.md](./spec/skill-matching.md) — スキルマッチング機能のアルゴリズム設計。
- [task-focus-recommendation.md](./spec/task-focus-recommendation.md) — タスク集中推薦機能の設計。
- [task-ui-redesign.md](./spec/task-ui-redesign.md) — タスクUIの再設計仕様。
- [user-onboarding.md](./spec/user-onboarding.md) — ユーザーオンボーディング（初回ガイド/チュートリアル）の設計。
- [workspace-access-control.md](./spec/workspace-access-control.md) — **【重要】ワークスペースのアクセス制御方針（Viewer/Member/Owner 権限マトリクス、403 Forbidden）**。
- [workspace-item-edit-permission.md](./spec/workspace-item-edit-permission.md) — アイテム編集権限の詳細。
- [workspace-item-task-relationship.md](./spec/workspace-item-task-relationship.md) — アイテムとタスクの関係性設計。

更新履歴:

- 2025-12-16: 仕様書を `docs/spec` へ移動し、カテゴリ分けを実施。
- 2025-12-12: 初版作成（自動生成）
