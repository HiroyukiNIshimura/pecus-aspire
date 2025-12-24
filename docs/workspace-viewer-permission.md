# ワークスペース Viewer 権限制御

## AI エージェント向け要約（必読）

- ワークスペースには3つの役割がある: `Owner`, `Member`, `Viewer`
- `Viewer` は閲覧専用であり、ワークスペース内のデータ変更操作は禁止
- フロントエンドでは `canEdit = currentUserRole !== 'Viewer'` で判定
- 編集不可の操作を試みた場合は `notify.info()` でユーザーに通知
- バックエンドでも同様の権限チェックを実施（二重チェック）

---

## 概要

ワークスペースの `Viewer` ロールは閲覧専用の権限であり、ワークスペース内のアイテム・タスク・コメント等のデータ変更操作は一切許可されません。

この権限制御はフロントエンドとバックエンドの両方で実施されます。フロントエンドでは主にUX向上のため（無駄なAPI呼び出しを防ぎ、即座にフィードバックを提供）、バックエンドではセキュリティのために実施します。

## ワークスペースロール

| ロール | 説明 | 編集権限 |
|--------|------|----------|
| `Owner` | ワークスペースの所有者。メンバー管理、ワークスペース設定変更が可能 | ✅ |
| `Member` | ワークスペースのメンバー。アイテム・タスクの作成・編集が可能 | ✅ |
| `Viewer` | 閲覧専用。データの閲覧のみ可能 | ❌ |

## フロントエンド実装

### 権限フラグの計算

`WorkspaceDetailClient.tsx` でワークスペース詳細を受け取り、権限フラグを計算します。

```tsx
// WorkspaceDetailClient.tsx
const isOwner = currentWorkspaceDetail.currentUserRole === 'Owner';
const isViewer = currentWorkspaceDetail.currentUserRole === 'Viewer';
const canEdit = !isViewer; // Owner または Member の場合は編集可能
```

### Props による権限の伝播

`canEdit` フラグは子コンポーネントに Props として渡されます。

```tsx
// 子コンポーネントへの伝播例
<WorkspaceItemsSidebar canEdit={canEdit} />
<WorkspaceItemDetail canEdit={canEdit} />
<WorkspaceTasks canEdit={canEdit} />
```

### 編集操作時のチェック

各コンポーネントで編集操作を行う前に `canEdit` をチェックし、`false` の場合は操作を中断してユーザーに通知します。

```tsx
const handleEditClick = () => {
  if (!canEdit) {
    notify.info('あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。');
    return;
  }
  // 編集処理を続行
};
```

### 通知メッセージ

Viewer が編集操作を試みた場合に表示される統一メッセージ:

> あなたのワークスペースに対する役割が閲覧専用のため、この操作は実行できません。

`notify.info()` を使用し、エラーではなく情報として通知します。

## 制限される操作一覧

### アイテム関連
- アイテムの新規作成
- アイテムの編集（件名、本文、タグ）
- アイテムの属性変更（担当者、コミッター、期限、優先度）
- アイテムのアーカイブ/アーカイブ解除
- 関連アイテムの追加/削除
- ドキュメントツリーでの親子関係変更（ドラッグ&ドロップ）

### タスク関連
- タスクの新規作成
- タスクの編集（内容、担当者、期限、工数、進捗率等）
- タスクの完了/破棄

### コメント関連
- タスクコメントの投稿
- タスクコメントの編集
- タスクコメントの削除

## 許可される操作

Viewer でも以下の操作は許可されます:

- ワークスペース詳細の閲覧
- アイテム一覧・詳細の閲覧
- タスク一覧・詳細の閲覧
- コメントの閲覧
- フィルター・検索の使用
- エクスポート（PDF/Markdown）
- PIN の追加/削除（個人設定のため）
- タイムラインの閲覧

## 実装上の注意点

### ボタンの無効化 vs クリック時チェック

現在の実装では、ボタンを無効化（`disabled`）するのではなく、クリック時に権限チェックを行い通知を表示する方式を採用しています。これには以下の理由があります:

1. **一貫したユーザー体験**: 機能が存在することは認識でき、なぜ使えないかを明確に伝えられる
2. **実装の簡潔さ**: 条件付きレンダリングやスタイル変更が不要
3. **アクセシビリティ**: 無効化されたボタンはスクリーンリーダーで読み上げられない場合がある

### ドラッグ&ドロップの制御

ドキュメントツリーのドラッグ&ドロップは特殊な制御が必要です:

```tsx
// DocumentTreeSidebar.tsx
canDrop={(_tree, { dragSource, dropTargetId }) => {
  // 編集権限がない場合はドロップ不可
  if (!canEdit) {
    return false;
  }
  // その他の条件...
}}
```

また、`handleDrop` でも権限チェックを行い、万が一ドロップが実行された場合も処理を中断します。

## 関連ファイル

| ファイル | 役割 |
|----------|------|
| `WorkspaceDetailClient.tsx` | 権限フラグの計算と子コンポーネントへの伝播 |
| `WorkspaceItemsSidebar.tsx` | サイドバーの「追加」ボタン制御 |
| `DocumentTreeSidebar.tsx` | ドラッグ&ドロップ制御 |
| `CreateWorkspaceItem.tsx` | アイテム作成モーダル |
| `EditWorkspaceItem.tsx` | アイテム編集モーダル |
| `WorkspaceItemDetail.tsx` | アイテム詳細の編集ボタン制御 |
| `WorkspaceItemDrawer.tsx` | アイテム属性変更の制御 |
| `WorkspaceTasks.tsx` | タスク追加ボタン制御 |
| `CreateWorkspaceTaskModal.tsx` | タスク作成モーダル |
| `WorkspaceTaskDetailPage.tsx` | タスク編集フォーム |
| `TaskCommentSection.tsx` | コメント投稿・編集・削除 |

## バックエンドとの連携

フロントエンドの権限チェックはあくまでUX向上のためであり、セキュリティはバックエンドで担保されます。バックエンドでは各APIエンドポイントでワークスペースロールを確認し、Viewer からの変更リクエストは拒否します。

詳細は `docs/backend-guidelines.md` を参照してください。
