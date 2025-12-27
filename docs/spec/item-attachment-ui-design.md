# アイテム添付ファイルUI設計

## AI エージェント向け要約（必読）

- 添付ファイルUIは `src/components/workspaceItems/attachments/` 配下に配置
- ドラッグ＆ドロップとクリック選択の両方に対応
- FlyonUIのスタイルに準拠（daisyUI禁止）
- アイコンは `@iconify/tailwind4` を使用
- Server Actions 経由でAPI呼び出し（直接fetch禁止）
- Viewerはアップロード・削除不可（閲覧のみ）

---

## 概要

ワークスペースアイテムに対して添付ファイルをアップロード・ダウンロード・削除できる機能のUI設計。

### 配置場所

`pecus.Frontend/src/app/(workspace-full)/workspaces/[code]/WorkspaceItemDetail.tsx` 内、「タグ」セクションと「関連アイテム」セクションの間。

---

## UI構成

```
┌─────────────────────────────────────────────────────┐
│ 📎 添付ファイル (3)                    [＋ファイル追加] │
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
├── ItemAttachmentSection.tsx      # 親コンポーネント（セクション全体）
├── AttachmentDropzone.tsx         # ドラッグ＆ドロップエリア
├── AttachmentList.tsx             # ファイル一覧
├── AttachmentListItem.tsx         # 個別ファイル行
└── AttachmentUploadProgress.tsx   # アップロード中の進捗表示
```

### ItemAttachmentSection.tsx

セクション全体を管理する親コンポーネント。

Props:
- `workspaceId: number`
- `itemId: number`
- `initialAttachments: WorkspaceItemAttachmentResponse[]`
- `canEdit: boolean` - Viewer以外はtrue
- `currentUserId: number` - 削除権限判定用

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

個別ファイルの表示。

Props:
- `attachment: WorkspaceItemAttachmentResponse`
- `onDelete?: () => void`
- `canDelete: boolean`
- `downloadUrl: string`

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
2. **AttachmentListItem.tsx** - ファイル表示 + ダウンロード + 削除
3. **AttachmentUploadProgress.tsx** - アップロード進捗
4. **AttachmentList.tsx** - 一覧 + アップロード中表示
5. **ItemAttachmentSection.tsx** - セクション統合
6. **WorkspaceItemDetail.tsx への組み込み**

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
