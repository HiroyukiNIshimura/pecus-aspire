

## フロントエンド側の409ハンドリング（メモ & サンプル）

目的: サーバー側の楽観ロック（DbUpdateConcurrencyException → HTTP 409）を受けて、ユーザーにわかりやすく再試行/破棄の選択肢を提示する軽量な実装メモ。

方針（シンプル推奨）
- Axios インターセプターで HTTP 409 を検出 → グローバルイベント `pecus:conflict` を発火
- ルート Layout に `ConcurrencyDialog` コンポーネントを置き、イベント受信でモーダル表示
- モーダルに [再試行]（最新データ取得／`window.location.reload()`）と [キャンセル]（編集破棄・一覧へ戻る）を配置

実装箇所（参照）
- 編集対象（手動編集可）: `pecus.Frontend/src/connectors/api/PecusApiClient.ts`（interceptor追加）
- 自動生成ファイル（編集禁止）: `pecus.Frontend/src/connectors/api/PecusApiClient.generated.ts`
- UI コンポーネント: `pecus.Frontend/src/components/common/ConcurrencyDialog.tsx`
- 配置: ルート Layout（`src/app/layout.tsx` 等）に `ConcurrencyDialog` を追加

サーバー側協力点
- 409 レスポンスに短いユーザー向け `message` と必要なら最新データ（`current`）を含めると UX が良好

注意事項
- 自動生成クライアントは編集しないこと（generate スクリプトにより上書きされる）
- まずは最小実装（全ページ reload）で運用し、必要に応じてリソース単位の差分再取得ロジックに拡張する

---

サンプル: `PecusApiClient.ts` に追加する Axios interceptor（例）

```ts
// PecusApiClient.ts - 例: Axios インスタンスに 409 ハンドリングを追加
import axios from "axios";

export class ConcurrencyError extends Error {
   public payload: any;
   constructor(message: string, payload?: any) {
      super(message);
      this.name = "ConcurrencyError";
      this.payload = payload;
   }
}

export const apiClient = axios.create({
   baseURL: process.env.API_BASE_URL,
   withCredentials: true,
   // 他の設定
});

apiClient.interceptors.response.use(
   (res) => res,
   (error) => {
      const resp = error?.response;
      if (resp && resp.status === 409) {
         // サーバーが返す形に合わせて抽出
         const payload = resp.data ?? { message: "別のユーザーにより変更されました。" };
         const message = payload.message ?? "別のユーザーが変更しました。";

         // グローバルイベント発火（ページ側でリスンしてモーダルを表示）
         try {
            window.dispatchEvent(new CustomEvent("pecus:conflict", { detail: { message, payload } }));
         } catch (e) {
            // SSR などで window が無い場合は無視
         }

         // 呼び出し元で処理したければカスタム例外を投げる
         return Promise.reject(new ConcurrencyError(message, payload));
      }

      return Promise.reject(error);
   }
);

export default apiClient;
```

サンプル: `ConcurrencyDialog.tsx`（簡易モーダル）

```tsx
"use client";

import { useEffect, useState } from "react";

export default function ConcurrencyDialog() {
   const [open, setOpen] = useState(false);
   const [message, setMessage] = useState<string | null>(null);

   useEffect(() => {
      const handler = (e: Event) => {
         const detail = (e as CustomEvent).detail ?? {};
         setMessage(detail.message ?? "別のユーザーが変更しました。");
         setOpen(true);
      };
      window.addEventListener("pecus:conflict", handler as EventListener);
      return () => window.removeEventListener("pecus:conflict", handler as EventListener);
   }, []);

   if (!open) return null;

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
         <div className="bg-white rounded shadow-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-2">競合が発生しました</h3>
            <p className="mb-4">{message}</p>

            <div className="flex justify-end gap-2">
               <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                     setOpen(false);
                     // キャンセル: 編集破棄して一覧へ戻る等に変更可能
                     window.history.back();
                  }}
               >
                  キャンセル
               </button>

               <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                     setOpen(false);
                     // 再試行: シンプルにページ全体を再読み込み
                     window.location.reload();
                  }}
               >
                  再試行
               </button>
            </div>
         </div>
      </div>
   );
}
```

導入手順（短いガイド）
1. `PecusApiClient.ts`（手動編集可能なファイル）に interceptor を追加する。
2. `ConcurrencyDialog.tsx` を `pecus.Frontend/src/components/common/` に作成する。
3. ルート Layout（`src/app/layout.tsx` 等）に `<ConcurrencyDialog />` を置く。
4. サーバー側は 409 レスポンスに `message` や `current` を含めるようにすると UX が良い。

テスト
- E2E で 2 クライアント同時更新シナリオを作り、2 回目が 409 を受けてモーダルが表示されることを確認する。

---

（注）このメモは実装の指針用です。実際のファイルパスや既存 API クライアントのインスタンス名に合わせて微調整してください。

