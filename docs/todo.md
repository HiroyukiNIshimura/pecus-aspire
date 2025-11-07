

## フロントエンド側の409ハンドリング（メモ & サンプル）

目的: サーバー側の楽観ロック（DbUpdateConcurrencyException → HTTP 409）を受けて、ユーザーにわかりやすく再試行/破棄の選択肢を提示する軽量な実装メモ。

### 🔴 重要: Server Action 側での 409 ハンドリング必須

**修正方針として、以下の対応が確定しています：**

- **対象**: バックエンド API で 409 Conflict を定義しているすべてのメソッド
- **実装場所**: 対応する **Server Action 内** で必ず 409 をキャッチする
- **理由**:
  1. `createPecusApiClients()` はサーバーサイドのみで実行（クライアント側の Axios インターセプターでは機能不可）
  2. グローバルイベント方式は無効（Server Action はサーバーで直列実行される）
  3. 409 キャッチは Server Action で行い、戻り値として型安全にクライアントに返すしかない

**対応状況：**
- ✅ 409 対応必須のサービスメソッド 15 個を特定（grep で確認）
- ✅ **すべての 409 対応メソッドに detectConcurrencyError() を追加**
  - AdminWorkspaceService: `updateWorkspace()`, `activateWorkspace()`, `deactivateWorkspace()`
  - AdminTagService: `updateTag()`, `activateTag()`, `deactivateTag()`
  - AdminSkillService: `updateSkill()`, `activateSkill()`, `deactivateSkill()`
  - AdminUserService: `setUserActiveStatus()`
  - AdminOrganizationService: `updateOrganization()`
  - WorkspaceItemService: `updateWorkspaceItem()` (実装予定)
  - WorkspaceItemTagService: `setTagsToItem()` (実装予定)

### アーキテクチャ背景

現在のアーキテクチャは **Server Action ベース** です：
- `createPecusApiClients()` は **Server Action / API Routes 内でのみ使用**（サーバーサイド実行）
- クライアント側からダイレクトに API は呼ばない
- 409 エラーはサーバーで検出され、クライアントに戻り値で通知される

**このため、グローバルイベント方式は機能しません。** 正しいフローは以下の通り：

1. **Server Action 側**: 409 をキャッチして、エラー情報と最新データを戻り値で返す
2. **Client Component 側**: Server Action からのエラー通知を受けて、モーダルで競合を表示
3. **ユーザー操作**: [再試行]（最新データで再取得）or [キャンセル]（編集破棄）

### 実装箇所（参照）

#### ✅ 既に実装済み
- `pecus.Frontend/src/connectors/api/PecusApiClient.ts`：`ConcurrencyError` クラスと検出ヘルパー `detectConcurrencyError()`
- `pecus.Frontend/src/actions/types.ts`：`ApiResponse<T>` 型定義（conflict/error/success）
- `pecus.Frontend/src/actions/admin/*.ts`：各 Server Action で 409 ハンドリング実装
  - workspace.ts: `updateWorkspace()`, `activateWorkspace()`, `deactivateWorkspace()`
  - tags.ts: `updateTag()`, `activateTag()`, `deactivateTag()`
  - skills.ts: `updateSkill()`, `activateSkill()`, `deactivateSkill()`
  - user.ts: `setUserActiveStatus()`
  - organization.ts / organizations.ts: `updateOrganization()`

#### ⏳ 未実装（将来のタスク）
- `pecus.Frontend/src/components/common/ConcurrencyDialog.tsx`：競合ダイアログコンポーネント
- `pecus.Frontend/src/app/layout.tsx` など：ルート Layout に `ConcurrencyDialog` を配置
- `pecus.Frontend/src/actions/workspace-items.ts`：WorkspaceItem 関連 Server Actions（409 対応）

### 実装フロー

#### 【1】`PecusApiClient.ts` に ConcurrencyError を定義

```typescript
export class ConcurrencyError extends Error {
  public readonly payload: unknown;
  constructor(message: string, payload?: unknown) {
    super(message);
    this.name = "ConcurrencyError";
    this.payload = payload;
  }
}

export function detectConcurrencyError(error: unknown): ConcurrencyError | null {
  // ApiError から 409 を検出して ConcurrencyError に変換
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as Record<string, unknown>).status === 409
  ) {
    const apiError = error as Record<string, unknown>;
    const body = apiError.body ?? {};
    const message = (typeof body === "object" && "message" in body
      ? (body as Record<string, unknown>).message
      : null) || "別のユーザーにより変更されました。";
    return new ConcurrencyError(String(message), body);
  }
  return null;
}
```

#### 【2】Server Action 内で 409 をキャッチ

```typescript
// src/actions/workspace.ts
"use server";

import { createPecusApiClients } from "@/connectors/api/PecusApiClient";
import { detectConcurrencyError, ConcurrencyError } from "@/connectors/api/PecusApiClient";

export async function updateWorkspaceAction(
  id: number,
  input: UpdateWorkspaceInput
): Promise<
  | { success: true }
  | { success: false; error: "conflict"; message: string; latest?: unknown }
  | { success: false; error: "validation" | "server"; message: string }
> {
  try {
    const clients = await createPecusApiClients();
    await clients.adminWorkspace.updateWorkspace(id, input);
    return { success: true };
  } catch (error) {
    // 409 Conflict の検出
    const concurrencyError = detectConcurrencyError(error);
    if (concurrencyError) {
      return {
        success: false,
        error: "conflict",
        message: concurrencyError.message,
        latest: concurrencyError.payload, // 最新データをクライアントに返す
      };
    }

    // その他のエラー処理...
    return {
      success: false,
      error: "server",
      message: "更新に失敗しました。",
    };
  }
}
```

