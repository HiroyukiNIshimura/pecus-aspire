# ヒント・空状態コンポーネント ガイドライン

## AI エージェント向け要約（必読）

- **コンテキスト**: ユーザーへのヒント表示と空状態（Empty State）の統一コンポーネント
- **重要ルール**:
  - **Tooltip**: PCのみ表示（スマホでは非表示）。ボタンの動作を妨げない
  - **EmptyState**: データがない状態で「次のアクション」を誘導する
  - **メッセージ**: ネガティブワード（「ありません」）より、ポジティブな誘導（「〜しましょう」）を優先
- **禁止事項**:
  - FlyonUI の Tooltip（JS依存）は使用しない
  - 空状態で何も表示しない、または単なるテキストのみは避ける

---

## Tooltip コンポーネント

### 概要

CSS-only のツールチップ。PC（マウス操作）のみ表示され、スマホでは表示されません。

**ファイル**: `src/components/common/feedback/Tooltip.tsx`

### 基本的な使い方

```tsx
import { Tooltip, HelpTooltip } from '@/components/common/feedback/Tooltip';

// 基本（要素にツールチップを追加）
<Tooltip text="これはヒントです">
  <button className="btn">ボタン</button>
</Tooltip>

// 位置指定
<Tooltip text="下に表示" position="bottom">
  <span>要素</span>
</Tooltip>

// ヘルプアイコン付き（フォームラベル横によく使う）
<div className="flex items-center gap-2">
  <label htmlFor="username">ユーザー名</label>
  <HelpTooltip text="3文字以上20文字以内で入力してください" />
</div>
```

### Props

#### Tooltip

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `text` | `string` | **必須** | ツールチップの内容 |
| `children` | `ReactNode` | **必須** | ツールチップを表示する対象要素 |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 表示位置 |
| `className` | `string` | `''` | 追加のクラス名 |

#### HelpTooltip

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `text` | `string` | **必須** | ツールチップの内容 |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | 表示位置 |

### 動作仕様

| デバイス | 動作 |
|---------|------|
| PC（マウス） | ホバーで表示、フォーカスでも表示 |
| スマホ/タブレット | **表示されない**（ボタン動作を妨げないため） |

### 使用例

```tsx
// フォームのヘルプ
<div className="flex items-center gap-2 mb-1">
  <label htmlFor="org-code" className="label-text font-medium">
    組織コード
  </label>
  <HelpTooltip text="半角英数字のみ。後から変更できません。" />
</div>

// アイコンボタンの説明
<Tooltip text="設定を開く">
  <button className="btn btn-ghost btn-sm">
    <span className="icon-[tabler--settings]" />
  </button>
</Tooltip>

// 用語の説明
<p>
  この機能は
  <Tooltip text="タスクの依存関係を可視化した図">
    <span className="underline decoration-dotted cursor-help">フローマップ</span>
  </Tooltip>
  で確認できます。
</p>
```

### 注意事項

- **ボタンへの Tooltip はPCユーザーへの補足情報**として割り切る
- スマホユーザーはボタンラベル自体で理解できるようにする
- 重要な情報は Tooltip に頼らず、本文やラベルに含める

---

## EmptyState コンポーネント

### 概要

データがない状態を表示し、ユーザーを次のアクションに誘導するコンポーネント。

**ファイル**: `src/components/common/feedback/EmptyState.tsx`

### 基本的な使い方

```tsx
import { EmptyState, EmptyStateCard } from '@/components/common/feedback/EmptyState';

// シンプル（メッセージのみ）
<EmptyState message="データがありません" />

// アイコン + 説明
<EmptyState
  iconClass="icon-[tabler--folder-open]"
  message="アイテムがまだありません"
  description="アイテムを作成して、タスクやアイデアを整理しましょう"
/>

// アクションボタン付き
<EmptyState
  iconClass="icon-[tabler--plus]"
  message="ワークスペースがありません"
  description="最初のワークスペースを作成しましょう"
  action={{
    label: "ワークスペースを作成",
    onClick: () => router.push('/workspaces/new'),
    iconClass: "icon-[tabler--plus]"
  }}
/>

// カード内で使用
<div className="card">
  <EmptyStateCard
    iconClass="icon-[tabler--list]"
    message="タスクを追加しましょう"
  />
</div>
```

