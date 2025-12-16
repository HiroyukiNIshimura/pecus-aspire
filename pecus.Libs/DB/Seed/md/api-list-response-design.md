# API リストレスポンス設計ガイドライン

## AI エージェント向け要約（必読）

- **目的**: React の `key` 重複問題を解決するため、バックエンドで一意な連番 (`ListIndex`) を付与する。
- **実装ルール**:
  - **DTO**: `public int ListIndex { get; init; }` を追加。
  - **ロジック**: `Select((item, index) => ...)` で連番を振る。
  - **フロントエンド**: `key={item.listIndex}` を使用。ビジネスロジック（編集・削除等）は `id` を使用。
- **注意点**: ページネーション時はオフセットを考慮するが、無限スクロール時のデータ重複はフロントエンドで ID フィルタリングして対処する。

## 1. 概要

### 背景

React でリストをレンダリングする際、各要素に一意な `key` が必要です。
従来は `key={item.id}` のようにDBのIDを使用していましたが、以下の問題が発生しました：

- バックエンドのバグ（GroupByミス等）で同じIDが複数返された場合、フロントで検知できない
- 同じアイテムを異なるコンテキストで複数表示する場合にキーが重複
- デバッグ時に問題の原因特定が困難

### 解決策

**バックエンドでリスト要素に連番（`listIndex`）を付与する**

## 2. 方式

### 2.1 プロパティ定義

```csharp
/// <summary>
/// リスト内での一意なインデックス（フロントエンドのReact key用）
/// </summary>
public int ListIndex { get; init; }
```

### 2.2 付与方法

サービス層またはコントローラーでリストを返す際に `Select` で連番を付与：

```csharp
var response = items.Select((item, index) => new SomeResponse
{
    ListIndex = index,
    // ...他のプロパティ
}).ToList();
```

### 2.3 フロントエンドでの使用

```tsx
{items.map((item) => (
  <div key={item.listIndex}>
    ...
  </div>
))}
```

## 3. 対象DTO一覧

### 3.1 ワークスペース・タスク関連

| DTO | 用途 | ファイルパス |
|-----|------|-------------|
| `MyTaskWorkspaceResponse` | マイタスク用ワークスペース一覧 | `Models/Responses/WorkspaceTask/MyTaskWorkspaceResponse.cs` |
| `MyCommitterWorkspaceResponse` | コミッター用ワークスペース一覧 | `Models/Responses/WorkspaceTask/MyCommitterWorkspaceResponse.cs` |
| `TasksByDueDateResponse` | 期限日グループ化タスク一覧 | `Models/Responses/WorkspaceTask/TasksByDueDateResponse.cs` |
| `TaskWithItemResponse` | タスク詳細（アイテム情報含む） | `Models/Responses/WorkspaceTask/TaskWithItemResponse.cs` |
| `ItemWithTasksResponse` | アイテムとタスクのグループ | `Models/Responses/WorkspaceTask/ItemWithTasksResponse.cs` |

### 3.2 ワークスペース管理関連

| DTO | 用途 | ファイルパス |
|-----|------|-------------|
| `WorkspaceResponse` | ワークスペース一覧 | `Models/Responses/Workspace/WorkspaceResponse.cs` |
| `WorkspaceMemberResponse` | メンバー一覧 | `Models/Responses/Workspace/WorkspaceMemberResponse.cs` |

### 3.3 アイテム関連

| DTO | 用途 | ファイルパス |
|-----|------|-------------|
| `WorkspaceItemResponse` | アイテム一覧 | `Models/Responses/Item/WorkspaceItemResponse.cs` |
| `WorkspaceItemTaskResponse` | アイテム内タスク一覧 | `Models/Responses/Item/WorkspaceItemTaskResponse.cs` |
| `TaskCommentResponse` | タスクコメント一覧 | `Models/Responses/Task/TaskCommentResponse.cs` |

### 3.4 マスタデータ関連

