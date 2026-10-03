# 外部連携API（External API）

外部連携APIを使うと、外部システムやスクリプトからCoatiのワークスペース、アイテム、タスク、タスクコメントを参照できます。APIキーで認証し、レスポンスはJSON形式です。

アイテム本文はMarkdown形式で返されます。このAPIはデータ参照用で、ワークスペースやアイテム、タスクを作成・更新するエンドポイントはありません。`POST /ping` は認証確認用で、送信したメッセージをそのまま返します。

## APIキーの発行と管理

1. 組織管理者アカウントでログインし、**管理者**の**APIキー管理**を開きます。
2. **APIキーを発行**を選び、用途が分かるキー名と有効期限を入力します。
3. 発行後に表示されるキーをコピーし、安全な場所に保管します。

- キー名は必須で、100文字以内です。
- 有効期限は1〜730日で指定します。初期値および省略時は365日です。
- 平文のAPIキーは発行時に一度だけ表示されます。後から再表示できません。
- 一覧ではキー名、先頭部分、状態、有効期限などを確認できます。漏えいしたキーは**失効**してください。失効したキーはすぐに無効になり、再有効化できません。

APIキーは組織に紐づき、その組織のデータだけを参照できます。キーはパスワードと同様に取り扱い、ソースコードや公開リポジトリに記載しないでください。

## 認証

すべてのエンドポイントに、発行したAPIキーをHTTPヘッダーで指定します。

```http
X-API-KEY: pcs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

キーはサーバー側でハッシュ化して保管されますが、発行時に表示された平文キーを紛失すると再取得できません。その場合は新しいキーを発行してください。

## ベースURL

```text
https://<ご利用のドメイン>/backend/api/external
```

以下のエンドポイント一覧では、このベースURLに続けるパスを記載しています。

## エンドポイント一覧

| メソッド | パス | 説明 |
|:---|:---|:---|
| `POST` | `/ping` | APIキーの疎通確認 |
| `GET` | `/workspaces/{workspaceIdOrCode}/items` | ワークスペースのアイテム一覧（ページング・状態フィルター対応） |
| `GET` | `/workspaces/{workspaceIdOrCode}/items/{itemNumber}` | アイテム詳細 |
| `GET` | `/workspaces/{workspaceIdOrCode}/items/{itemNumber}/tasks` | アイテム内のタスク一覧（状態フィルター対応） |
| `GET` | `/workspaces/{workspaceIdOrCode}/items/{itemNumber}/tasks/{sequence}` | タスク詳細 |
| `GET` | `/workspaces/{workspaceIdOrCode}/items/{itemNumber}/tasks/{sequence}/comments` | タスクのコメント一覧 |

`workspaceIdOrCode` にはワークスペースコードまたは数値のワークスペースIDを指定できます。`itemNumber` はワークスペース内のアイテム番号、`sequence` はアイテム内のタスク番号です。

## 疎通確認

`POST /ping` にメッセージを送ると、同じメッセージ、認証されたキーの組織コード、サーバー応答時刻（UTC）が返ります。メッセージは必須で、500文字以内です。

```bash
curl -X POST "https://<ドメイン>/backend/api/external/ping" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: pcs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{"message":"Hello Coati"}'
```

```json
{
  "message": "Hello Coati",
  "organizationCode": "ORG-001",
  "timestamp": "2026-10-03T05:30:00Z"
}
```

## アイテム一覧

`GET /workspaces/{workspaceIdOrCode}/items` はワークスペースのアイテムを新しい順に返します。1ページは20件固定です。`page` は1始まりで、省略時は1です。1未満を指定した場合も1ページ目として扱われます。

| クエリ | 型 | 説明 |
|:---|:---|:---|
| `page` | integer | ページ番号 |
| `isActive` | boolean | アクティブ状態で絞り込み |
| `isArchived` | boolean | アーカイブ状態で絞り込み |
| `isDraft` | boolean | 下書き状態で絞り込み |

状態フィルターを省略すると、その条件では絞り込みません。例として、アクティブかつアーカイブされていないアイテムの1ページ目は次のように取得できます。

```bash
curl "https://<ドメイン>/backend/api/external/workspaces/gxOZLQQ22ShCHcxL/items?page=1&isActive=true&isArchived=false" \
  -H "X-API-KEY: pcs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

レスポンスにはページ情報とアイテム概要が含まれます。アイテム概要の `owner`、`assignedUser`、`committer` は、`loginId` と `username` を持つユーザー情報です。担当者やコミッターがいない場合は `null` です。

