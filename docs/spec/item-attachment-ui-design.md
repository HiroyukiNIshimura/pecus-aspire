# アイテム添付ファイルUI設計

## AI エージェント向け要約（必読）

- 添付ファイルUIは `src/components/workspaceItems/attachments/` 配下に配置
- **ヘッダーボタンからモーダルを開く方式**（本文が長くてもスクロール不要）
- ドラッグ＆ドロップとクリック選択の両方に対応
- **削除確認はインラインUI**（モーダルの上にモーダルを重ねない）
- FlyonUIのスタイルに準拠（daisyUI禁止）
- アイコンは `@iconify/tailwind4` を使用
- Server Actions 経由でAPI呼び出し（直接fetch禁止）
- Viewerはアップロード・削除不可（閲覧のみ）

---

## 概要

ワークスペースアイテムに対して添付ファイルをアップロード・ダウンロード・削除できる機能のUI設計。

### UIアクセス方式

**ヘッダーボタン + モーダル方式**を採用。

理由：
- 本文が長くても常にアクセス可能（スクロール不要）
- 既存のUIパターン（PIN、履歴、フローマップボタン）と統一感がある
- モーダルで操作するので、本文を見ながら添付ファイルも確認できる

### 配置場所

**ヘッダーボタン**: `WorkspaceItemDetail.tsx` のヘッダー部分、タイムラインボタンの隣

```tsx
{/* 添付ファイルボタン */}
<button
  type="button"
  onClick={() => setIsAttachmentModalOpen(true)}
  className="btn btn-secondary btn-sm gap-1"
  title="添付ファイル"
>
  <span className="icon-[mdi--paperclip] size-4" aria-hidden="true" />
  {attachmentCount > 0 && <span className="text-xs">{attachmentCount}</span>}
</button>
```

**モーダル**: `ItemAttachmentModal.tsx` をページ下部に配置

---

## UI構成

### ヘッダーボタン

```
┌─────────────────────────────────────────────────────────┐
│ アイテム件名                                              │
│ #CODE-123                                               │
│                                                         │
│           [📌 PIN] [🕐 履歴] [📎 3] [🗺️] [✏️ 編集] [≡]   │
│                              ↑                          │
│                        添付ファイルボタン                  │
└─────────────────────────────────────────────────────────┘
```

### 添付ファイルモーダル