| DTO | 用途 | ファイルパス |
|-----|------|-------------|
| `GenreResponse` | ジャンル一覧 | `Models/Responses/MasterData/GenreResponse.cs` |
| `TaskTypeResponse` | タスクタイプ一覧 | `Models/Responses/MasterData/TaskTypeResponse.cs` |
| `UserResponse` | ユーザー一覧 | `Models/Responses/User/UserResponse.cs` |

### 3.5 その他

| DTO | 用途 | ファイルパス |
|-----|------|-------------|
| `NotificationResponse` | 通知一覧 | `Models/Responses/Notification/NotificationResponse.cs` |
| `ActivityResponse` | アクティビティ一覧 | `Models/Responses/Activity/ActivityResponse.cs` |

## 4. 実装手順

### 4.1 バックエンド

1. 対象DTOに `ListIndex` プロパティを追加
2. サービス層で `.Select((item, index) => ...)` を使用して連番付与
3. ビルド確認: `dotnet build pecus.sln`

### 4.2 フロントエンド

1. APIクライアント再生成: `npm run full:api`（人間が実行）
2. 対象コンポーネントの `key` を `listIndex` に変更
3. 型チェック: `npx tsc --noEmit`

## 5. 注意事項

### 5.1 ネストしたリスト

ネストしたリスト（例: ワークスペース内のタスクグループ内のタスク）も各階層で `ListIndex` を付与：

```csharp
new TasksByDueDateResponse
{
    ListIndex = groupIndex,
    DueDate = group.Key,
    Tasks = group.Select((task, taskIndex) => new TaskWithItemResponse
    {
        ListIndex = taskIndex,
        // ...
    }).ToList()
}
```

### 5.2 既存のIDとの併用

`ListIndex` は React の `key` 専用です。ビジネスロジックでは引き続き `Id` を使用してください：

```tsx
// key は listIndex
<div key={item.listIndex}>
  {/* ビジネスロジックでは id を使用 */}
  <button onClick={() => handleEdit(item.id)}>編集</button>
</div>
```

### 5.3 ページネーション時の考慮

#### 通常のページネーション（ページ切り替え方式）

各ページで0から連番が振られます。ページ切り替え時にリストが置き換わるため問題ありません。

#### 無限スクロール（追加読み込み方式）

ページをまたいでリストが連続的に追加されるため、ページ内で0からの連番だと重複します。
オフセット計算で `ListIndex` の重複は防げます。

```csharp
// サービス層でオフセットを考慮した連番を付与
var offset = (page - 1) * pageSize;
var response = items.Select((item, index) => new SomeResponse
{
    ListIndex = offset + index,
    // ...
}).ToList();
```

**⚠️ 注意: offset-based pagination の限界**

`ListIndex` のオフセット計算で React key の重複は防げますが、リアルタイムコラボ環境では **データ自体の重複/スキップ** が発生する可能性があります。

例: page=1 取得後に別ユーザーがアイテムを追加 → page=2 取得時にページ境界がずれ、同じデータが再度含まれる（または見えなくなるアイテムが発生）

これは `ListIndex` では解決できない offset-based pagination 固有の問題です。現状、フロントエンドで ID ベースの重複チェックを暫定対応しています：

```tsx
setItems((prev) => {
  const existingIds = new Set(prev.map((item) => item.id));
  const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
  return [...prev, ...uniqueNewItems];
});
```

## 6. 移行計画

| フェーズ | 対象 | 作業内容 |
|---------|------|---------|
| Phase 1 | ワークスペース・タスク関連 | 今回の問題が発生した箇所を優先対応 |
| Phase 2 | アイテム関連 | 次回リリースで対応 |
| Phase 3 | マスタデータ・その他 | 順次対応 |

## 7. チェックリスト

- [ ] DTOに `ListIndex` プロパティを追加
- [ ] サービス層で連番付与ロジックを実装
- [ ] ビルド確認
- [ ] APIクライアント再生成（人間が実行）
- [ ] フロントエンドの `key` を `listIndex` に変更
- [ ] 型チェック確認
- [ ] 動作確認
