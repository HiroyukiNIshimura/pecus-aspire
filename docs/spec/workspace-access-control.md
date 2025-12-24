# ワークスペースアクセス権限

## AI エージェント向け要約（必読）

- **Viewer権限のユーザーは変更操作不可** → 403 Forbidden を返す
- 権限チェックには `OrganizationAccessHelper.RequireWorkspaceEditPermissionAsync()` を使用
- `ForbiddenException` は `GlobalExceptionFilter` で HTTP 403 に変換される
- ピン操作（`WorkspaceItemPinController`）のみ Viewer でも許可

## 概要

ワークスペースへのアクセス権限は `WorkspaceUser.WorkspaceRole` により制御されます。

## WorkspaceRole

| Role | 値 | 説明 |
|------|---|------|
| Viewer | 1 | 閲覧者（読み取り専用） |
| Member | 2 | メンバー（編集可能） |
| Owner | 3 | オーナー（すべての権限） |

## ワークスペースオーナー（Workspace.OwnerId）について

各ワークスペースには `OwnerId` プロパティがあり、ワークスペースの「真のオーナー」を表します。
このユーザーの `WorkspaceRole` を `Owner` 以外に変更することはできません（保護対象）。

これにより、ワークスペースの管理権限を持つユーザーが常に存在することを保証します。

## 権限マトリクス

### WorkspaceController（ワークスペース管理）

| 操作 | エンドポイント | Viewer | Member | Owner |
|------|---------------|:------:|:------:|:-----:|
| 一覧取得 | `GET /api/workspaces` | ✅ | ✅ | ✅ |
| 詳細取得 | `GET /api/workspaces/{id}` | ✅ | ✅ | ✅ |
| 詳細取得(code) | `GET /api/workspaces/code/{code}` | ✅ | ✅ | ✅ |
| **更新** | `PUT /api/workspaces/{id}` | ❌ 403 | ✅ | ✅ |
| 有効化 | `POST /api/workspaces/{id}/activate` | ❌ | ❌ | ✅ |
| 無効化 | `POST /api/workspaces/{id}/deactivate` | ❌ | ❌ | ✅ |
| メンバー追加 | `POST /api/workspaces/{id}/members` | ❌ | ❌ | ✅ |
| メンバー削除 | `DELETE /api/workspaces/{id}/members/{userId}` | ❌ | ❌ | ✅ |
| メンバーロール変更 | `PATCH /api/workspaces/{id}/members/{userId}/role` | ❌ | ❌ | ✅ |

### WorkspaceItemController（ワークスペースアイテム）

| 操作 | エンドポイント | Viewer | Member | Owner |
|------|---------------|:------:|:------:|:-----:|
| 一覧取得 | `GET /api/workspaces/{id}/items` | ✅ | ✅ | ✅ |
| 詳細取得 | `GET /api/workspaces/{id}/items/{itemId}` | ✅ | ✅ | ✅ |
| コードで取得 | `GET /api/workspaces/{id}/items/code/{code}` | ✅ | ✅ | ✅ |
| **作成** | `POST /api/workspaces/{id}/items` | ❌ 403 | ✅ | ✅ |
| **更新** | `PATCH /api/workspaces/{id}/items/{itemId}` | ❌ 403 | ✅ | ✅ |
| **ステータス更新** | `PATCH /api/workspaces/{id}/items/{itemId}/status` | ❌ 403 | ✅ | ✅ |
| **担当者更新** | `PATCH /api/workspaces/{id}/items/{itemId}/assignee` | ❌ 403 | ✅ | ✅ |
| **削除** | `DELETE /api/workspaces/{id}/items/{itemId}` | ❌ 403 | ✅ | ✅ |
| **属性更新** | `PATCH /api/workspaces/{id}/items/{itemId}/{attr}` | ❌ 403 | ✅ | ✅ |
| **ドキュメント提案** | `POST /api/workspaces/{id}/items/document-suggestion` | ❌ 403 | ✅ | ✅ |
| 子アイテム数取得 | `GET /api/workspaces/{id}/items/{itemId}/children/count` | ✅ | ✅ | ✅ |

