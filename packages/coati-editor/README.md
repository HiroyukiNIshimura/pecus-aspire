# @coati/editor

Coatiエディタパッケージ - Lexical ベースのリッチテキストエディタ

## 概要

このパッケージは、Lexical をベースにしたリッチテキストエディタのコアコンポーネントを提供します。

## インストール

モノレポ内での使用:

```json
{
  "dependencies": {
    "@coati/editor": "workspace:*"
  }
}
```

## 使用方法

### エディタコンポーネント

```tsx
import { NotionLikeEditor, NotionLikeViewer } from '@coati/editor';
import '@coati/editor/styles';

// 編集モード
<NotionLikeEditor
  initialEditorState={editorState}
  onChange={(state) => console.log(state)}
/>

// 閲覧モード
<NotionLikeViewer editorState={editorState} />
```

### ノードのみ使用（ヘッドレス）

```tsx
import { CustomNodes, ImageNode, MentionNode } from '@coati/editor/nodes';
import { PLAYGROUND_TRANSFORMERS } from '@coati/editor/transformers';
```

## エクスポート

### メインエントリ (`@coati/editor`)
- `Editor` - 基本エディタ
- `NotionLikeEditor` - Notion風エディタ
- `NotionLikeViewer` - 閲覧専用ビューア
- 各種型定義

### ノード (`@coati/editor/nodes`)
- `CustomNodes` - 全カスタムノードの配列
- 各ノードクラス（ImageNode, MentionNode, etc.）

### トランスフォーマー (`@coati/editor/transformers`)
- `PLAYGROUND_TRANSFORMERS` - Markdown変換用

### スタイル (`@coati/editor/styles`)
- エディタのCSSスタイル

## 開発

```bash
# ビルド
npm run build

# 開発（ウォッチモード）
npm run dev

# リント
npm run lint
```

## ライセンス

MIT (Lexical由来のコードを含む)
