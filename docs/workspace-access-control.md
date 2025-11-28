# ワークスペースアクセス権限

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

### WorkspaceController（一般ユーザー向け API）

| 操作 | エンドポイント | Viewer | Member | Owner |
|------|---------------|:------:|:------:|:-----:|
| 一覧取得 | `GET /api/workspaces` | ✅ | ✅ | ✅ |
| 詳細取得 | `GET /api/workspaces/{id}` | ✅ | ✅ | ✅ |
| 詳細取得(code) | `GET /api/workspaces/code/{code}` | ✅ | ✅ | ✅ |
| アイテム一覧 | `GET /api/workspaces/{id}/items` | ✅ | ✅ | ✅ |
| 更新 | `PUT /api/workspaces/{id}` | ❌ | ✅ | ✅ |
| 有効化 | `POST /api/workspaces/{id}/activate` | ❌ | ❌ | ✅ |
| 無効化 | `POST /api/workspaces/{id}/deactivate` | ❌ | ❌ | ✅ |
| メンバー追加 | `POST /api/workspaces/{id}/members` | ❌ | ❌ | ✅ |
| メンバー削除 | `DELETE /api/workspaces/{id}/members/{userId}` | ❌ | ❌ | ✅ |
| メンバーロール変更 | `PATCH /api/workspaces/{id}/members/{userId}/role` | ❌ | ❌ | ✅ |
| 削除 | `DELETE /api/workspaces/{id}` | - | - | - |

※ 削除は Admin 権限が必要（WorkspaceRole とは別）

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

アクセスチェックは `WorkspaceService` の以下のメソッドで行います：

- `CheckWorkspaceAccessAsync` - Viewer 以上（一覧・詳細取得）
- `CheckWorkspaceMemberOrOwnerAsync` - Member 以上（更新系）
- `CheckWorkspaceOwnerAsync` - Owner のみ（有効化/無効化・メンバー管理・ロール変更）

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
