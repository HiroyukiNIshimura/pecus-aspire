# 外部連携API（External API）

このドキュメントでは、外部システムやスクリプトからCoatiのデータを取得・参照するための外部連携APIについて説明します。

## 概要

外部連携APIを使用すると、APIキー認証を利用して組織内のワークスペースやアイテム情報をプログラムから安全に取得できます。
アイテムの本文は、リッチテキスト（Lexical形式）から自動的にMarkdown形式に変換されて返却されます。

外部システムとの連携はもちろん、CopilotやClaudeなどの生成AIエージェントに社内ドキュメント・仕様を参照させるためのデータソースとしても手軽に活用できます。

---

## 認証

外部連携APIのすべてのリクエストには、HTTPヘッダーに `X-API-KEY` を含める必要があります。

```http
X-API-KEY: pcs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### APIキーの発行方法
1. 組織管理者アカウントでログインします。
2. 画面右上のメニューまたはサイドバーから **[管理者]** - **[APIキー管理]** を選択します。
3. キー名と有効期限を設定して **[APIキーを発行]** をクリックします。
4. 表示されたAPIキー（`pcs_` から始まる文字列）をコピーして安全に保管してください。

> ⚠️ **注意**: APIキーの平文は発行時のみ一度だけ表示されます。再表示はできないため、必ず安全な場所に保存してください。
> また、APIキーには所属組織のデータへのアクセス権が付与されます。キーが漏洩した場合は速やかに失効操作を行ってください。

---

## ベースURL

リクエストを送信するベースURLは以下の形式となります。

```
https://<ご利用のドメイン>/backend/api/external
```

---

## エンドポイント一覧

| メソッド | パス | 説明 |
|:---|:---|:---|
| `POST` | `/ping` | 疎通確認（エコーバックと組織情報の確認） |
| `GET` | `/workspaces/{workspaceCode}/items` | 指定ワークスペース内の全アイテム取得（ページネーション対応） |
| `GET` | `/workspaces/{workspaceCode}/items/{itemNumber}` | 指定ワークスペース内の指定アイテム取得 |

---

## 1. 疎通確認 (Ping)

APIキー認証が正常に動作しているか確認するためのエンドポイントです。送信したメッセージとともに、所属組織コードとタイムスタンプが返却されます。

### エンドポイント
`POST /backend/api/external/ping`

### リクエストボディ
```json
{
  "message": "Hello Coati"
}
```

### レスポンス
- **ステータス**: `200 OK`
```json
{
  "message": "Hello Coati",
  "organizationCode": "ORG-001",
  "timestamp": "2026-09-06T02:30:00.000Z"
}
```

### curl実行例
```bash
curl -X POST "https://<ドメイン>/backend/api/external/ping" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: pcs_xxxxxxxx..." \
  -d '{"message": "Hello Coati"}'
```

---

## 2. ワークスペース内の全アイテム取得

指定したワークスペースに属するアクティブなアイテム一覧を取得します。

### エンドポイント
`GET /backend/api/external/workspaces/{workspaceCode}/items`

### パラメータ
- **パスパラメータ**:
  - `workspaceCode` (string, 必須): ワークスペースの識別コード（例: `gxOZLQQ22ShCHcxL`）
- **クエリパラメータ**:
  - `page` (int, 任意): ページ番号（1始まり。省略時は `1`）
  - ※ 1ページあたりの件数は **20件固定** です。

### レスポンス
- **ステータス**: `200 OK`
```json
{
  "workspaceCode": "gxOZLQQ22ShCHcxL",
  "totalCount": 12,
  "currentPage": 1,
  "pageSize": 20,
  "hasNextPage": false,
  "items": [
    {
      "workspaceCode": "gxOZLQQ22ShCHcxL",
      "itemNumber": 1,
      "subject": "はじめてのプロジェクト設計",
      "body": "# はじめてのプロジェクト設計\n\nここにMarkdown形式の本文が入ります。\n\n## 目的\n...",
      "tags": [
        "設計",
        "仕様"
      ]
    }
  ]
}
```

### curl実行例
```bash
curl -X GET "https://<ドメイン>/backend/api/external/workspaces/gxOZLQQ22ShCHcxL/items?page=1" \
  -H "X-API-KEY: pcs_xxxxxxxx..."
```

---

## 3. 指定アイテムの取得

指定したワークスペース内のアイテム番号（ワークスペース内連番）を指定して、単一アイテムの詳細情報を取得します。

### エンドポイント
`GET /backend/api/external/workspaces/{workspaceCode}/items/{itemNumber}`

### パラメータ
- **パスパラメータ**:
  - `workspaceCode` (string, 必須): ワークスペースの識別コード
  - `itemNumber` (int, 必須): アイテム番号（ワークスペース内の連番: `1`, `2`, ...）

### レスポンス
- **ステータス**: `200 OK`
```json
{
  "workspaceCode": "gxOZLQQ22ShCHcxL",
  "itemNumber": 1,
  "subject": "はじめてのプロジェクト設計",
  "body": "# はじめてのプロジェクト設計\n\nここにMarkdown形式の本文が入ります。\n\n## 目的\n...",
  "tags": [
    "設計",
    "仕様"
  ]
}
```

### curl実行例
```bash
curl -X GET "https://<ドメイン>/backend/api/external/workspaces/gxOZLQQ22ShCHcxL/items/1" \
  -H "X-API-KEY: pcs_xxxxxxxx..."
```

---

## レスポンス・エラーコード一覧

| ステータスコード | 意味 | 主な原因と対処 |
|:---|:---|:---|
| `200 OK` | 成功 | リクエストが正常に処理されました。 |
| `400 Bad Request` | リクエスト不正 | リクエストボディやパラメータの形式が正しくありません。 |
| `401 Unauthorized` | 認証エラー | `X-API-KEY` ヘッダーが未指定、または無効・失効・期限切れのキーです。 |
| `404 Not Found` | 未検出 | 指定されたワークスペースまたはアイテムが存在しない、または自組織に属していません。 |
| `429 Too Many Requests` | レート制限超過 | 短時間に多数のリクエストが送信されました。リクエスト間隔を空けてください。 |

---

## 仕様と注意事項

- **組織スコープ**: 発行されたAPIキーが所属する組織以外のワークスペースやアイテムにはアクセスできません（他組織のリソースを指定した場合は `404 Not Found` となります）。
- **Markdown変換**: アイテムの本文は gRPC 変換サービスを通じて自動的に Markdown に変換されます。本文が空の場合は `null` が返却されます。
- **レート制限**: リバースプロキシにより、IPアドレスごとに1秒あたり10リクエスト（バースト20まで）の制限が設けられています。


