# エディタコンポーネント

このディレクトリには、Notion風のリッチテキストエディタ（Lexical ベース）が含まれています。

## 🏗️ アーキテクチャ

エディタは以下の3層構造で設計されています：

```
src/components/editor/
├── types/          # 型定義（汎用 + Pecus固有）
├── core/           # 汎用エディタコア（将来のパッケージ化候補）
│   ├── Editor.tsx              # 汎用エディタ本体
│   ├── Viewer.tsx              # 汎用ビューア
│   ├── NotionLikeEditor.tsx    # Notion風エディタ統合
│   ├── NotionLikeViewer.tsx    # Notion風ビューア統合
│   └── index.ts                # エクスポート
├── pecus/          # Pecus固有の拡張機能
│   ├── PecusNotionLikeEditor.tsx   # core/NotionLikeEditor のラッパー
│   ├── PecusNotionLikeViewer.tsx   # core/NotionLikeViewer のラッパー
│   └── index.ts                    # エクスポート
├── context/        # 共有コンテキスト
├── plugins/        # エディタプラグイン
├── nodes/          # カスタムノード定義
├── themes/         # テーマ設定
└── ui/             # UIコンポーネント
```

### 設計方針

#### 1. **types/** - 型定義
エディタの公開インターフェースを定義します。
- `CoreEditorProps`: 汎用エディタのProps
- `PecusEditorProps`: Pecus固有の拡張Props
- `EditorSettings`, `EditorContext`: 設定とコンテキスト型

#### 2. **core/** - 汎用エディタコア
Pecusに依存しない汎用的な機能のみを含みます。
- `Editor.tsx`: Lexical エディタ本体
- `Viewer.tsx`: Lexical ビューア本体
- `NotionLikeEditor.tsx`: Notion風エディタ統合（汎用）
- `NotionLikeViewer.tsx`: Notion風ビューア統合（汎用）
- 標準プラグインの統合
- 将来的なパッケージ化の候補

**依存関係**: `types/` のみ依存可能。`pecus/` への依存は禁止。

#### 3. **pecus/** - Pecus固有の拡張
Pecusプロジェクト固有の機能を含みます。
- `PecusNotionLikeEditor.tsx`: `core/NotionLikeEditor` のラッパー
- `PecusNotionLikeViewer.tsx`: `core/NotionLikeViewer` のラッパー
- ワークスペース連携（画像アップロード等）
- セッション管理

**現状**: core/ のコンポーネントをそのまま再エクスポート。将来的にPecus固有の機能を追加する場合は、ここで拡張します。

**依存関係**: `core/` と `types/` に依存可能。

## 📚 使用方法

### Pecusプロジェクト内での使用（推奨）

```tsx
import { PecusNotionLikeEditor } from '@/components/editor';

function MyComponent() {
  return (
    <PecusNotionLikeEditor
      workspaceId={workspaceId}
      itemId={itemId}
      sessionId={sessionId}
      onChange={(editorState) => console.log(editorState)}
      onChangePlainText={(text) => console.log(text)}
      onChangeHtml={(html) => console.log(html)}
      onChangeMarkdown={(md) => console.log(md)}
    />
  );
}
```

### 汎用エディタとして使用（将来的なパッケージ化後）

```tsx
import { Editor } from '@/components/editor/core';

function GenericEditorComponent() {
  return (
    <Editor
      initialEditorState={initialState}
      onChange={(editorState) => console.log(editorState)}
      showToolbar={true}
      autoFocus={true}
    />
  );
}
```

## 🔧 主要機能

### エディタ機能
- リッチテキスト編集（太字、斜体、下線、取り消し線）
- 見出し（H1〜H6）
- リスト（箇条書き、番号付き、チェックリスト）
- テーブル
- コードブロック（シンタックスハイライト対応）
- 画像
- リンク
- 数式（LaTeX）
- 水平線
- ページブレーク
- レイアウト（2カラムなど）
- メンション
- 絵文字
- ハッシュタグ
- 日時
- 埋め込み（Twitter、YouTube、Figma）

### Pecus固有機能
- ワークスペース連携画像アップロード
- 一時ファイルアップロード（新規作成時）
- セッション管理

## 🚀 将来的なパッケージ化

`core/` ディレクトリは将来的に独立したnpmパッケージとして分離することを想定しています。

### パッケージ化の準備状況
- ✅ ディレクトリ構造の分離
- ✅ 型定義の集約
- ✅ 依存関係の明確化
- ⏳ ドキュメント整備（進行中）
- ⏳ テストの追加（計画中）
- ⏳ package.json の設計（計画中）

### パッケージ化の判断基準
以下の条件を2つ以上満たす場合、パッケージ化を推奨：
- [ ] エディタを他のプロジェクトでも使う予定がある
- [ ] Pecus固有の依存を完全に切り離せる
- [ ] エディタの機能追加が頻繁に発生する
- [ ] 外部貢献者を受け入れたい

## 📖 開発ガイド

### 新機能の追加

#### 汎用機能の場合（すべてのプロジェクトで使える）
1. `core/` または共通ディレクトリに実装
2. Pecus固有の機能に依存しないこと
3. 型定義は `types/` に追加

#### Pecus固有機能の場合
1. `pecus/` に実装
2. `core/` の機能を拡張する形で実装
3. Pecus API や DB スキーマに依存してもOK

### コーディング規約
- コアとPecusの境界を明確に
- `core/` から `pecus/` への依存は禁止
- 型定義は必ず `types/` に集約
- import パスは相対パス（`../`）を使用

## 🧪 テスト

### 現状
- 手動テストのみ

### 今後の計画
- `core/` のユニットテスト
- `pecus/` の統合テスト
- E2Eテスト（Playwright）

## 📝 関連ドキュメント
- [Lexical 公式ドキュメント](https://lexical.dev/)
- [Pecus Aspire プロジェクト README](../../../README.md)

## 📅 変更履歴

### 2025-11-26
- **リファクタリング**: エディタを3層構造（types/, core/, pecus/）に分離
- **目的**: 将来的なパッケージ化に備えた構造整理
- **影響**: 既存機能は全て維持（後方互換性あり）
