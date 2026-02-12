---
name: coati-markdown-submit
description: 'Coati 外部APIへマークダウン設計ドキュメントを送信する手順と安全な運用ガイド。Use when creating/sending markdown design docs to Coati, calling /external/workspaces/{workspaceId}/items, setting X-API-KEY, or troubleshooting request errors.'
---

# Coati Markdown Submit

Coati の外部APIへ、作成済みのマークダウン設計ドキュメントを送信するためのスキルです。安全な運用（APIキーの秘匿）と、再現性のあるリクエスト構成を重視します。

## When to Use This Skill

- 「設計ドキュメント（Markdown）をCoatiに送信したい」
- 「Coatiの external API へ POST する手順を知りたい」
- 「X-API-KEY ヘッダーの付け方、エラーの原因を確認したい」

## Prerequisites

- APIキー（`X-API-KEY`）
- Workspace ID（URLの `workspaces/{workspaceId}`）
- Owner Login ID（`ownerLoginId`）
- 送信する `subject` と `body`（Markdown本文）

> **Security**: APIキーはリポジトリに保存せず、環境変数またはシークレットマネージャで管理します。

## Step-by-Step Workflow

1. **送信内容の準備**
   - `subject`: 文章の題名
   - `body`: Markdown本文（設計ドキュメント）
   - `ownerLoginId`: 所有者ID

2. **エンドポイントの組み立て**

   - Base URL: `https://coati.bright-l.0am.jp/backend/api`
   - Path: `/external/workspaces/{workspaceId}/items`

3. **リクエスト構成**

   - Method: `POST`
   - Headers: `X-API-KEY: <apiKey>`
   - Body (JSON):

     ```json
     {
       "subject": "題名",
       "body": "マークダウンの本文",
       "ownerLoginId": "TW0oLNugCGA8q7Pa"
     }
     ```

4. **送信・結果の確認**

   - ステータスコードが 2xx なら成功
   - 4xx の場合は入力値／APIキー／権限を再確認
   - 5xx の場合は一時的な障害の可能性（ログ確認）

## Script (Node.js)

### 使い方

```
node .github/skills/coati-markdown-submit/scripts/submit-markdown.js \
   --subject "題名" \
   --file "./docs/design.md"
```

本文を直接渡す場合:

```
node .github/skills/coati-markdown-submit/scripts/submit-markdown.js \
   --subject "題名" \
   --body "# 設計\n本文"
```

### 必須環境変数

- `COATI_API_BASE_URL`
- `COATI_WORKSPACE_ID`
- `COATI_OWNER_LOGIN_ID`
- `COATI_API_KEY`

## Troubleshooting

- **401 / 403**: APIキーが誤っている、または権限不足
- **400**: `subject` / `body` / `ownerLoginId` の形式や必須項目不足
- **404**: `workspaceId` の指定ミス

## Notes

- APIキーは `.env` などで管理し、コミットしないこと
- 送信前に Markdown がUTF-8であることを確認

## References

- Endpoint: `POST https://coati.bright-l.0am.jp/backend/api/external/workspaces/{workspaceId}/items`
