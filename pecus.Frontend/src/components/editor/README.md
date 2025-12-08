## Editor プラグインにおけるプロジェクト固有情報依存一覧

このドキュメントは、`pecus.Frontend/src/components/editor/plugins` 配下のプラグインで
「ワークスペースID（workspaceId）」「アイテムID（itemId）」「セッションID（sessionId）」など
プロジェクト固有の情報（以降、workspace 情報）に依存しているものを洗い出し、
そのプラグインを参照している他のプラグインをまとめたものです。

目的:
- 影響範囲確認（画像アップロードや一時ファイル処理の改修時）
- セキュリティ/テスト/ドキュメント整備のための参照資料

---

### 1) 直接 workspace 情報に依存するプラグイン

- `ImagesPlugin` (path: `plugins/ImagesPlugin/index.tsx`)
  - 参照しているコンテキスト: `useEditorContext()` から `workspaceId`, `itemId`, `sessionId`, `onTempFileUploaded`
  - 実際に呼んでいる API:
    - 既存アイテム編集時: POST `/api/workspaces/${workspaceId}/items/${itemId}/attachments`
    - 新規アイテム（一時領域）: POST `/api/workspaces/${workspaceId}/temp-attachments/${sessionId}`
  - 動作概要:
    - workspace 情報が設定されているとバックエンドへアップロードを行い、返却される URL を挿入
    - workspace 情報がない場合はローカルプレビュー（data URL）でフォールバック
    - 一時アップロード成功時に `onTempFileUploaded?.(tempFileId, previewUrl)` をコール

- `DragDropPastePlugin` (path: `plugins/DragDropPastePlugin/index.ts`)
  - 参照しているコンテキスト: `useEditorContext()` から `workspaceId`, `itemId`, `sessionId`, `onTempFileUploaded`
  - 実際に呼んでいる API:
    - 既存アイテム編集時: POST `/api/workspaces/${workspaceId}/items/${itemId}/attachments`
    - 新規アイテム（一時領域）: POST `/api/workspaces/${workspaceId}/temp-attachments/${sessionId}`
  - 動作概要:
    - ドラッグ&ドロップや貼り付けされた画像ファイルを受け取り、workspace 情報があればサーバーへアップロード
    - アップロード成功時は `INSERT_IMAGE_COMMAND` をディスパッチして挿入
    - 失敗時はローカル data URL を用いたフォールバック挿入

> 補足: workspace 情報は `NotionLikeEditor` の props（`workspaceId`, `itemId`, `sessionId`, `onTempFileUploaded`）として渡され、
> `SettingsContext` の `editorContext` 経由でプラグインに供給されます。

---

### 2) 上記プラグインを参照している／連携するプラグイン

- `ToolbarPlugin` (path: `plugins/ToolbarPlugin/index.tsx`)
  - `InsertImageDialog` を `ImagesPlugin` からインポートして使用
  - ツールバーの「画像挿入」UI からファイルアップロード処理（ImagesPlugin の一時/通常アップロード）をトリガ

- `ComponentPickerPlugin` (path: `plugins/ComponentPickerPlugin/index.tsx`)
  - コマンドパレット（`/`）の「Image」オプションで `InsertImageDialog` を表示

- `DragDropPastePlugin` (path: `plugins/DragDropPastePlugin/index.ts`)
  - `INSERT_IMAGE_COMMAND`（ImagesPlugin が提供）を使用して挿入処理を行う

- `Editor` / `Viewer`（core コンポーネント）
  - どちらも `ImagesPlugin` を組み込んでおり、表示・編集のどちらでも同プラグインの挙動に依存

その他のプラグインは `INSERT_IMAGE_COMMAND` を利用することで間接的に ImagesPlugin の挙動に依存する場合があります。

---

### 3) 影響範囲／注意点

- 画像アップロードの API パスはフロントエンド側で直接ハードコードされています（例: `/api/workspaces/${workspaceId}/items/${itemId}/attachments`）。
  - リファクタ時は API のエンドポイント変更に注意。

- workspace 情報が未設定の場合、現状はローカルプレビューモードで動作します。サーバサイド保存を期待する場合は `NotionLikeEditor` 側で `workspaceId`/`sessionId` を必須化するか、呼び出し元で検証してください。

- 一時アップロード成功時の `onTempFileUploaded` コールバックは、親コンポーネントが一時ファイルIDを受け取ってアイテム作成時に紐付けるために重要です。

---

### 4) テスト／改修時のチェックリスト（推奨）

1. 画像アップロード関連の統合テストを用意する
   - 既存アイテム用アップロード（workspaceId + itemId）
   - 新規アイテム用一時アップロード（workspaceId + sessionId）
   - workspace 情報なし（ローカルプレビュー）
2. `NotionLikeEditor` を利用するページで `workspaceId` / `sessionId` が正しく渡されているかを確認
3. API のエンドポイントを変更する場合、`ImagesPlugin` と `DragDropPastePlugin` の fetch 部分を集中管理（ユーティリティ化）することを検討

---

### 5) 参照元ファイル一覧（抜粋）

- 依存プラグイン
  - `pecus.Frontend/src/components/editor/plugins/ImagesPlugin/index.tsx`
  - `pecus.Frontend/src/components/editor/plugins/DragDropPastePlugin/index.ts`

- 参照しているプラグイン/コンポーネント
  - `pecus.Frontend/src/components/editor/plugins/ToolbarPlugin/index.tsx` (InsertImageDialog を利用)
  - `pecus.Frontend/src/components/editor/plugins/ComponentPickerPlugin/index.tsx` (InsertImageDialog を利用)
  - `pecus.Frontend/src/components/editor/core/Editor.tsx` (ImagesPlugin, DragDropPaste を組み込み)
  - `pecus.Frontend/src/components/editor/core/Viewer.tsx` (ImagesPlugin を組み込み)
  - `pecus.Frontend/src/components/editor/core/NotionLikeEditor.tsx` (editorContext を props 経由で注入)

---

必要があれば、さらに深掘り（例えば各 fetch の headers/認証方法、エラーハンドリングの仕様、バックエンドの API 契約書との突合など）を行い、
改修手順や安全なリファクタ案を作成します。

作成日: 2025-12-08
