﻿# pecus-aspire

AIを社畜扱いして作成中のAspireアプリケーション。
コーディングは一切行わずGithub Copilot エージェントのプロンプト入力だけでAspireアプリケーションを実装する実験。

コミットメッセージもGithub Copilot エージェントが生成。

> 今のところは、どうしても先に進まなくなった時だけ自分でちょい直すぐらい

AIに対するコーディングルールは、.github\copilot-instructions.mdにて

## 作業開始

2025/10/24 作業開始
2025/10/31 現在（3,106,426ステップ生成😅）

## 📋 プロジェクト概要

Pecus Aspire は、.NET Aspire 9.0 を使用した分散マイクロサービス構成のマルチテナント管理システムです。
複数の組織をサポートし、ユーザー管理、ワークスペース管理、スキル管理などの機能を提供します。

## 🏗️ アーキテクチャ

### プロジェクト構成

- **pecus.AppHost** - Aspire オーケストレーションホスト（サービス起動・構成管理）
- **pecus.WebApi** - メイン REST API（JWT認証、ページング、統計情報）
- **pecus.BackFire** - Hangfire バックグラウンドジョブサーバー
- **pecus.DbManager** - データベースマイグレーション・シード管理
- **pecus.Libs** - 共有ライブラリ（DB モデル、Hangfire タスク、メールサービス）
- **pecus.ServiceDefaults** - サービス共通設定（Serilog、ヘルスチェック、OpenTelemetry）
- **pecus.Frontend** - Next.js フロントエンドアプリケーション

### インフラストラクチャ

- **PostgreSQL** - メインデータベース（pecusdb）
- **Redis** - Hangfire キュー・キャッシュ
- **Hangfire Dashboard** - バックグラウンドジョブ管理UI

## 🔧 必要な環境

- **.NET 9 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/9.0)
- **Docker & Docker Compose** - インフラストラクチャ（PostgreSQL、Redis）
- **Node.js 18+** - フロントエンド開発用（オプション）

## 🚀 起動手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/HiroyukiNIshimura/pecus-aspire.git
cd pecus-aspire
```

### 2. 環境構築

#### 2.1 依存パッケージの復元

```bash
# ソリューション全体のパッケージを復元
dotnet restore pecus.sln
```

#### 2.2 フロントエンド環境設定（pecus.Frontend）

```bash
# pecus.Frontend ディレクトリに移動
cd pecus.Frontend

# .env.sample から .env ファイルを作成
cp .env.sample .env

# npm 依存パッケージをインストール
npm install
```

**注:** `.env` ファイルには WebApi のベース URL などの環境変数が含まれます。`.env.sample` をコピーして必要に応じて値を調整してください。

### 3. アプリケーション起動

#### 3.1 Aspire ホストから起動（推奨）

**方法1: dotnet run を使用**

```bash
cd pecus.AppHost
dotnet run
```

**方法2: Aspire CLI を使用（オプション）**

Aspire CLI をインストールしている場合：

```bash
# Aspire CLI でプロジェクトを起動
aspire run
```

Aspire CLI のインストール：
```bash
dotnet tool install -g Aspire.Hosting.Cli
```

**起動時の処理:**
1. `pecus.DbManager` が自動的に起動し、データベースマイグレーションを実行
2. シードデータが投入される（開発環境の場合）
3. `pecus.WebApi` が起動（https://localhost:7265）
4. `pecus.BackFire` Hangfire サーバーが起動
5. Aspire ダッシュボードが表示（VisualStudioの場合は自動起動）

#### 3.2 個別にサービスを起動する場合

**別々のターミナルで実行:**

```bash
# ターミナル1: WebApi
cd pecus.WebApi
dotnet run

# ターミナル2: BackFire (Hangfire ワーカー)
cd pecus.BackFire
dotnet run

