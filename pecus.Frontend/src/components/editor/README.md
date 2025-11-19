# Pecus Editor

Notion風のリッチテキストエディタコンポーネント

## 概要

Lexicalベースの高機能なリッチテキストエディタです。

## 特徴

- 🎨 Notion風のクリーンなUI
- ✏️ リッチテキスト編集（太字、イタリック、下線、取り消し線、コード）
- ↩️ 元に戻す / やり直し機能
- 📝 読み取り専用モード対応
- 💾 JSON形式でのデータ保存
- 🎯 TypeScript完全対応

## インストール

必要なパッケージはプロジェクトに既にインストール済みです：

```json
{
  "dependencies": {
    "lexical": "^0.38.2",
    "@lexical/react": "^0.38.2"
  }
}
```

## 基本的な使い方

```tsx
import { PecusEditor } from "@/components/editor";

export default function MyComponent() {
  const [content, setContent] = useState<string>("");

  return (
    <PecusEditor
      placeholder="ここに入力してください..."
      onChange={setContent}
    />
  );
}
```

## Props

| プロパティ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `initialContent` | `string` | `undefined` | 初期コンテンツ（JSON文字列） |
| `placeholder` | `string` | `"ここに入力してください..."` | プレースホルダーテキスト |
| `onChange` | `(content: string) => void` | `undefined` | エディタ状態変更時のコールバック |
| `readOnly` | `boolean` | `false` | 読み取り専用モード |
| `className` | `string` | `""` | カスタムクラス名 |

## 使用例

### 基本的な編集

```tsx
import { PecusEditor } from "@/components/editor";
import { useState } from "react";

export default function BasicExample() {
  const [content, setContent] = useState<string>("");

  return (
    <PecusEditor
      placeholder="テキストを入力..."
      onChange={(newContent) => {
        console.log("Content changed:", newContent);
        setContent(newContent);
      }}
    />
  );
}
```

### 初期値を設定

```tsx
import { PecusEditor } from "@/components/editor";

export default function InitialContentExample() {
  const initialContent = JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: "こんにちは、世界！",
              type: "text",
              version: 1
            }
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        }
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1
    }
  });

  return (
    <PecusEditor
      initialContent={initialContent}
      placeholder="テキストを入力..."
    />
  );
}
```

### 読み取り専用モード

```tsx
import { PecusEditor } from "@/components/editor";

export default function ReadOnlyExample() {
  const content = "..."; // 保存されたコンテンツ

  return (
    <PecusEditor
      initialContent={content}
      readOnly={true}
      className="bg-gray-50"
    />
  );
}
```

### 保存と読み込み

```tsx
import { PecusEditor } from "@/components/editor";
import { useState } from "react";

export default function SaveLoadExample() {
  const [content, setContent] = useState<string>("");
  const [savedContent, setSavedContent] = useState<string>("");

  const handleSave = async () => {
    // APIに保存
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSavedContent(content);
  };

  return (
    <div>
      <PecusEditor
        initialContent={content}
        onChange={setContent}
        placeholder="ドキュメントを編集..."
      />
      <button onClick={handleSave}>保存</button>
    </div>
  );
}
```

## データ形式

エディタの内容はJSON形式で保存されます：

```json
{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 1,
            "mode": "normal",
            "style": "",
            "text": "太字のテキスト",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}
```

## スタイルカスタマイズ

CSS Modulesを使用してスタイルをカスタマイズできます：

```tsx
import { PecusEditor } from "@/components/editor";
import styles from "./MyCustomEditor.module.css";

export default function CustomStyledEditor() {
  return (
    <PecusEditor
      className={styles.customEditor}
      placeholder="カスタムスタイルのエディタ"
    />
  );
}
```

## 今後の拡張予定

- [ ] 見出し機能（H1～H6）
- [ ] リスト機能（箇条書き、番号付きリスト）
- [ ] 引用ブロック
- [ ] コードブロック（シンタックスハイライト付き）
- [ ] リンク挿入
- [ ] 画像挿入
- [ ] テーブル
- [ ] チェックリスト
- [ ] ドラッグ&ドロップ
- [ ] スラッシュコマンド（/でメニュー表示）
- [ ] メンション機能（@ユーザー）
- [ ] エクスポート機能（Markdown、HTML）

## トラブルシューティング

### TypeScriptエラーが出る

```bash
npx tsc --noEmit
```

を実行して型エラーを確認してください。

### スタイルが適用されない

Tailwind CSSが正しく設定されているか確認してください。

## ライセンス

このプロジェクトのライセンスに従います。

## 参考リンク

- [Lexical 公式ドキュメント](https://lexical.dev/)
- [Lexical Playground](https://playground.lexical.dev/)
- [Lexical React](https://lexical.dev/docs/getting-started/react)
