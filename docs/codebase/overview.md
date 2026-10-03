# Coatiの概要

> 本ページは現行コードから確認できる機能・データ構造を説明します。プロダクトの目標や未実装の計画を定義する仕様書ではありません。

## 中心となる概念

Coatiでは、利用者は組織に所属し、組織の中にワークスペースを持ちます。ワークスペースはアイテムをまとめる単位で、`Workspace.Mode`によって通常の作業管理とドキュメント管理を区別できます。アイテムには本文、担当者、期限、優先度、タグ、添付ファイルなどがあり、作業タスクやコメントを関連付けられます。

- [Workspaceモデル](../../pecus.Libs/DB/Models/Workspace.cs) — 組織との関係、モード、メンバー、アイテム
- [WorkspaceItemモデル](../../pecus.Libs/DB/Models/WorkspaceItem.cs) — 件名・本文、担当、タグ、添付、関連、検索インデックス
- [WorkspaceTaskモデル](../../pecus.Libs/DB/Models/WorkspaceTask.cs) — アイテムに属する担当タスク、進捗、先行タスク
- [WorkspaceMode](../../pecus.Libs/DB/Models/Enums/WorkspaceMode.cs) — `Normal`、`Document`などのモード

## 主な機能領域

| 領域 | 現行コードで確認できる役割 | 代表的な実装 |
|---|---|---|
| 組織・ワークスペース | 組織境界の中でワークスペース、参加者、権限を管理 | [`WorkspaceService`](../../pecus.WebApi/Services/WorkspaceService.cs)、[`OrganizationAccessHelper`](../../pecus.WebApi/Libs/WorkspaceAccessHelper.cs) |
| アイテム・タスク | アイテムの作成・編集、関連付け、添付、タスク・コメントを管理 | [`WorkspaceItemController`](../../pecus.WebApi/Controllers/WorkspaceItemController.cs)、[`WorkspaceTaskController`](../../pecus.WebApi/Controllers/WorkspaceTaskController.cs) |
| チャット・AI | チャットルーム／メッセージ、アシスタント、ボット関連サービスを提供 | [`ChatRoomService`](../../pecus.WebApi/Services/ChatRoomService.cs)、[`AiAssistantService`](../../pecus.WebApi/Services/AiAssistantService.cs) |
| 通知・リアルタイム | 通知の保存とSignalRへの配信経路を提供 | [`NotificationHub`](../../pecus.WebApi/Hubs/NotificationHub.cs)、[SignalR通知サブスクライバー登録](../../pecus.WebApi/Program.cs) |
| アジェンダ・実績 | アジェンダ、参加者・通知、および実績関連のサービスを登録 | [`AgendaService`](../../pecus.WebApi/Services/AgendaService.cs)、[`AchievementService`](../../pecus.WebApi/Services/AchievementService.cs) |
| バックグラウンド処理 | メール、通知、画像処理などをHangfireジョブとして実行 | [`pecus.BackFire`起動処理](../../pecus.BackFire/Program.cs)、[`pecus.Libs/Hangfire/Tasks`](../../pecus.Libs/Hangfire/Tasks) |

この表は機能の完全な一覧ではありません。機能がAPIとして公開されているか、UIに実装されているかは各リンク先で確認してください。

## アプリケーションの境界

- `pecus.Frontend`はNext.js App RouterのWebアプリです。データの読み取り・更新はServer Component、Server Action、Next.js API Routeを通じてサーバー側で実行され、生成済みAPIクライアントを介してWeb APIと接続します。
- `pecus.WebApi`は認証・認可されたREST APIを公開し、業務サービスを呼び出します。
- `pecus.Libs`は複数の.NETサービスで共有されるDBモデル、タスク、連携サービス等を持ちます。
- `pecus.BackFire`はHangfireジョブの実行ホストです。
- `pecus.DbManager`はDB初期化処理をホストし、`pecus.LexicalConverter`はLexicalデータ変換のgRPCサービスを提供します。
- 起動時のリソース構成とサービス参照は[AppHost](../../pecus.AppHost/AppHost.cs)で定義されています。

## 関連ページ

- [システム構成](./architecture.md)
- [バックエンドとデータ](./backend-and-data.md)
- [フロントエンド](./frontend.md)
- [バックグラウンド処理と連携](./background-and-integrations.md)

最終確認日: 2026-10-03