### WorkspaceItemTagController（タグ）

| 操作 | エンドポイント | Viewer | Member | Owner |
|------|---------------|:------:|:------:|:-----:|
| **タグ設定** | `PUT /api/workspaces/{id}/items/{itemId}/tags` | ❌ 403 | ✅ | ✅ |

### WorkspaceItemRelationController（関連）

| 操作 | エンドポイント | Viewer | Member | Owner |
|------|---------------|:------:|:------:|:-----:|
| 関連一覧取得 | `GET /api/workspaces/{id}/items/{itemId}/relations` | ✅ | ✅ | ✅ |
| **関連追加** | `POST /api/workspaces/{id}/items/{itemId}/relations` | ❌ 403 | ✅ | ✅ |
| **関連削除** | `DELETE /api/workspaces/{id}/items/{itemId}/relations/{relationId}` | ❌ 403 | ✅ | ✅ |

### WorkspaceItemAttachmentController（添付ファイル）

| 操作 | エンドポイント | Viewer | Member | Owner |
|------|---------------|:------:|:------:|:-----:|
| 添付一覧取得 | `GET /api/workspaces/{id}/items/{itemId}/attachments` | ✅ | ✅ | ✅ |
| ダウンロード | `GET /api/workspaces/{id}/items/{itemId}/attachments/download/{fileName}` | ✅ | ✅ | ✅ |
| **アップロード** | `POST /api/workspaces/{id}/items/{itemId}/attachments` | ❌ 403 | ✅ | ✅ |
| **削除** | `DELETE /api/workspaces/{id}/items/{itemId}/attachments/{attachmentId}` | ❌ 403 | ✅ | ✅ |

### WorkspaceItemPinController（ピン）※ Viewer でも許可

| 操作 | エンドポイント | Viewer | Member | Owner |
|------|---------------|:------:|:------:|:-----:|
| **ピン追加** | `POST /api/workspaces/{id}/items/{itemId}/pin` | ✅ | ✅ | ✅ |
| **ピン削除** | `DELETE /api/workspaces/{id}/items/{itemId}/pin` | ✅ | ✅ | ✅ |

> ピン機能はユーザー個人の設定であり、ワークスペースのデータを変更しないため Viewer でも許可

### WorkspaceTaskController（タスク）

| 操作 | エンドポイント | Viewer | Member | Owner |
|------|---------------|:------:|:------:|:-----:|
| タスク一覧取得 | `GET /api/workspaces/{id}/items/{itemId}/tasks` | ✅ | ✅ | ✅ |
| タスク取得 | `GET /api/workspaces/{id}/items/{itemId}/tasks/{taskId}` | ✅ | ✅ | ✅ |
| シーケンスで取得 | `GET /api/workspaces/{id}/items/{itemId}/tasks/sequence/{sequence}` | ✅ | ✅ | ✅ |
| フローマップ取得 | `GET /api/workspaces/{id}/items/{itemId}/tasks/flow-map` | ✅ | ✅ | ✅ |
| **タスク作成** | `POST /api/workspaces/{id}/items/{itemId}/tasks` | ❌ 403 | ✅ | ✅ |
| **タスク更新** | `PUT /api/workspaces/{id}/items/{itemId}/tasks/{taskId}` | ❌ 403 | ✅ | ✅ |
| **担当者負荷チェック** | `GET /api/workspaces/{id}/items/{itemId}/tasks/assignee-load-check` | ❌ 403 | ✅ | ✅ |

### TaskCommentController（タスクコメント）