```json
{
  "workspaceCode": "gxOZLQQ22ShCHcxL",
  "totalCount": 12,
  "currentPage": 1,
  "pageSize": 20,
  "hasNextPage": false,
  "items": [
    {
      "itemNumber": 1,
      "subject": "はじめてのプロジェクト設計",
      "tags": ["設計", "仕様"],
      "owner": { "loginId": "user01", "username": "山田" },
      "assignedUser": null,
      "committer": null,
      "dueDate": null,
      "isActive": true,
      "isArchived": false,
      "isDraft": false
    }
  ]
}
```

## アイテム詳細

`GET /workspaces/{workspaceIdOrCode}/items/{itemNumber}` は、アイテム本文を含む詳細を返します。本文はMarkdown形式で、本文が空の場合や変換できない場合は `null` です。タグ、オーナー、担当者、コミッター、期限、アクティブ・アーカイブ・下書き状態も含まれます。

```bash
curl "https://<ドメイン>/backend/api/external/workspaces/gxOZLQQ22ShCHcxL/items/1" \
  -H "X-API-KEY: pcs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

```json
{
  "workspaceCode": "gxOZLQQ22ShCHcxL",
  "itemNumber": 1,
  "subject": "はじめてのプロジェクト設計",
  "body": "# はじめてのプロジェクト設計\n\nMarkdown形式の本文です。",
  "tags": ["設計", "仕様"],
  "owner": { "loginId": "user01", "username": "山田" },
  "assignedUser": null,
  "committer": null,
  "dueDate": null,
  "isActive": true,
  "isArchived": false,
  "isDraft": false
}
```

## タスク一覧

`GET /workspaces/{workspaceIdOrCode}/items/{itemNumber}/tasks` は、アイテム内のタスク一覧をシーケンス番号順に返します。完了状態と破棄状態で絞り込めます。フィルターを省略すると、その条件では絞り込みません。

| クエリ | 型 | 説明 |
|:---|:---|:---|
| `isCompleted` | boolean | 完了状態で絞り込み |
| `isDiscarded` | boolean | 破棄状態で絞り込み |

```bash
curl "https://<ドメイン>/backend/api/external/workspaces/gxOZLQQ22ShCHcxL/items/1/tasks?isCompleted=false&isDiscarded=false" \
  -H "X-API-KEY: pcs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

レスポンスには `workspace.code`、`item.itemNumber` と `tasks` が含まれます。各タスクには担当者・作成者、完了や破棄の情報、タスク種類、優先度、開始日・期限、予定・実績工数、進捗率が含まれます。

## タスク詳細とコメント

タスク詳細は次のパスで取得します。

```text
GET /workspaces/{workspaceIdOrCode}/items/{itemNumber}/tasks/{sequence}
```

レスポンスは `workspace`、`item`、`task` の構成です。タスクには内容、担当者・作成者、種類、優先度、日程、工数、進捗率、完了・破棄情報、先行タスクが含まれます。優先度など任意の項目は `null` の場合があります。

タスクのコメントは次のパスで取得します。

```text
GET /workspaces/{workspaceIdOrCode}/items/{itemNumber}/tasks/{sequence}/comments
```

レスポンスは `workspace`、`item`、`task` と `comments` の構成です。論理削除されたコメントは含まれず、コメントの古い順に並びます。各コメントにはコメントID、投稿者、内容、コメント種別が含まれます。

## エラーと注意事項

| ステータス | 意味 | 主な原因 |
|:---|:---|:---|
| `200 OK` | 成功 | リクエストを処理しました。 |
| `400 Bad Request` | 入力エラー | `ping` のメッセージが未指定または500文字を超えているなど、リクエストが不正です。 |
| `401 Unauthorized` | 認証エラー | `X-API-KEY` がない、無効、失効済み、または期限切れです。 |
| `404 Not Found` | 未検出 | 指定したワークスペース、アイテム、タスクがない、またはAPIキーの組織から参照できません。 |
| `500 Internal Server Error` | サーバーエラー | サーバー側で予期しないエラーが発生しました。 |

- APIキーは発行元の組織に限定されます。他組織のデータは参照できず、該当リソースがない場合と同様に `404 Not Found` が返ります。
- アイテム一覧は状態フィルターを省略すると各状態を問わず返します。必要に応じて `isActive`、`isArchived`、`isDraft` を指定してください。
- アイテム本文はMarkdown変換サービスの状態によって `null` になることがあります。
