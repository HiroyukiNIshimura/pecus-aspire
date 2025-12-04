# アイコン使用ガイド

このドキュメントでは、Pecus Aspire フロントエンドでのアイコン使用方法を説明します。

---

## 概要

本プロジェクトでは **@iconify/tailwind4** と **Tabler Icons** を使用してアイコンを表示します。

- **アイコンライブラリ**: [Tabler Icons](https://tabler.io/icons)（5,800+ のオープンソースアイコン）
- **Tailwind プラグイン**: `@iconify/tailwind4`
- **アイコン検索**: https://iconify.design/

---

## セットアップ

### 依存パッケージ

```json
// package.json
{
  "devDependencies": {
    "@iconify-json/tabler": "^1.2.23",
    "@iconify/json": "^2.2.414",
    "@iconify/tailwind4": "^1.2.0"
  }
}
```

### CSS 設定

```css
/* src/app/globals.css */
@plugin "@iconify/tailwind4";
```

---

## 基本的な使い方

### 方法 1: 直接クラス指定（推奨：シンプルな場合）

```tsx
// 基本形式: icon-[tabler--アイコン名]
<span className="icon-[tabler--plus] size-5"></span>
<span className="icon-[tabler--edit] size-5"></span>
<span className="icon-[tabler--trash] size-5"></span>

// サイズ指定（Tailwind のユーティリティ使用）
<span className="icon-[tabler--home] size-4"></span>   // 16px
<span className="icon-[tabler--home] size-5"></span>   // 20px
<span className="icon-[tabler--home] size-6"></span>   // 24px
<span className="icon-[tabler--home] w-8 h-8"></span>  // 32px

// 色指定
<span className="icon-[tabler--star] size-5 text-warning"></span>
<span className="icon-[tabler--check] size-5 text-success"></span>
<span className="icon-[tabler--x] size-5 text-error"></span>
```

### 方法 2: Icon コンポーネント（推奨：再利用性が必要な場合）

```tsx
import Icon from '@/components/icons/Icon';

// 基本使用
<Icon name="plus" />
<Icon name="edit" />
<Icon name="trash" />

// サイズ指定（プリセット）
<Icon name="home" size="xs" />  // 12px (w-3 h-3)
<Icon name="home" size="sm" />  // 16px (w-4 h-4)
<Icon name="home" size="md" />  // 20px (w-5 h-5) ← デフォルト
<Icon name="home" size="lg" />  // 24px (w-6 h-6)
<Icon name="home" size="xl" />  // 32px (w-8 h-8)

// 追加のクラス名
<Icon name="star" className="text-warning" />

// アクセシビリティ
<Icon name="warning" aria-label="警告" />
<Icon name="info" title="詳細情報" />
```

### 方法 3: 事前定義されたショートカットコンポーネント

```tsx
import {
  PlusIcon,
  EditIcon,
  DeleteIcon,
  SearchIcon,
  CheckIcon,
  CloseIcon,
  HomeIcon,
  PersonIcon,
  CalendarIcon,
  // ... その他多数
} from '@/components/icons/Icon';

// 使用例
<PlusIcon size="lg" />
<EditIcon className="text-primary" />
<DeleteIcon size="sm" />
```

---

## アイコン名の調べ方

### 1. Tabler Icons 公式サイト

1. https://tabler.io/icons にアクセス
2. 検索バーでキーワード検索（例: "user", "settings"）
3. アイコン名を確認（例: `user`, `settings`）
4. そのまま使用: `icon-[tabler--user]` または `<Icon name="user" />`

### 2. Iconify 検索

1. https://iconify.design/ にアクセス
2. 左側の「Icon Sets」で「Tabler Icons」を選択
3. キーワードで検索
4. アイコン名をコピー

### アイコン名の変換ルール

Tabler Icons サイトでの表示名と実際のクラス名の関係:

| Tabler サイト表示 | クラス名 | Icon コンポーネント |
|------------------|----------|-------------------|
| `chevron-left` | `icon-[tabler--chevron-left]` | `<Icon name="chevron-left" />` |
| `arrow-up` | `icon-[tabler--arrow-up]` | `<Icon name="arrow-up" />` |
| `circle-check` | `icon-[tabler--circle-check]` | `<Icon name="circle-check" />` |
| `star-filled` | `icon-[tabler--star-filled]` | `<Icon name="star-filled" />` |

---

## 実装例

### ボタン内のアイコン

```tsx
// アイコン + テキスト
<button type="button" className="btn btn-primary">
  <span className="icon-[tabler--plus] size-5"></span>
  新規作成
</button>

// アイコンのみ
<button type="button" className="btn btn-ghost btn-square">
  <span className="icon-[tabler--settings] size-5"></span>
</button>
```

### ナビゲーションメニュー

```tsx
<nav className="menu">
  <li>
    <a href="/dashboard">
      <span className="icon-[tabler--layout-dashboard] size-5"></span>
      ダッシュボード
    </a>
  </li>
  <li>
    <a href="/users">
      <span className="icon-[tabler--users] size-5"></span>
      ユーザー管理
    </a>
  </li>
</nav>
```

### 状態表示

```tsx
// テーマ切り替え
{theme === 'light' && <span className="icon-[tabler--sun] size-5"></span>}
{theme === 'dark' && <span className="icon-[tabler--moon] size-5"></span>}
{theme === 'auto' && <span className="icon-[tabler--brightness-auto] size-5"></span>}

// ステータスバッジ
<span className="badge badge-success">
  <span className="icon-[tabler--check] size-4"></span>
  完了
</span>
```

### アコーディオン/展開

```tsx
<span
  className={`icon-[tabler--chevron-up] size-5 transition-transform duration-300 ${
    isExpanded ? '' : 'rotate-180'
  }`}
></span>
```

### コメントタイプアイコン

```tsx
const commentTypeConfig = {
  Normal: { label: '通常', color: 'badge-neutral', icon: 'icon-[tabler--message]' },
  Memo: { label: 'メモ', color: 'badge-info', icon: 'icon-[tabler--note]' },
  HelpWanted: { label: '助けて', color: 'badge-warning', icon: 'icon-[tabler--help]' },
  NeedReply: { label: '返事が欲しい', color: 'badge-primary', icon: 'icon-[tabler--mail-question]' },
  Reminder: { label: 'リマインダー', color: 'badge-secondary', icon: 'icon-[tabler--bell]' },
  Urge: { label: '督促', color: 'badge-error', icon: 'icon-[tabler--urgent]' },
};

// 使用
<span className={`${config.icon} size-4`}></span>
```

---

## よく使うアイコン一覧

### アクション

| アイコン | クラス | 用途 |
|---------|-------|------|
| ➕ | `icon-[tabler--plus]` | 追加 |
| ✏️ | `icon-[tabler--edit]` | 編集 |
| 🗑️ | `icon-[tabler--trash]` | 削除 |
| 🔍 | `icon-[tabler--search]` | 検索 |
| 💾 | `icon-[tabler--device-floppy]` | 保存 |
| ✅ | `icon-[tabler--check]` | 確認/完了 |
| ❌ | `icon-[tabler--x]` | 閉じる/キャンセル |

### ナビゲーション

| アイコン | クラス | 用途 |
|---------|-------|------|
| 🏠 | `icon-[tabler--home]` | ホーム |
| ⬅️ | `icon-[tabler--chevron-left]` | 戻る |
| ➡️ | `icon-[tabler--chevron-right]` | 進む |
| ⬆️ | `icon-[tabler--chevron-up]` | 上/展開 |
| ⬇️ | `icon-[tabler--chevron-down]` | 下/折りたたみ |
| ☰ | `icon-[tabler--menu-2]` | メニュー |

### UI 要素

| アイコン | クラス | 用途 |
|---------|-------|------|
| 👤 | `icon-[tabler--user]` | ユーザー |
| 👥 | `icon-[tabler--users]` | 複数ユーザー |
| ⚙️ | `icon-[tabler--settings]` | 設定 |
| 📅 | `icon-[tabler--calendar]` | カレンダー |
| 🏷️ | `icon-[tabler--tag]` | タグ |
| 🔗 | `icon-[tabler--link]` | リンク |
| ⭐ | `icon-[tabler--star]` | お気に入り |
| ⭐ | `icon-[tabler--star-filled]` | お気に入り（塗りつぶし） |

### ステータス/通知

| アイコン | クラス | 用途 |
|---------|-------|------|
| ℹ️ | `icon-[tabler--info-circle]` | 情報 |
| ⚠️ | `icon-[tabler--alert-triangle]` | 警告 |
| ❌ | `icon-[tabler--circle-x]` | エラー |
| ✅ | `icon-[tabler--circle-check]` | 成功 |
| 🔔 | `icon-[tabler--bell]` | 通知 |

### テーマ

| アイコン | クラス | 用途 |
|---------|-------|------|
| ☀️ | `icon-[tabler--sun]` | ライトモード |
| 🌙 | `icon-[tabler--moon]` | ダークモード |
| 🔆 | `icon-[tabler--brightness-auto]` | 自動 |

---

## ⚠️ 注意事項

### ❌ 禁止事項

1. **daisyUI のアイコンは使用しない**
   - 本プロジェクトでは FlyonUI を使用
   - daisyUI のコンポーネントやクラスは使用禁止

2. **他のアイコンライブラリは使用しない**
   - Font Awesome、Material Icons などは使用しない
   - すべて Tabler Icons（@iconify/tailwind4 経由）で統一

3. **インラインSVGは避ける**
   - `<svg>` タグの直接埋め込みは避ける
   - Iconify のクラス形式を使用

### ✅ 推奨事項

1. **一貫したサイズ使用**
   - ボタン内: `size-5`（20px）
   - 小さいバッジ内: `size-4`（16px）
   - 大きいヘッダー: `size-6`（24px）

2. **アクセシビリティ考慮**
   - 装飾的なアイコンは `aria-hidden="true"`（Icon コンポーネントのデフォルト）
   - 意味を持つアイコンは `aria-label` を設定

3. **テーマ対応**
   - 色は Tailwind のカラークラス（`text-primary`, `text-warning` など）を使用
   - ハードコードされた色値（`#ff0000` など）は避ける

---

## 参照

- [Tabler Icons](https://tabler.io/icons) - アイコン検索
- [Iconify](https://iconify.design/) - アイコン検索（複数ライブラリ対応）
- [`src/components/icons/Icon.tsx`](../pecus.Frontend/src/components/icons/Icon.tsx) - Icon コンポーネント実装
- [`docs/icon-definitions.md`](./icon-definitions.md) - タスクタイプ・ジャンルアイコンの定義