| 操作 | エンドポイント | Viewer | Member | Owner |
|------|---------------|:------:|:------:|:-----:|
| コメント一覧取得 | `GET /api/workspaces/{id}/items/{itemId}/tasks/{taskId}/comments` | ✅ | ✅ | ✅ |
| コメント取得 | `GET /api/workspaces/{id}/items/{itemId}/tasks/{taskId}/comments/{commentId}` | ✅ | ✅ | ✅ |
| **コメント作成** | `POST /api/workspaces/{id}/items/{itemId}/tasks/{taskId}/comments` | ❌ 403 | ✅ | ✅ |
| **コメント更新** | `PUT /api/workspaces/{id}/items/{itemId}/tasks/{taskId}/comments/{commentId}` | ❌ 403 | ✅ | ✅ |
| **コメント削除** | `DELETE /api/workspaces/{id}/items/{itemId}/tasks/{taskId}/comments/{commentId}` | ❌ 403 | ✅ | ✅ |

### AdminWorkspaceController（組織管理者向け API）

| 操作 | エンドポイント | 必要権限 |
|------|---------------|---------|
| ワークスペース登録 | `POST /api/admin/workspaces` | 組織所属 |
| ワークスペース取得 | `GET /api/admin/workspaces/{id}` | 組織所属 |
| ワークスペース一覧 | `GET /api/admin/workspaces` | 組織所属 |
| ワークスペース更新 | `PUT /api/admin/workspaces/{id}` | 組織所属 |
| ワークスペース削除 | `DELETE /api/admin/workspaces/{id}` | 組織所属 |
| ワークスペース無効化 | `PATCH /api/admin/workspaces/{id}/deactivate` | 組織所属 |
| ワークスペース有効化 | `PATCH /api/admin/workspaces/{id}/activate` | 組織所属 |
| メンバー追加 | `POST /api/admin/workspaces/{id}/users` | 組織所属 |
| メンバー削除 | `DELETE /api/admin/workspaces/{id}/users/{userId}` | 組織所属 |
| メンバーロール変更 | `PATCH /api/admin/workspaces/{id}/users/{userId}/role` | 組織所属 |
| メンバー一覧 | `GET /api/admin/workspaces/{id}/users` | 組織所属 |

※ 組織所属: ログインユーザーがワークスペースと同じ組織に所属していること

## メンバーロール変更の制約

### 共通ルール

- `Workspace.OwnerId` に指定されたユーザーの `WorkspaceRole` を `Owner` 以外に変更することはできません
- この制約はワークスペースの管理権限を失わないようにするためです

### WorkspaceController（一般ユーザー向け）

- **必要権限**: ワークスペースにアクセス可能 かつ `WorkspaceRole` が `Owner`
- **エンドポイント**: `PATCH /api/workspaces/{id}/members/{userId}/role`
- **制約**: `Workspace.OwnerId` のユーザーを `Owner` 以外に変更できない

### AdminWorkspaceController（組織管理者向け）

- **必要権限**: 組織に所属するユーザーであること
- **エンドポイント**: `PATCH /api/admin/workspaces/{id}/users/{userId}/role`
- **制約**: `Workspace.OwnerId` のユーザーを `Owner` 以外に変更できない

## 実装

### 権限チェック用メソッド

アクセスチェックは以下のクラス・メソッドで行います：

#### OrganizationAccessHelper（推奨）

| メソッド | 用途 | 失敗時 |
|---------|------|--------|
| `CanAccessWorkspaceAsync` | 組織所属確認（読み取り用） | `false` を返す |
| `CheckWorkspaceAccessAndMembershipAsync` | アクセス権 + メンバーシップ確認 | タプルで結果を返す |
| `CheckWorkspaceEditPermissionAsync` | アクセス権 + 編集権限確認（Viewer判定） | タプルで結果を返す |
| **`RequireWorkspaceEditPermissionAsync`** | **編集権限必須（Viewer は 403）** | `ForbiddenException` |

#### WorkspaceService

| メソッド | 用途 | 失敗時 |
|---------|------|--------|
| `CheckWorkspaceMemberOrOwnerAsync` | Member 以上（更新系） | `ForbiddenException` |
| `CheckWorkspaceOwnerAsync` | Owner のみ（メンバー管理） | `NotFoundException` |

### 例外クラス

