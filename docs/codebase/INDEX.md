# Coati コードベース解説

Coati（`pecus-aspire`）の現行コードを根拠に、サービス境界、主要なデータ経路、業務ドメイン、開発・運用フローを説明する技術解説です。仕様書や実装ガイドではなく、現在のリポジトリ構成を理解するための案内です。

## 読み進め方

1. [実行単位とサービス境界](./00-system-overview.md) でローカル Aspire と本番 Compose の構成を確認する。
2. [SSR・セッション・フロントエンド要求経路](./01-frontend-request-session.md) と [Web API・認証・公開契約](./02-webapi-boundary-security.md) で要求・認証の境界を読む。
3. [ユーザーの無効化・履歴とワークスペース業務](./03-user-lifecycle-workspace-domain.md) と [DB 初期化・検索・整合性・ファイル永続化](./04-data-lifecycle-search-concurrency.md) で業務データと永続化を確認する。
4. [SignalR・プレゼンス・チャット通知](./05-realtime-chat-notifications.md)、[Hangfire・AI クライアント・Bot](./06-background-ai-bots.md)、[アジェンダ・Focus・実績](./07-agenda-focus-achievements.md) で非同期・リアルタイム機能を読む。
5. [共有 Lexical エディターと変換 gRPC](./08-editor-lexical-pipeline.md) で編集データの共有境界を確認する。
6. [ローカル開発・設定・API／型生成](./09-local-development-code-generation.md)、[本番ビルド・デプロイ・運用](./10-deployment-operations.md)、[エージェント・ヘルプ・成果物作成フロー](./11-agent-content-workflows.md) で開発・運用と作業支援の経路を確認する。

## 本文一覧

| 順 | ページ | 主な内容 |
|---:|---|---|
| 1 | [実行単位とサービス境界](./00-system-overview.md) | Aspire のローカル構成、本番 Compose、サービス間の通信・データ境界 |
| 2 | [SSR・セッション・フロントエンド要求経路](./01-frontend-request-session.md) | SSR、Server Actions、セッション Redis、Web API 要求 |
| 3 | [Web API・認証・公開契約](./02-webapi-boundary-security.md) | JWT、外部 API key、OpenAPI、エラー境界 |
| 4 | [ユーザーの無効化・履歴とワークスペース業務](./03-user-lifecycle-workspace-domain.md) | User lifecycle、Activity、WorkspaceItem／WorkspaceTask |
| 5 | [DB 初期化・検索・整合性・ファイル永続化](./04-data-lifecycle-search-concurrency.md) | DbManager、pgroonga、xmin／409、ファイル永続化 |
| 6 | [SignalR・プレゼンス・チャット通知](./05-realtime-chat-notifications.md) | Hub、presence、Pub/Sub、チャット通知 |
| 7 | [Hangfire・AI クライアント・Bot](./06-background-ai-bots.md) | Hangfire、AI adapter、Bot の非同期処理 |
| 8 | [アジェンダ・Focus・実績](./07-agenda-focus-achievements.md) | Agenda、Focus scoring、achievement 判定 |
| 9 | [共有 Lexical エディターと変換 gRPC](./08-editor-lexical-pipeline.md) | editor package、Lexical JSON、gRPC 変換 |
| 10 | [ローカル開発・設定・API／型生成](./09-local-development-code-generation.md) | 設定生成、OpenAPI／Hey API、workspace build |
| 11 | [本番ビルド・デプロイ・運用](./10-deployment-operations.md) | build／deploy、Blue/Green、migration、監視 |
| 12 | [エージェント・ヘルプ・成果物作成フロー](./11-agent-content-workflows.md) | Agent／Skill、ヘルプ、画像、Markdown 成果物 |

**最終確認日:** 2026-10-12