```
┌─────────────────────────────────────────────────────┐
│ 📎 添付ファイル (3)                            [×]   │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ ここにファイルをドラッグ＆ドロップ                     │ │
│ │ またはクリックしてファイルを選択                       │ │
│ │ （最大20MB / PDF, Word, Excel, 画像など）            │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ファイル一覧:                                         │
│ ┌───────────────────────────────────────────────┐   │
│ │ 📄 設計書_v2.pdf          2.3MB    山田太郎   🗑️ │   │
│ │ 📊 売上データ.xlsx        156KB    鈴木花子   🗑️ │   │
│ │ 🖼️ スクリーンショット.png  89KB    山田太郎   🗑️ │   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 機能要件

### ドラッグ＆ドロップエリア

- 視覚的なフィードバック（ドラッグ中はハイライト）
- クリックでファイル選択ダイアログを開く
- 複数ファイル同時アップロード対応
- 許可ファイル形式・サイズ制限の表示
- Viewerの場合は非表示

### ファイル一覧

- ファイルタイプ別アイコン表示
  - PDF: `icon-[mdi--file-pdf-box]` (text-error)
  - Word: `icon-[mdi--file-word-box]` (text-info)
  - Excel: `icon-[mdi--file-excel-box]` (text-success)
  - PowerPoint: `icon-[mdi--file-powerpoint-box]` (text-warning)
  - 画像: `icon-[mdi--file-image]` (text-secondary)
  - テキスト/CSV: `icon-[mdi--file-document-outline]`
  - ZIP/RAR: `icon-[mdi--folder-zip]`
  - その他: `icon-[mdi--file]`
- ファイル名（クリックでダウンロード）
- ファイルサイズ（人間可読形式: KB, MB）
- アップロード者名
- アップロード日時
- 削除ボタン（権限がある場合のみ表示）
- **削除時はインライン確認UIを表示**（モーダルの上にモーダルを重ねない）
- アップロード中のプログレス表示

### 権限制御

| 権限 | アップロード | ダウンロード | 削除 |
|------|------------|------------|------|
| Owner | ✅ | ✅ | ✅（全ファイル） |
| Member | ✅ | ✅ | ✅（自分がアップロードしたもののみ） |
| Viewer | ❌ | ✅ | ❌ |

---

## コンポーネント構成

```
src/components/workspaceItems/attachments/
├── ItemAttachmentModal.tsx           # モーダル（親コンポーネント）
├── AttachmentDropzone.tsx            # ドラッグ＆ドロップエリア
├── AttachmentList.tsx                # ファイル一覧
├── AttachmentListItem.tsx            # 個別ファイル行（インライン削除確認含む）
└── AttachmentUploadProgress.tsx      # アップロード中の進捗表示
```

### ItemAttachmentModal.tsx

モーダル全体を管理する親コンポーネント。

Props:
- `isOpen: boolean`
- `onClose: () => void`
- `workspaceId: number`
- `itemId: number`
- `initialAttachments: WorkspaceItemAttachmentResponse[]`
- `canEdit: boolean` - Viewer以外はtrue
- `currentUserId: number` - 削除権限判定用
- `onAttachmentCountChange?: (count: number) => void` - ヘッダーボタンのバッジ更新用

### AttachmentDropzone.tsx

ドラッグ＆ドロップとファイル選択を処理。

Props:
- `onFilesSelected: (files: File[]) => void`
- `disabled?: boolean`
- `maxFileSize: number` - バイト単位
- `allowedExtensions: string[]`

### AttachmentList.tsx

ファイル一覧を表示。

Props:
- `attachments: WorkspaceItemAttachmentResponse[]`
- `uploadingFiles: UploadingFile[]` - アップロード中のファイル
- `onDelete: (attachmentId: number) => void`
- `canDelete: (attachment: WorkspaceItemAttachmentResponse) => boolean`
- `workspaceId: number`
- `itemId: number`

### AttachmentListItem.tsx

個別ファイルの表示。**インライン削除確認UI**を内包する。

Props:
- `attachment: WorkspaceItemAttachmentResponse`
- `onDelete: () => Promise<void>`
- `canDelete: boolean`
- `downloadUrl: string`

内部状態:
- `isConfirmingDelete: boolean` - 削除確認モード
- `isDeleting: boolean` - 削除処理中

### AttachmentUploadProgress.tsx

アップロード中のファイル表示。

Props:
- `fileName: string`
- `progress: number` - 0-100
- `onCancel?: () => void`

---

## デザイン仕様（FlyonUI準拠）

### ドロップゾーン（通常時）

```tsx
<div className="border-2 border-dashed border-base-300 rounded-lg p-6 text-center
               hover:border-primary/50 hover:bg-base-200/50 transition-all cursor-pointer">
  <span className="icon-[mdi--cloud-upload-outline] size-10 text-base-content/40 mb-2" />
  <p className="text-sm text-base-content/60">
    ここにファイルをドラッグ＆ドロップ
  </p>
  <p className="text-xs text-base-content/40 mt-1">
    またはクリックしてファイルを選択
  </p>
  <p className="text-xs text-base-content/40 mt-2">
    最大20MB / PDF, Word, Excel, 画像など
  </p>
</div>
```

### ドロップゾーン（ドラッグ中）

```tsx
<div className="border-2 border-dashed border-primary bg-primary/10
               rounded-lg p-6 text-center scale-[1.02] transition-all">
  <span className="icon-[mdi--cloud-upload] size-10 text-primary mb-2" />
  <p className="text-sm text-primary font-medium">
    ファイルをドロップしてアップロード
  </p>
</div>
```

### ファイル一覧アイテム

```tsx
<div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg
               hover:bg-base-300 transition-colors group">
  {/* ファイルタイプアイコン */}
  <span className="icon-[mdi--file-pdf-box] size-6 text-error shrink-0" />

  {/* ファイル情報 */}
  <div className="flex-1 min-w-0">
    <a
      href={downloadUrl}
      download
      className="font-medium text-sm truncate block hover:underline hover:text-primary"
    >
      設計書_v2.pdf
    </a>
    <p className="text-xs text-base-content/60">
      2.3MB • 山田太郎 • 12/25
    </p>
  </div>

  {/* 削除ボタン */}
  <button
    className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
    aria-label="削除"
  >
    <span className="icon-[mdi--trash-can-outline] size-4" />
  </button>
