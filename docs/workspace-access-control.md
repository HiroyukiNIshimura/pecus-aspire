# ワークスペースアクセス権限

## 概要

ワークスペースへのアクセス権限は `WorkspaceUser.WorkspaceRole` により制御されます。

## WorkspaceRole

| Role | 値 | 説明 |
|------|---|------|
| Viewer | 1 | 閲覧者（読み取り専用） |
| Member | 2 | メンバー（編集可能） |
| Owner | 3 | オーナー（すべての権限） |

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
| 削除 | `DELETE /api/workspaces/{id}` | - | - | - |

※ 削除は Admin 権限が必要（WorkspaceRole とは別）

## 実装

アクセスチェックは `WorkspaceService` の以下のメソッドで行います：

- `CheckWorkspaceAccessAsync` - Viewer 以上（一覧・詳細取得）
- `CheckWorkspaceMemberOrOwnerAsync` - Member 以上（更新系）
- `CheckWorkspaceOwnerAsync` - Owner のみ（有効化/無効化・メンバー管理）

## レスポンスの CurrentUserRole

ワークスペース詳細取得 API (`WorkspaceFullDetailResponse`) のレスポンスには `currentUserRole` フィールドが含まれます。
これはログインユーザーのそのワークスペースに対するロール（`Viewer` / `Member` / `Owner`）を返します。

フロントエンドではこの値を使って、更新ボタンやメンバー管理ボタンの表示/非表示を制御できます。

## 関連ファイル

- `pecus.WebApi/Controllers/WorkspaceController.cs`
- `pecus.WebApi/Services/WorkspaceService.cs`
- `pecus.WebApi/Models/Responses/Workspace/WorkspaceFullDetailResponse.cs`
- `pecus.Libs/DB/Models/Enums/WorkspaceRole.cs`
