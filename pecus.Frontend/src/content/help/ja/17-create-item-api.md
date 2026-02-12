# 外部連携APIでアイテムを作成する

このドキュメントでは、外部連携APIを使用して特定のワークスペースにアイテムを作成する方法について説明します。

## エンドポイント
`POST /backend/api/external/workspaces/{workspaceCode}/items`
- `{workspaceCode}`: アイテムを作成する対象のワークスペースのコード

## Bodyパラメータ
- `subject` (string, 必須): アイテムの題名
- `body` (string, 必須): アイテムの本文（Markdown形式）
- `ownerLoginId` (string, 必須): アイテムの所有者となるユーザーのログインID

## 認証
- `X-API-KEY` ヘッダーに有効なAPIキーを設定してください。

APIキーは、[管理者]-[APIキー管理]で発行されたものを使用します。

## レスポンス
- 成功時: 201 Created
  ```json
  {
    "workspaceCode": "ワークスペースのコード",
    "itemId": "作成されたアイテムのID"
  }
  ```
- エラー時: 適切なHTTPステータスコードとエラーメッセージ
    ```json
    {
        "error": "エラーメッセージの説明"
    }
    ```
## 注意事項
- `ownerLoginId`で指定されたユーザーは、対象ワークスペースのメンバーである必要があります。
- `body`フィールドはMarkdown形式をサポートしています。適切にフォーマットされた内容を送信してください。

----------
とここまでは、単なるAPIの説明ですが、以下に具体的な使用例を示します。

# CopilotやClaudeエージェントにより作成した設計書からアイテムを作成する例

以下は、CopilotやClaudeエージェントが生成した設計書の内容を基に、外部連携APIを使用してアイテムを作成する例です（Github Copilotのスキルでの説明となります）

## ディレクトリ構成（`.github/skills/coati-markdown-submit`）

```
.github/
  skills/
    coati-markdown-submit/
      SKILL.md
      scripts/
        submit-markdown.js
```

## `SKILL.md` の内容例
まず、エージェントのスキルを作成します。ある程度完成した段階で指定したドキュメントをCoatiに送信するイメージです。

````markdown
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
      - `read_file` ツールで `d:\github\pecus-aspire\.env` を読み取り
      - 必須: `COATI_API_BASE_URL`, `COATI_WORKSPACE_ID`, `COATI_OWNER_LOGIN_ID`, `COATI_API_KEY`

    2. **スクリプト実行**: `run_in_terminal` ツールを使用
      ```
      node .github/skills/coati-markdown-submit/scripts/submit-markdown.js \
        --subject "ドキュメントの題名" \
        --file "送信したいマークダウンファイルのパス"
      ```
      - `isBackground: false`
      - `timeout: 15000` (15秒)

    3. **結果確認**:
      - ステータス 200-299: 成功
      - ステータス 400: リクエストパラメータを確認
      - ステータス 401/403: APIキーまたは権限を確認
      - ステータス 404: workspaceIdを確認

    ### エージェントが実行すべきツール

    - **必須**: `run_in_terminal` でNode.jsスクリプトを実行
    - **推奨**: 事前に `read_file` で `.env` の存在と内容を確認
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

````


## scripts/submit-markdown.js の内容例

本プロジェクトでは、Node.jsスクリプトを使用してAPIリクエストを送信します。以下はそのサンプルコードです。

```javascript
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function usage() {
  const scriptName = path.basename(process.argv[1]);
  console.log(`Usage: node ${scriptName} --subject "題名" --file "./doc.md"`);
  console.log(`   or: node ${scriptName} --subject "題名" --body "マークダウン本文"`);
  console.log('');
  console.log('Optional args:');
  console.log('  --workspace <id>  (env COATI_WORKSPACE_ID)');
  console.log('  --owner <id>      (env COATI_OWNER_LOGIN_ID)');
  console.log('  --base-url <url>  (env COATI_API_BASE_URL)');
  console.log('  --api-key <key>   (env COATI_API_KEY)');
}

async function main() {
  const subject = getArg('subject');
  const bodyArg = getArg('body');
  const filePath = getArg('file');

  const baseUrl = getArg('base-url') || process.env.COATI_API_BASE_URL || 'https://coati.bright-l.0am.jp/backend/api';
  const workspaceId = getArg('workspace') || process.env.COATI_WORKSPACE_ID;
  const ownerLoginId = getArg('owner') || process.env.COATI_OWNER_LOGIN_ID;
  const apiKey = getArg('api-key') || process.env.COATI_API_KEY;

  if (!subject || (!bodyArg && !filePath) || !workspaceId || !ownerLoginId || !apiKey) {
    console.error('Missing required parameters.');
    usage();
    process.exit(1);
  }

  let body = bodyArg;
  if (!body && filePath) {
    const resolved = path.resolve(filePath);
    body = fs.readFileSync(resolved, 'utf8');
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/external/workspaces/${workspaceId}/items`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      subject,
      body,
      ownerLoginId,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`Request failed: ${response.status} ${response.statusText}`);
    if (responseText) {
      console.error(responseText);
    }
    process.exit(1);
  }

  console.log(`Success: ${response.status}`);
  if (responseText) {
    console.log(responseText);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error?.message || error);
  process.exit(1);
});

```

## .envの作成
スクリプト実行前に、以下のような `.env` ファイルをプロジェクトルートに作成します。

```env
COATI_API_BASE_URL=https://coati.bright-l.0am.jp/backend/api
COATI_WORKSPACE_ID=xxxxxxxxxxxxxxxx
COATI_OWNER_LOGIN_ID=xxxxxxxxxxxxxxxx
COATI_API_KEY=xxxxxxxxxxxxxxxx
```

## 実行プロンプト
ある程度完成した設計ドキュメントをCoatiに送信する場合、以下のようなプロンプトを使用します。
ドキュメントをコンテキストに入れた状態なら...
「このドキュメントをCoatiに送信して」

> まあ、1つのファイルであれば手動でスクリプト実行しちゃった方が速いのですが、複数ファイルに分かれている場合や、エージェントに任せたい場合はこのスキルを呼び出すイメージです。