</div>
```

### アップロード中

```tsx
<div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg animate-pulse">
  <span className="icon-[mdi--loading] size-6 text-primary animate-spin shrink-0" />
  <div className="flex-1 min-w-0">
    <p className="font-medium text-sm truncate">アップロード中...</p>
    <div className="w-full bg-base-300 rounded-full h-1.5 mt-1">
      <div className="bg-primary h-1.5 rounded-full" style={{ width: '45%' }} />
    </div>
  </div>
</div>
```

### インライン削除確認UI

ファイル削除時はモーダルではなく、**行をインライン確認UIに置き換える**。
モーダルの上にモーダルを重ねない設計。

```tsx
// 通常表示
<div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg ...">
  {/* ファイル情報... */}
</div>

// 削除確認モード（isConfirmingDelete === true）
<div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning rounded-lg">
  <span className="icon-[mdi--alert] size-5 text-warning shrink-0" />
  <span className="flex-1 text-sm truncate">
    「<span className="font-medium">{fileName}</span>」を削除しますか？
  </span>
  <button
    type="button"
    onClick={() => setIsConfirmingDelete(false)}
    className="btn btn-sm"
    disabled={isDeleting}
  >
    キャンセル
  </button>
  <button
    type="button"
    onClick={handleDelete}
    className="btn btn-error btn-sm"
    disabled={isDeleting}
  >
    {isDeleting ? (
      <>
        <span className="loading loading-spinner loading-xs" />
        削除中
      </>
    ) : (
      '削除'
    )}
  </button>
</div>
```

**メリット:**
- モーダル重ねの複雑さがない
- どのファイルを削除するか視覚的に明確
- 画面チラつきなし
- 実装がシンプル

---

## API・Server Actions

### 使用するServer Actions

```typescript
// src/actions/workspaceItemAttachment.ts

// 一覧取得
fetchWorkspaceItemAttachments(workspaceId: number, itemId: number)

// 削除
deleteWorkspaceItemAttachment(workspaceId: number, itemId: number, attachmentId: number)
```

### アップロード

アップロードはNext.js API Route経由で行う（FormData送信のため）:

```typescript
// POST /api/workspaces/{id}/items/{itemId}/attachments
const formData = new FormData();
formData.append('file', file);

const response = await fetch(
  `/api/workspaces/${workspaceId}/items/${itemId}/attachments`,
  {
    method: 'POST',
    body: formData,
  }
);
```

### ダウンロード

```typescript
// ダウンロードURL生成
const downloadUrl = `/api/workspaces/${workspaceId}/items/${itemId}/attachments/${fileName}?download=true`;

// <a href={downloadUrl} download>ファイル名</a>
```

---

## ファイル制限（設定値）

| 項目 | 値 | 設定キー |
|------|-----|---------|
| 最大ファイルサイズ | 20MB | `FileUpload.MaxAttachmentFileSize` |
| 許可拡張子 | .jpg, .jpeg, .png, .gif, .webp, .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .txt, .csv, .zip, .rar | `FileUpload.AllowedAttachmentExtensions` |
| 許可MIMEタイプ | image/*, application/pdf, application/msword, ... | `FileUpload.AllowedAttachmentMimeTypes` |

---

## 実装順序

1. **AttachmentDropzone.tsx** - ドラッグ＆ドロップ + ファイル選択
2. **AttachmentListItem.tsx** - ファイル表示 + ダウンロード + インライン削除確認
3. **AttachmentUploadProgress.tsx** - アップロード進捗
4. **AttachmentList.tsx** - 一覧 + アップロード中表示
5. **ItemAttachmentModal.tsx** - モーダル統合
6. **WorkspaceItemDetail.tsx への組み込み** - ヘッダーボタン追加 + モーダル配置

---

## エラーハンドリング

| シナリオ | 対応 |
|---------|------|
| ファイルサイズ超過 | アップロード前にクライアント側でチェック、エラートースト表示 |
| 非許可拡張子 | アップロード前にクライアント側でチェック、エラートースト表示 |
| アップロード失敗 | エラートースト表示、リトライ促進 |
| 削除失敗 | エラートースト表示 |
| 権限エラー（403） | エラートースト表示 |
| ネットワークエラー | エラートースト表示、リトライ促進 |

---

## アクセシビリティ

- ドロップゾーンは `<input type="file">` を内包し、キーボード操作可能
- 削除ボタンには `aria-label="削除"` を設定
- ダウンロードリンクには `download` 属性を設定
- アップロード中は `aria-busy="true"` を設定
- エラーメッセージは `role="alert"` を設定