| 例外 | HTTP ステータス | 用途 |
|------|----------------|------|
| `ForbiddenException` | 403 Forbidden | Viewer が変更操作を試みた場合 |
| `NotFoundException` | 404 Not Found | リソースが見つからない / アクセス権がない |
| `InvalidOperationException` | 400 Bad Request | その他の操作エラー |

### コントローラーでの使用例

```csharp
// Viewer を含むメンバーチェック（読み取り専用操作）
var (hasAccess, isMember, _) = await _accessHelper.CheckWorkspaceAccessAndMembershipAsync(CurrentUserId, workspaceId);
if (!hasAccess) throw new NotFoundException("ワークスペースが見つかりません。");

// 編集権限チェック（Viewer は 403）
await _accessHelper.RequireWorkspaceEditPermissionAsync(CurrentUserId, workspaceId);
```

## レスポンスの CurrentUserRole

ワークスペース詳細取得 API (`WorkspaceFullDetailResponse`) のレスポンスには `currentUserRole` フィールドが含まれます。
これはログインユーザーのそのワークスペースに対するロール（`Viewer` / `Member` / `Owner`）を返します。

フロントエンドではこの値を使って、更新ボタンやメンバー管理ボタンの表示/非表示を制御できます。

## フロントエンドでの Owner 判定

### ワークスペース作成者（スペシャルオーナー）とオーナーロールの区別

ワークスペースには2種類の「オーナー」概念があります：

| 概念 | 判定方法 | 説明 |
|------|----------|------|
| **ワークスペース作成者** | `workspaceDetail.owner?.id` | ワークスペースを作成したユーザー。`Workspace.OwnerId` に対応。削除・ロール変更不可。 |
| **オーナーロール** | `member.workspaceRole === 'Owner'` | `WorkspaceRole` が `Owner` のユーザー。複数人存在可能。 |

### メンバー管理UIでの制御

`WorkspaceMemberList` コンポーネントでは、以下のように制御しています：

```typescript
// メンバー追加/削除/ロール変更の権限判定（CurrentUserRole で判定）
const isOwner = workspaceDetail.currentUserRole === 'Owner';

// メンバーカードの3点メニュー表示制御（ownerId で判定）
<WorkspaceMemberList
  members={members}
  editable={isOwner}
  ownerId={workspaceDetail.owner?.id}  // ワークスペース作成者のID
  onAddMember={...}
  onRemoveMember={...}
  onChangeRole={...}
/>
```

- **`editable`**: ログインユーザーがオーナーロールを持っているかで判定
- **`ownerId`**: ワークスペース作成者のIDを渡し、その人のカードには3点メニューを表示しない

### 理由

- ワークスペース作成者（`Workspace.OwnerId`）は、ワークスペースの管理権限を保証するため削除・ロール変更が禁止されています
- オーナーロールを持つ他のユーザー（追加されたオーナー）は、削除・ロール変更が可能です
- フロントエンドでも同様の制約をUIに反映し、操作不可のメニューを非表示にしています

## 関連ファイル

### バックエンド

- `pecus.WebApi/Controllers/WorkspaceController.cs`
- `pecus.WebApi/Controllers/Admin/AdminWorkspaceController.cs`
- `pecus.WebApi/Services/WorkspaceService.cs`
- `pecus.WebApi/Models/Responses/Workspace/WorkspaceFullDetailResponse.cs`
- `pecus.Libs/DB/Models/Enums/WorkspaceRole.cs`

### フロントエンド

- `pecus.Frontend/src/components/workspaces/WorkspaceMemberList.tsx` - メンバー一覧コンポーネント（`ownerId` による制御）
- `pecus.Frontend/src/app/(dashbord)/workspaces/[code]/WorkspaceDetailClient.tsx` - 一般ユーザー向けワークスペース詳細
- `pecus.Frontend/src/app/(dashbord)/admin/workspaces/edit/[id]/EditWorkspaceClient.tsx` - 管理者向けワークスペース編集

## 更新履歴

- 2025-12-24: Viewer 権限チェック（403 Forbidden）の詳細を追加、API 権限マトリクスを大幅拡充
- 2025-12-16: 初版作成