### Props

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `message` | `string` | **必須** | メインメッセージ |
| `description` | `string` | - | サブメッセージ（補足説明） |
| `iconClass` | `string` | - | アイコンクラス（例: `icon-[tabler--folder]`） |
| `iconSize` | `string` | サイズに応じた値 | アイコンサイズのカスタマイズ |
| `action` | `EmptyStateAction` | - | アクションボタン |
| `children` | `ReactNode` | - | カスタム要素 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | サイズバリエーション |
| `className` | `string` | `''` | 追加のクラス名 |

#### EmptyStateAction

| Prop | 型 | 説明 |
|------|-----|------|
| `label` | `string` | ボタンラベル |
| `onClick` | `() => void` | クリック時の処理 |
| `variant` | `'primary' \| 'secondary' \| 'accent' \| 'outline'` | ボタンスタイル |
| `iconClass` | `string` | ボタンアイコン |

### サイズバリエーション

| サイズ | 用途 | パディング |
|--------|------|-----------|
| `sm` | ドロップダウン内、小さいエリア | `py-6` |
| `md` | 通常のリスト、テーブル | `py-12` |
| `lg` | ページ全体、メインコンテンツ | `py-16` |

### メッセージの書き方

#### ❌ 避けるべき表現

```tsx
// ネガティブ・事務的
<EmptyState message="データがありません" />
<EmptyState message="タスクはありません" />
<EmptyState message="メッセージが見つかりません" />
```

#### ✅ 推奨する表現

```tsx
// ポジティブ・誘導的
<EmptyState message="データを追加しましょう" />
<EmptyState message="タスクを追加しましょう" />
<EmptyState message="会話を始めましょう" />

// 説明を追加するとさらに良い
<EmptyState
  message="ワークスペースに参加しましょう"
  description="招待リンクを受け取るか、新規作成してください"
/>
```

### 使用例パターン

#### 検索結果なし

```tsx
<EmptyState
  iconClass="icon-[mdi--magnify]"
  message="該当するアイテムがありません"
  description="フィルタ条件を変更してみてください"
  size="md"
/>
```

#### 初期状態（データ作成を促す）

```tsx
<EmptyState
  iconClass="icon-[mdi--clipboard-plus-outline]"
  message="タスクを追加しましょう"
  description="チームの作業を整理して進捗を管理できます"
  action={{
    label: "タスクを作成",
    onClick: handleCreateTask,
    iconClass: "icon-[tabler--plus]"
  }}
/>
```

#### 完了状態（ポジティブ）

```tsx
<EmptyState
  iconClass="icon-[mdi--check-circle-outline]"
  iconSize="w-12 h-12 text-success mb-2"
  message="すべてのタスクが完了しました"
/>
```

#### カード内

```tsx
<div className="card bg-base-200 shadow-sm">
  <EmptyStateCard
    iconClass="icon-[mdi--clipboard-outline]"
    message="タスクを追加しましょう"
    size="sm"
  />
</div>
```

---

## 既存実装の移行

### Before / After 比較

```tsx
// ❌ Before: バラバラな実装
<div className="text-center py-12">
  <p className="text-base-content/70">データがありません</p>
</div>

<div className="text-center text-base-content/50 py-16">
  <span className="icon-[mdi--history] size-16 mb-4 opacity-50" />
  <p className="text-lg">アクティビティはありません</p>
</div>

// ✅ After: 統一コンポーネント
<EmptyState message="データを追加しましょう" />

<EmptyState
  iconClass="icon-[mdi--history]"
  message="この期間のアクティビティはありません"
  size="lg"
/>
```

---

## 関連ドキュメント

- [ui-component-guidelines.md](ui-component-guidelines.md) - UIコンポーネント全般
- [ui-writing-guidelines.md](ui-writing-guidelines.md) - UIテキストの書き方
- [Flyonui-color.md](Flyonui-color.md) - カラーパレット
