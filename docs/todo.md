

## フロントエンド側の409ハンドリング（メモ & サンプル）

目的: サーバー側の楽観ロック（DbUpdateConcurrencyException → HTTP 409）を受けて、ユーザーにわかりやすく再試行/破棄の選択肢を提示する軽量な実装メモ。

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

- `pecus.Frontend/src/connectors/api/PecusApiClient.ts`：`ConcurrencyError` クラスと検出ヘルパー
- `pecus.Frontend/src/actions/`：各 Server Action 内で 409 をキャッチして戻り値で返す
- `pecus.Frontend/src/components/common/ConcurrencyDialog.tsx`：競合ダイアログコンポーネント
- `pecus.Frontend/src/app/layout.tsx` など：ルート Layout に `ConcurrencyDialog` を配置

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

（注）このメモは実装の指針用です。実際のファイルパスや既存 API クライアントのインスタンス名に合わせて微調整してください。

