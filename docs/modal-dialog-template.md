# モーダルダイアログ実装リファレンス（AI エージェント向け）

## AI エージェント向け要約（必読）

- **コンテキスト**: FlyonUI を使用したモーダル実装。
- **重要ルール**:
  - **構造**: `fixed inset-0` (オーバーレイ) > `bg-base-100` (コンテナ) > ヘッダー/ボディ/フッター。
  - **スクロール**: ボディ部分 (`flex-1 overflow-y-auto`) のみスクロールさせる。
  - **禁止事項**: `daisyUI` の `<dialog className="modal">` や Headless UI は使用しない。`div` ベースで実装する。
  - **エラー表示**: フッター（アクションボタン）の直前に配置。
- **参照実装**: `pecus.Frontend/src/app/(workspace-full)/workspaces/[code]/CreateWorkspaceItem.tsx`

**参照実装**: `pecus.Frontend/src/app/(workspace-full)/workspaces/[code]/CreateWorkspaceItem.tsx`

---

## ⚠️ 禁止パターン（絶対に使わない）

```html
<!-- ❌ daisyUI の dialog/modal -->
<dialog className="modal">
<div className="modal-box">

<!-- ❌ Headless UI / Radix -->
<Dialog.Root>
<Dialog.Portal>
<Dialog.Overlay>

<!-- ❌ data-* 属性による制御 -->
<div data-modal="true">

<!-- ❌ <dialog> 要素 -->
<dialog open>

<!-- ❌ onClick でオーバーレイを閉じる（ドラッグ操作で意図せず閉じる） -->
<div className="fixed inset-0 ..." onClick={onClose}>
```

**このプロジェクトでは上記は一切使用しない。下記の div ベース実装のみ許可。**

---

## ✅ 正しいモーダル外枠構造

```tsx
{/* オーバーレイ: 固定位置・中央揃え・半透明背景 */}
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  onMouseDown={(e) => {
    // オーバーレイ自身が直接クリックされた場合のみ閉じる
    if (e.target === e.currentTarget) {
      onClose();
    }
  }}
>

  {/* コンテナ: 白背景・角丸・影・最大高さ制限・flex縦並び */}
  <div className="bg-base-100 rounded-box shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

    {/* ヘッダー: shrink-0で固定高さ */}
    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
      <h2 className="text-xl sm:text-2xl font-bold">タイトル</h2>
      <button type="button" className="btn btn-sm btn-circle" aria-label="閉じる">
        <span className="icon-[mdi--close] size-5" aria-hidden="true" />
      </button>
    </div>

    {/* ボディ: flex-1 + overflow-y-auto でスクロール */}
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      {/* コンテンツ */}
    </div>

  </div>
</div>
```

### ⚠️ オーバーレイクリックの注意点

**❌ 禁止パターン**: `onClick` でオーバーレイを閉じる
```tsx
// ❌ ドラッグ操作中にカーソルが外に出るとモーダルが閉じてしまう
<div className="fixed inset-0 ..." onClick={onClose}>
  <div onClick={(e) => e.stopPropagation()}>
```

**✅ 正しいパターン**: `onMouseDown` + `e.target === e.currentTarget` チェック
```tsx
// ✅ マウスボタンを押した瞬間のみ判定、ドラッグ操作でも閉じない
<div
  className="fixed inset-0 ..."
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }}
>
  <div> {/* stopPropagation 不要 */}
```

**理由**: ラジオボタンやスライダー等をクリック＆ドラッグ中にカーソルがモーダル外に出ると、`onClick` では `mouseup` がオーバーレイで発生してモーダルが閉じてしまう。`onMouseDown` + ターゲットチェックでこの問題を回避できる。

---

## フォーム入力パターン

### テキスト入力
```html
<div className="form-control">
  <label htmlFor="fieldName" className="label">
    <span className="label-text font-semibold">ラベル <span className="text-error">*</span></span>
  </label>
  <input
    id="fieldName"
    name="fieldName"
    type="text"
    className={`input input-bordered w-full ${hasError ? 'input-error' : ''}`}
    disabled={isSubmitting}
  />
  {hasError && (
    <div className="label">
      <span className="label-text-alt text-error">エラーメッセージ</span>
    </div>
  )}
</div>
```

### セレクト
```html
<div className="form-control">
  <label htmlFor="selectField" className="label">
    <span className="label-text font-semibold">ラベル</span>
  </label>
  <select
    id="selectField"
    name="selectField"
    className={`select select-bordered w-full ${hasError ? 'select-error' : ''}`}
    disabled={isSubmitting}
  >
    <option value="">未設定</option>
    <option value="value1">選択肢1</option>
  </select>
</div>
```

### チェックボックス（スイッチスタイル）
```html
<div className="form-control">
  <div className="flex items-center gap-3">
    <input type="checkbox" id="checkField" className="switch switch-outline switch-warning" disabled={isSubmitting} />
    <label htmlFor="checkField" className="label-text cursor-pointer">ラベル</label>
  </div>
</div>
```

---

## エラー表示

エラーは更新などのボタンの近くに表示すること。スクロールがあると上部ではユーザーには見えず気が付かないため。

```html
{/* グローバルエラー（API失敗など） */}
{globalError && (
  <div className="alert alert-soft alert-error mb-4">
    <span>{globalError}</span>
  </div>
)}
```

---

## ボタングループ

```html
<div className="flex gap-2 justify-end pt-4 border-t border-base-300">
  <button type="button" className="btn btn-outline" disabled={isSubmitting}>
    キャンセル
  </button>
  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
    {isSubmitting ? (
      <>
        <span className="loading loading-spinner loading-sm"></span>
        処理中...
      </>
    ) : (
      <>
        <span className="icon-[mdi--content-save-outline] w-5 h-5" aria-hidden="true" />
        保存
      </>
    )}
  </button>
</div>
```

---

## 必須ルール

| 項目 | 実装 |
|------|------|
| 非表示時 | `if (!isOpen) return null;` |
| body スクロール | `useEffect` で `document.body.style.overflow = 'hidden'` / クリーンアップで `''` |
| form | `noValidate` 属性を付与 |
| 送信中 | 全入力に `disabled={isSubmitting}` |
| アイコン | `icon-[mdi--xxx]` 形式（Iconify）、`aria-hidden="true"` |
| ボタン | `type="button"` または `type="submit"` を明示 |
| ラベル | `htmlFor` と `id` を対応させる |
