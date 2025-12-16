# UI コンポーネント実装ガイドライン

## AI エージェント向け要約（必読）

- **コンテキスト**: フロントエンド UI 実装ルール。
- **重要ルール**:
  - **エラー表示**: フォーム送信ボタンの**直前**に配置する（上部は禁止）。
  - **モーダル**: `docs/modal-dialog-template.md` に従う。`dialog` 要素と `.modal` クラスを使用。
  - **スクロール**: メインコンテンツ領域のみスクロールさせ、ヘッダー/サイドバーは固定。
  - **アイコン**: `@iconify/tailwind4` を使用（例: `icon-[mdi--home]`）。
- **関連ファイル**: `docs/modal-dialog-template.md`

## 概要

このドキュメントは、フロントエンドの UI コンポーネント実装における必須ルールを定義します。
エージェントは**必ず**これらのルールに従ってください。違反は UX の低下やユーザーの混乱を招きます。

---

## 1. エラー表示の配置（最重要）

### ❌ 禁止: エラー表示をフォーム/コンテンツの上部に配置

スクロール可能なフォームやモーダルで、送信ボタンが画面下部にある場合、エラー表示を上部に配置してはいけません。

**理由:**
- ユーザーは送信ボタンをクリックした後、視線はボタン付近にある
- エラーが上部に表示されても気づかない
- 特にスマートフォンでは致命的な UX 問題となる

### ✅ 必須: エラー表示は送信ボタンの直前に配置

```tsx
// ✅ 正しい実装
<form onSubmit={handleSubmit}>
  {/* フォームフィールド */}
  <div className="form-control">...</div>
  <div className="form-control">...</div>

  {/* サーバーエラー表示（ボタンの直前） */}
  {serverErrors.length > 0 && (
    <div className="alert alert-soft alert-error">
      <span className="icon-[mdi--alert-circle] size-6 shrink-0" aria-hidden="true" />
      <div>
        <h3 className="font-bold">エラーが発生しました</h3>
        <ul className="list-disc list-inside mt-1">
          {serverErrors.map((error) => (
            <li key={error.key}>{error.message}</li>
          ))}
        </ul>
      </div>
    </div>
  )}

  {/* 送信ボタン */}
  <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
    <button type="button" onClick={onClose}>キャンセル</button>
    <button type="submit">保存</button>
  </div>
</form>
```

### ✅ 必須: トースト通知も併用する

エラー発生時は、フォーム内のエラー表示に加えて**トースト通知**も表示してください。
これにより、ユーザーがスクロール位置に関係なくエラーに気づけます。

```tsx
// ✅ 正しい実装
if (!result.success) {
  const errorMessage = result.message || 'エラーが発生しました';
  setServerErrors([{ key: 0, message: errorMessage }]);
  notify.error(errorMessage);  // トースト通知も表示
  return;
}
```

---

## 2. フラグメントスクロール（SPA 遷移時）

### ❌ 禁止: フラグメント（`#section`）だけに頼ったスクロール

Next.js などの SPA でページ遷移する際、フラグメントによるスクロールはブラウザのネイティブ動作に依存します。
クライアントサイドルーティングでは、DOM が構築される前にフラグメント処理が実行されるため、スクロールが動作しません。

### ✅ 必須: useEffect で DOM 構築後にスクロールを実行

```tsx
'use client';

import { useEffect, useState } from 'react';

export default function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  // データ取得
  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  // URLフラグメントによるスクロール（DOM構築後に実行）
  useEffect(() => {
    if (isLoading || !data) return;

    const hash = window.location.hash;
    if (hash) {
      // DOM が完全に構築されるまで少し待つ
      const timeoutId = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, data]);

  return (
    <div>
      <section id="overview">...</section>
      <section id="tasks">...</section>  {/* #tasks でスクロール可能 */}
    </div>
  );
}
```

**ポイント:**
1. `isLoading` と `data` を依存配列に含め、データ取得完了後に実行
2. `setTimeout` で DOM レンダリング完了を待つ（100ms 程度）
3. `scrollIntoView` でスムーズスクロール

---

## 3. モーダルの実装ルール

### ✅ 必須: ESC キーでモーダルを閉じる

```tsx
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);
```

### ✅ 必須: オーバーレイクリックでモーダルを閉じる

```tsx
<div
  className="fixed inset-0 z-50 bg-black/50"
  onClick={onClose}  // オーバーレイクリックで閉じる
>
  <div
    className="modal-content"
    onClick={(e) => e.stopPropagation()}  // コンテンツ内クリックは伝播停止
  >
    {/* モーダルコンテンツ */}
  </div>
</div>
```

---

## 4. ローディング状態の表示

### ✅ 必須: 送信中はボタンを disabled にする

```tsx
<button
  type="submit"
  className="btn btn-primary"
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <span className="loading loading-spinner loading-sm" />
      保存中...
    </>
  ) : (
    '保存'
  )}
</button>
```

### ✅ 必須: データ取得中はスケルトンまたはスピナーを表示

```tsx
{isLoading ? (
  <div className="flex justify-center items-center py-8">
    <span className="loading loading-spinner loading-lg" />
  </div>
) : (
  <div>{/* コンテンツ */}</div>
)}
```

---

## 5. アイコンの使用

### ✅ 必須: Iconify（@iconify/tailwind4）を使用

```tsx
// ✅ 正しい実装
<span className="icon-[mdi--alert-circle] size-6" aria-hidden="true" />
<span className="icon-[mdi--check] size-5" aria-hidden="true" />

// ❌ 禁止: インライン SVG
<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">...</svg>

// ❌ 禁止: daisyUI のアイコン
```

**参照:** https://iconify.design/

---

## 6. チェックリスト

新しいフォーム/モーダルを実装する際は、以下を確認してください：

- [ ] エラー表示は送信ボタンの直前に配置しているか
- [ ] エラー発生時にトースト通知も表示しているか
- [ ] フラグメントスクロールは useEffect で実装しているか
- [ ] モーダル表示時に body スクロールを無効化しているか
- [ ] ESC キーでモーダルが閉じるか
- [ ] オーバーレイクリックでモーダルが閉じるか
- [ ] 送信中はボタンが disabled になるか
- [ ] ローディング中に適切な表示があるか
- [ ] アイコンは Iconify を使用しているか

---

## 更新履歴

- 2025-12-14: 初版作成
