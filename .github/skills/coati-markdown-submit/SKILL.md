---
name: coati-markdown-submit
description: 'Coati 外部APIへマークダウン設計ドキュメントを送信する手順と安全な運用ガイド。Use when creating/sending markdown design docs to Coati, calling /external/workspaces/{workspaceId}/items, setting X-API-KEY, or troubleshooting request errors.'
---

# Coati Markdown Submit

Coati の外部APIへ、作成済みのマークダウン設計ドキュメントを送信するためのスキルです。安全な運用（APIキーの秘匿）と、再現性のあるリクエスト構成を重視します。

## Quick Start（最短実行）

1. `.env` を用意（未作成の場合）

   ```env
   COATI_API_BASE_URL=https://coati.bright-l.0am.jp/backend/api
   COATI_WORKSPACE_ID=xxxxxxxxxxxxxxxx
   COATI_OWNER_LOGIN_ID=xxxxxxxxxxxxxxxx
   COATI_API_KEY=xxxxxxxxxxxxxxxx
   ```

2. 送信本文を保存（例: `./.tmp/body.md`）

3. 実行

   ```bash
   node .github/skills/coati-markdown-submit/scripts/submit-markdown.js \
      --subject "題名" \
      --file ".tmp/body.md"
   ```

## When to Use This Skill

- 「設計ドキュメント（Markdown）をCoatiに送信したい」
- 「Coatiの external API へ POST する手順を知りたい」
- 「X-API-KEY ヘッダーの付け方、エラーの原因を確認したい」

## For AI Agents（エージェント向け実行手順）

### 自動実行時の手順

1. **環境変数の確認**: `.env` ファイルが存在し、必要な変数が設定されているか確認
   - 作業ディレクトリ基準の `.env`（例: `<workspace>/.env`）を確認
   - `read_file` を使う場合は、必要キー名の有無のみ確認し、値全文は読み取り・表示しない
   - 必須: `COATI_API_BASE_URL`, `COATI_WORKSPACE_ID`, `COATI_OWNER_LOGIN_ID`, `COATI_API_KEY`

2. **スクリプト実行**: `run_in_terminal` ツールが利用可能な場合に使用
   ```
   node .github/skills/coati-markdown-submit/scripts/submit-markdown.js \
     --subject "ドキュメントの題名" \
     --file "送信したいマークダウンファイルのパス"
   ```
   - `isBackground: false`
   - `timeout: 15000` (15秒)
   - `run_in_terminal` が利用不可の場合は、同コマンドをユーザーへ提示して実行を依頼する

3. **結果確認**:
   - ステータス 200-299: 成功
   - ステータス 400: リクエストパラメータを確認
   - ステータス 401/403: APIキーまたは権限を確認
   - ステータス 404: workspaceIdを確認

### エージェントが実行すべきツール

- **推奨**: `run_in_terminal` が利用可能な場合は Node.js スクリプトを実行
- **代替**: 利用不可の場合は、実行コマンドをユーザーに提示して実行依頼
- **推奨**: `read_file` は `.env` の存在確認とキー名有無の確認に限定
- **禁止**: `.env` の内容をユーザーに表示しない（セキュリティ）

## Prerequisites（必要な情報）

- APIキー（`X-API-KEY`）
- Workspace ID（URLの `workspaces/{workspaceId}`）
- Owner Login ID（`ownerLoginId`）
- 送信する `subject` と `body`（Markdown本文）

> **Security**: APIキーはリポジトリに保存せず、環境変数またはシークレットマネージャで管理します。

## Step-by-Step（詳細）

1. 送信内容を準備（`subject`, `body`, `ownerLoginId`）
2. エンドポイントを組み立て
   - Base URL: `https://coati.bright-l.0am.jp/backend/api`
   - Path: `/external/workspaces/{workspaceId}/items`
3. `POST` で送信（`X-API-KEY` をヘッダーに付与）
4. 2xx なら成功、4xx/5xx は入力値や権限を確認

## Script (Node.js)

### 使い方（最短）

```
node .github/skills/coati-markdown-submit/scripts/submit-markdown.js \
   --subject "題名" \
   --file "./docs/design.md"
```

本文を直接渡す場合は `--body` を使用します。

### 必須環境変数

- `COATI_API_BASE_URL`
- `COATI_WORKSPACE_ID`
- `COATI_OWNER_LOGIN_ID`
- `COATI_API_KEY`

## Troubleshooting（よくある原因）

- **401 / 403**: APIキーが誤っている、または権限不足
- **400**: `subject` / `body` / `ownerLoginId` の形式や必須項目不足
- **404**: `workspaceId` の指定ミス

## Notes

- APIキーは `.env` などで管理し、コミットしないこと
- 送信前に Markdown がUTF-8であることを確認

## References

- Endpoint: `POST https://coati.bright-l.0am.jp/backend/api/external/workspaces/{workspaceId}/items`
