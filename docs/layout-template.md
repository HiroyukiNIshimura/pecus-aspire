# レイアウトテンプレート設計ガイドライン

## AI エージェント向け要約（必読）

**このドキュメントは必ず遵守してください。レイアウトに関する変更を行う前に必ず確認すること。**

### 絶対禁止事項
- ❌ ページコンポーネントに `h-screen` を使用しない
- ❌ ページコンポーネントに `min-h-screen` を使用しない
- ❌ ページコンポーネントに `overflow-hidden` を使用しない（ルートレベルで）
- ❌ レイアウトコンポーネントの構造を変更しない

### 必須ルール
- ✅ モバイルファーストで設計する
- ✅ ページのルート要素は `flex-1` を使用する
- ✅ スクロールは `main` 要素内の `overflow-y-auto` で制御する
- ✅ 新規ページ作成時は既存のレイアウトパターンを参照する

---

## 1. 基本レイアウト構造

このアプリケーションのレイアウトは以下の要素で構成されます：

```
┌─────────────────────────────────────────────────┐
│                  Header (固定)                   │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │         Content Area                 │
│  (固定)   │      (縦スクロール可能)               │
│          │                                      │
├──────────┴──────────────────────────────────────┤
│                  Footer (固定)                   │
└─────────────────────────────────────────────────┘
```

### 要件
1. **ヘッダー**: 画面上部に固定
2. **サイドバー**: 画面左側に固定（PC）、アイコン化（タブレット）、ドロワー（モバイル）
3. **フッター**: 画面下部に固定（常に表示）
4. **コンテンツ**: 縦スクロールで全体を見渡せる

### サイドバーのレスポンシブ動作

| ブレークポイント | 幅 | 動作 |
|----------------|-----|------|
| `lg` (1024px以上) | 256px | フルサイドバー（アイコン + ラベル） |
| `md` (768px以上) | 80px | アイコンのみ表示 |
| `sm` 未満 | - | ドロワーモード（ハンバーガーメニューで開閉） |

```tsx
// サイドバーの幅指定例
className="lg:w-64 md:w-20 w-64"
// lg: 256px (フル)
// md: 80px (アイコン)
// default: 256px (ドロワー時)
```

---

## 2. ルートレイアウト（layout.tsx）

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {/* 全体を min-h-screen で確保し、flex-col でフッターを下部に配置 */}
        <div className="flex min-h-screen flex-col">
          {/* main は flex-1 で残り領域を埋め、flex flex-col で子を配置 */}
          <main className="flex-1 flex flex-col">{children}</main>
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
```

**重要ポイント:**
- `min-h-screen`: 最小で画面の高さを確保
- `flex flex-col`: 縦方向にフレックスボックス配置
- `flex-1`: main が残りの高さを埋める
- `flex flex-col` (main): 子コンポーネントが `flex-1` で伸縮できるようにする

---

## 3. ダッシュボード系レイアウト（DashboardLayoutClient.tsx）

```tsx
// src/components/common/DashboardLayoutClient.tsx
export default function DashboardLayoutClient({ children, userInfo }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // ❌ h-screen は使わない
    // ✅ flex-1 でルートレイアウトの main 内で伸縮
    <div className="flex flex-col flex-1 overflow-hidden">
      <AppHeader ... />

      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー: 固定幅、縦スクロール */}
        <DashboardSidebar ... />

        {/* メインコンテンツ: flex-1 で残り幅、overflow-y-auto で縦スクロール */}
        <main className="flex-1 p-4 md:p-6 bg-base-100 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**重要ポイント:**
- ルート `div` は `flex-1` で親（ルートレイアウトの main）内で伸縮
- `overflow-hidden` はこのレベルでのみ使用（子要素のスクロール制御のため）
- 内側の `main` に `overflow-y-auto` でコンテンツのスクロールを有効化

---

## 4. ページコンポーネント（各ページ）

### 4.1 レイアウトを使用するページ