# ターミナル3: DbManager (データベース初期化)
cd pecus.DbManager
dotnet run
```

**注:** 個別起動の場合、Aspire ダッシュボードのUIを使用することで、各サービスの状態監視、ログ確認、サービスの再起動などを一元的に管理できます。

### 4. アプリケーションへのアクセス

| サービス | URL | 説明 |
|---------|-----|------|
| **Aspire Dashboard** | 動的 | サービス管理・監視 |
| **WebApi** | https://localhost:7265 | REST API ベースURL |
| **Swagger UI** | https://localhost:7265/index | API ドキュメント |
| **Hangfire Dashboard** | 動的 | バックグラウンドジョブ管理 |
| **PostgreSQL** | tcp:5432 | DB（ユーザー: postgres, パスワード: postgres） |
| **Redis** | 動的 | キャッシュ・キュー |

### 5. テストアカウント

| ユーザー | ログインID | パスワード | 権限 |
|---------|-----------|----------|------|
| 管理者 | `admin` | `admin123` | Admin（全権限） |
| 一般ユーザー | `user001` - `user200` | `user123` | User（読取権限） |

## 📚 API ドキュメント

WebApi のすべてのエンドポイント、リクエスト・レスポンス仕様は **Swagger UI** で確認できます。

WebApi が起動している状態で、以下にアクセスしてください：

- **Swagger UI**: https://localhost:7265/index

Swagger UI では、すべての API エンドポイント、パラメータ、レスポンススキーマが対話的に確認でき、直接 API をテストすることも可能です。

## 🗄️ データベース

### 初期化・マイグレーション

```bash
# 手動でマイグレーションを実行
cd pecus.DbManager
dotnet run

# または Aspire から自動的に実行される
```

### シードデータ

**開発環境:**
- 権限・ロール・ジャンル・スキルマスター
- 5つの組織
- 1つの admin ユーザー
- 200のモックユーザー
- 100のモックワークスペース
- ユーザースキル関連付け（各ユーザーに1～5個のランダムなスキル）

**本番環境:**
- マスターデータのみ投入

## 📝 ログとモニタリング

### Serilog ログ

すべてのサービスで Serilog を使用しています。ログはコンソールと EventLog に出力されます。

### Aspire ダッシュボード

サービス状態、リソース使用状況、トレース情報が確認できます。

### Hangfire ダッシュボード

バックグラウンドジョブの実行状況が確認できます。
pecus.BackFireのURL/hangfire

## 💻 開発ワークフロー

### データベース マイグレーション

新しいエンティティやカラムを追加した場合：

```bash
cd pecus.DbManager

# 新しいマイグレーションを作成
dotnet ef migrations add MigrationName

# マイグレーションを実行
dotnet run
```

### Hangfire タスク

新しいバックグラウンドタスクを追加：

1. `pecus.Libs/Hangfire/Tasks/` でタスククラスを定義
2. WebApi と BackFire の両方で DI 登録
3. `BackgroundJob.Enqueue<TaskClass>(x => x.Method(...))` で実行

## ⚡ パフォーマンス最適化

- EF Core クエリ最適化（Include/Select の適切な使用）
- Hangfire で長時間処理をバックグラウンド化
- Redis キャッシング活用
- ページング実装で大規模データセット対応

## 🔐 セキュリティ

- JWT 認証（Authorization: Bearer {token}）
- ロールベースアクセス制御（RBAC）
- パスワードハッシュ化（Bcrypt）
- HTTPS 対応（本番環境）
- CSRF 保護（SameSite Cookie）

## 📄 ライセンス

MIT License

## 📖 参考資料

- [.NET Aspire 公式ドキュメント](https://learn.microsoft.com/ja-jp/dotnet/aspire/)
- [Entity Framework Core](https://learn.microsoft.com/ja-jp/ef/core/)
- [Hangfire ドキュメント](https://docs.hangfire.io/)
- [JWT 認証](https://jwt.io/)

## 🤝 サポート

しません😅

---

**最終更新日:** 2025年1月