#### 【3】Client Component で 409 エラーをハンドリング

```typescript
// src/components/admin/workspaces/EditWorkspaceForm.tsx
"use client";

import { useState } from "react";
import { updateWorkspaceAction } from "@/actions/workspace";
import { ConcurrencyDialog } from "@/components/common/ConcurrencyDialog";

export default function EditWorkspaceForm({ workspace }) {
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [conflictData, setConflictData] = useState<{
    message: string;
    latest?: unknown;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // フォームデータ取得...
    const result = await updateWorkspaceAction(workspace.id, formData);

    if (!result.success) {
      if (result.error === "conflict") {
        // 409: 競合ダイアログを表示
        setConflictData({
          message: result.message,
          latest: result.latest,
        });
        setShowConflictDialog(true);
        return;
      }

      // その他のエラー...
      setError(result.message);
      return;
    }

    // 成功: リダイレクト等...
    redirect(`/admin/workspaces/${workspace.id}`);
  };

  const handleConflictRetry = () => {
    // 最新データを使って再試行（例: ページリロード）
    window.location.reload();
  };

  const handleConflictCancel = () => {
    setShowConflictDialog(false);
    setConflictData(null);
    // 編集フォームをリセット or 一覧へ戻る
    window.history.back();
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* フォーム内容 */}
      </form>

      {showConflictDialog && conflictData && (
        <ConcurrencyDialog
          message={conflictData.message}
          onRetry={handleConflictRetry}
          onCancel={handleConflictCancel}
        />
      )}
    </>
  );
}
```

#### 【4】ConcurrencyDialog コンポーネント

```typescript
// src/components/common/ConcurrencyDialog.tsx
"use client";

interface ConcurrencyDialogProps {
  message: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function ConcurrencyDialog({
  message,
  onRetry,
  onCancel,
}: ConcurrencyDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded shadow-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold mb-2">競合が発生しました</h3>
        <p className="mb-4 text-gray-700">{message}</p>
        <p className="mb-4 text-sm text-gray-600">
          別のユーザーが変更した可能性があります。最新データを取得して再度試してください。
        </p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRetry}
          >
            再試行
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 注意事項

- **Server Action は自動的にサーバーで実行される** ため、409 エラーはサーバー側で最初に検出される
- `ConcurrencyError` は Server Action 内でのみ使用（クライアント側では戻り値経由で情報を受け取る）
- 最新データが必要な場合は、Server Action の戻り値に含めてクライアントに返す
- `ConcurrencyDialog` は props で制御するため、複数の場所で再利用可能

### テスト

- E2E で 2 クライアント同時更新シナリオを作成
- 2 回目の更新が 409 を受けて、モーダルが表示されることを確認
- [再試行]をクリックしてページリロード後、最新データで再試行できることを確認
- [キャンセル]をクリックして履歴に戻ることを確認

---

## 実装完了状況（2025-01-27）

### ✅ 完了項目

1. **PecusApiClient.ts の拡張**
   - `ConcurrencyError` クラス実装
   - `detectConcurrencyError()` ヘルパー関数実装
   - API エラーから 409 ステータスを自動検出

2. **Server Action 層での 409 ハンドリング実装**
   - すべての 409 対応 API メソッドに対応する Server Action に `detectConcurrencyError()` を追加
   - エラー情報と最新データを型安全に返す `ApiResponse<T>` 型を実装
   - **対応メソッド数: 11 個**

3. **型定義の統一**
   - `ApiResponse<T>` 型を union 型として定義（success | conflict | error）
   - `ConflictResponse<T>`: `error: "conflict"` ケース
   - `ErrorResponse`: `error: "server"` / `error: "validation"` ケース
   - すべての Server Action エラーレスポンスに `message` フィールドを追加

4. **TypeScript 型チェック**
   - ✅ `npx tsc --noEmit` で 0 エラー確認

### ⏳ 次ステップ（UI 層）

1. **ConcurrencyDialog コンポーネント作成**
   - Server Action の error: "conflict" レスポンスを受け取るモーダル
   - [再試行] / [キャンセル] ボタン

2. **Layout 統合**
   - ルート Layout に ConcurrencyDialog を配置
   - グローバルエラー状態管理（Jotai など）と連携

3. **WorkspaceItem 関連の Server Action 実装**
   - `updateWorkspaceItem()`
   - `setTagsToItem()`

### 📝 注記

- Server Action 側での 409 ハンドリングは **必須対応**
- グローバルイベント/Axios インターセプター方式は無効（Server Action のサーバーサイド実行特性により）
- API サービス層（自動生成）は修正不要（既に 409 を errors 定義に含む）
- クライアント側の 409 表示は ConcurrencyDialog コンポーネントで実装予定

（注）このメモは実装の指針用です。実際のファイルパスや既存 API クライアントのインスタンス名に合わせて微調整してください。