```tsx
// ダッシュボード配下のページ例
export default function SomePage() {
  return (
    // レイアウトが既にスクロールを制御しているため、
    // ページ側では特別なスタイルは不要
    <div className="max-w-7xl mx-auto">
      <h1>ページタイトル</h1>
      {/* コンテンツ */}
    </div>
  );
}
```

### 4.2 レイアウトなしのページ（signin, 404 など）

```tsx
// src/app/(entrance)/signin/page.tsx
export default function SignInPage() {
  return (
    // ✅ flex-1 で main 内で伸縮、中央配置
    <div className="flex-1 flex items-center justify-center p-8">
      <main className="flex flex-col gap-8 items-center w-full max-w-sm">
        <LoginFormClient />
      </main>
    </div>
  );
}
```

**重要:**
- `min-h-screen` ではなく `flex-1` を使用
- これにより親の main 内で適切に伸縮し、フッターが表示される

---

## 5. フルスクリーンページ（例外）

ワークスペース詳細など、意図的にフッターを非表示にするフルスクリーンページ:

```tsx
// src/app/(workspace-full)/workspaces/[code]/WorkspaceDetailClient.tsx
export default function WorkspaceDetailClient({ ... }) {
  return (
    // フルスクリーン: h-screen + overflow-hidden
    // ※ この場合フッターは表示されない（意図的）
    <div className="flex h-screen overflow-hidden flex-col">
      <AppHeader ... />
      {/* 独自のレイアウト */}
    </div>
  );
}
```

**注意:** このパターンはフッターを意図的に非表示にする場合のみ使用。

---

## 6. よくある間違いと修正方法

### ❌ 間違い 1: ページで h-screen を使用
```tsx
// ❌ 悪い例
<div className="flex flex-col h-screen overflow-hidden">
```

```tsx
// ✅ 良い例
<div className="flex flex-col flex-1 overflow-hidden">
```

### ❌ 間違い 2: ページで min-h-screen を使用
```tsx
// ❌ 悪い例
<div className="min-h-screen flex items-center justify-center">
```

```tsx
// ✅ 良い例
<div className="flex-1 flex items-center justify-center">
```

### ❌ 間違い 3: スクロールが効かない
```tsx
// ❌ コンテンツ部に overflow-y-auto がない
<main className="flex-1 p-4">{children}</main>
```

```tsx
// ✅ コンテンツ部に overflow-y-auto を追加
<main className="flex-1 p-4 overflow-y-auto">{children}</main>
```

---

## 7. レイアウト確認チェックリスト

新規ページ作成時・レイアウト修正時に確認:

- [ ] ルート要素に `h-screen` を使っていないか？
- [ ] ルート要素に `min-h-screen` を使っていないか？
- [ ] ルート要素は `flex-1` を使っているか？
- [ ] スクロールが必要な部分に `overflow-y-auto` があるか？
- [ ] フッターは表示されているか？（フルスクリーンページ以外）
- [ ] コンテンツは縦スクロールで全体を見渡せるか？

---

## 8. ファイル別レイアウトパターン

| ファイル | パターン | 備考 |
|---------|---------|------|
| `layout.tsx` | ルートレイアウト | `min-h-screen` + `flex-col` |
| `DashboardLayoutClient.tsx` | ダッシュボード | `flex-1` + 内部スクロール |
| `ProfileLayoutClient.tsx` | プロフィール | 同上 |
| `AdminXxxClient.tsx` | 管理者ページ | 同上 |
| `signin/page.tsx` 等 | 中央配置ページ | `flex-1` + `items-center` |
| `WorkspaceDetailClient.tsx` | フルスクリーン | `h-screen`（例外） |

---

## 9. 参照すべきファイル

レイアウトを変更・新規作成する際は、以下のファイルを参照してください：

- `src/app/layout.tsx` - ルートレイアウト
- `src/components/common/DashboardLayoutClient.tsx` - ダッシュボードレイアウト
- `src/components/common/ProfileLayoutClient.tsx` - プロフィールレイアウト
- `src/components/common/AppFooter.server.tsx` - フッター
