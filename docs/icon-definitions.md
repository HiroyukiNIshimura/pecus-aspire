# アイコン定義ガイド

このドキュメントでは、プロジェクトで使用されるアイコン（タスクタイプアイコン、ジャンルアイコン）の定義方式と追加・変更手順を説明します。

---

## 1. タスクタイプアイコン

### 概要

タスクタイプアイコンは、ワークスペースタスクの種類を視覚的に表すアイコンです。

### 定義場所

| 項目 | ファイルパス |
|------|-------------|
| Enum定義（バックエンド） | `pecus.Libs/DB/Models/Enums/TaskType.cs` |
| アイコンファイル | `pecus.Frontend/public/icons/task-types/*.svg` |
| アイコンマッピング（フロントエンド） | `pecus.Frontend/src/app/(dashbord)/workspaces/[code]/WorkspaceTasks.tsx` |
| 日本語ラベル（フロントエンド） | `pecus.Frontend/src/app/(dashbord)/workspaces/[code]/WorkspaceTasks.tsx` |

### 現在のタスクタイプ一覧

| TaskType | 日本語ラベル | アイコンファイル |
|----------|-------------|-----------------|
| Bug | バグ修正 | `bug.svg` |
| Feature | 新機能開発 | `feature.svg` |
| Documentation | ドキュメント作成・更新 | `documentation.svg` |
| Review | レビュー | `review.svg` |
| Testing | テスト | `testing.svg` |
| Refactoring | リファクタリング | `refactoring.svg` |
| Research | 調査・研究 | `research.svg` |
| Meeting | 打ち合わせ | `meeting.svg` |
| BusinessNegotiation | 商談 | `business-negotiation.svg` |
| RequirementsConfirmation | 要件確認 | `requirements-confirmation.svg` |
| Other | その他 | `other.svg` |

### フロントエンドでの実装

#### アイコンパス取得関数

```typescript
// pecus.Frontend/src/app/(dashbord)/workspaces/[code]/WorkspaceTasks.tsx

const getTaskTypeIcon = (taskType?: string) => {
  if (!taskType) return null;
  const iconMap: Record<string, string> = {
    Bug: '/icons/task-types/bug.svg',
    Feature: '/icons/task-types/feature.svg',
    Documentation: '/icons/task-types/documentation.svg',
    Review: '/icons/task-types/review.svg',
    Testing: '/icons/task-types/testing.svg',
    Refactoring: '/icons/task-types/refactoring.svg',
    Research: '/icons/task-types/research.svg',
    Meeting: '/icons/task-types/meeting.svg',
    BusinessNegotiation: '/icons/task-types/business-negotiation.svg',
    RequirementsConfirmation: '/icons/task-types/requirements-confirmation.svg',
    Other: '/icons/task-types/other.svg',
  };
  return iconMap[taskType] || null;
};
```

#### 日本語ラベル取得関数

```typescript
// pecus.Frontend/src/app/(dashbord)/workspaces/[code]/WorkspaceTasks.tsx

const getTaskTypeLabel = (taskType?: string) => {
  const labels: Record<string, string> = {
    Bug: 'バグ修正',
    Feature: '新機能開発',
    Documentation: 'ドキュメント作成・更新',
    Review: 'レビュー',
    Testing: 'テスト',
    Refactoring: 'リファクタリング',
    Research: '調査・研究',
    Meeting: '打ち合わせ',
    BusinessNegotiation: '商談',
    RequirementsConfirmation: '要件確認',
    Other: 'その他',
  };
  return labels[taskType] || taskType;
};
```

### タスクタイプ追加手順

1. **バックエンド: Enum に追加**
   ```csharp
   // pecus.Libs/DB/Models/Enums/TaskType.cs
   public enum TaskType
   {
       // 既存の値...
       
       /// <summary>
       /// 新しいタイプの説明（日本語）
       /// </summary>
       NewType = 12,  // 次の番号を使用
   }
   ```

2. **アイコンファイルを追加**
   - ファイル: `pecus.Frontend/public/icons/task-types/new-type.svg`
   - 推奨サイズ: 24x24px または 32x32px
   - 形式: SVG（単色推奨）

3. **フロントエンド: マッピングを追加**
   ```typescript
   // WorkspaceTasks.tsx の getTaskTypeIcon 関数に追加
   NewType: '/icons/task-types/new-type.svg',
   
   // getTaskTypeLabel 関数に追加
   NewType: '新しいタイプ名',
   ```

4. **ビルド確認**
   ```bash
   # バックエンド
   dotnet build pecus.sln
   
   # フロントエンド
   cd pecus.Frontend
   npx tsc --noEmit
   ```

---

## 2. ジャンルアイコン

### 概要

ジャンルアイコンは、ワークスペースの分類（ジャンル）を視覚的に表すアイコンです。ジャンルはデータベースのマスタテーブル（`Genre`）で管理されます。

### 定義場所

| 項目 | ファイルパス |
|------|-------------|
| DBモデル | `pecus.Libs/DB/Models/Genre.cs` |
| シードデータ | `pecus.Libs/DB/Seed/DatabaseSeeder.cs` |
| アイコンファイル | `pecus.Frontend/public/icons/genres/*.svg` |

### データベース構造

```csharp
// pecus.Libs/DB/Models/Genre.cs
public class Genre
{
    public int Id { get; set; }
    public required string Name { get; set; }      // ジャンル名（日本語）
    public string? Description { get; set; }       // 説明
    public string? Icon { get; set; }              // アイコンファイル名（拡張子なし）
    public int DisplayOrder { get; set; }          // 表示順
    public bool IsActive { get; set; } = true;     // 有効フラグ
    // ...
}
```

### フロントエンドでの使用

ジャンルアイコンは API レスポンスの `genreIcon` と `genreName` を使用して表示します：

```typescript
// 使用例
{workspace.genreIcon && (
  <img
    src={`/icons/genres/${workspace.genreIcon}.svg`}
    alt={workspace.genreName || 'ジャンルアイコン'}
    title={workspace.genreName || 'ジャンル'}
    className="w-6 h-6"
  />
)}
```

### ジャンルアイコンが使用されている箇所

| ファイル | 用途 |
|---------|------|
| `WorkspaceDetailClient.tsx` | ワークスペース詳細ヘッダー |
| `WorkspaceSwitcher.tsx` | ワークスペース切り替えドロップダウン |
| `WorkspacesClient.tsx` | ワークスペース一覧 |
| `MyItemsClient.tsx` | マイアイテム一覧のワークスペースバッジ |
| `EditWorkspaceSkillsModal.tsx` | スキル編集モーダル |
| `GenreSelect.tsx` | ジャンル選択セレクトボックス |

### ジャンル追加手順

1. **アイコンファイルを追加**
   - ファイル: `pecus.Frontend/public/icons/genres/new-genre.svg`
   - 推奨サイズ: 24x24px または 32x32px
   - 形式: SVG（単色推奨）

2. **シードデータに追加**（開発環境用）
   ```csharp
   // pecus.Libs/DB/Seed/DatabaseSeeder.cs
   new Genre
   {
       Name = "新しいジャンル",
       Description = "新しいジャンルの説明",
       Icon = "new-genre",  // 拡張子なし
       DisplayOrder = 次の番号,
       IsActive = true,
   }
   ```

3. **管理画面から追加**（本番環境）
   - 管理画面のジャンル管理から新規作成
   - アイコンフィールドには拡張子なしのファイル名を入力（例: `new-genre`）

4. **ビルド確認**（シードデータ変更時）
   ```bash
   dotnet build pecus.sln
   ```

---

## 3. アイコンファイルの規約

### ファイル形式

- **形式**: SVG（Scalable Vector Graphics）
- **推奨サイズ**: 24x24px（viewBox で定義）
- **カラー**: 単色推奨（`currentColor` を使用すると親要素の色を継承可能）

### ファイル命名規則

- **タスクタイプ**: kebab-case（例: `business-negotiation.svg`）
- **ジャンル**: kebab-case（例: `web-development.svg`）

### SVG サンプル

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
</svg>
```

### カラー対応

`currentColor` を使用すると、CSSで色を制御できます：

```typescript
<img
  src="/icons/task-types/bug.svg"
  className="w-6 h-6 text-error"  // Tailwind のカラークラス
/>
```

ただし、`<img>` タグでは CSS カラーが適用されないため、色を変更したい場合は：
- SVG ファイル内で色を直接指定する
- または `<svg>` タグを直接埋め込む（React コンポーネント化）

---

## 4. トラブルシューティング

### アイコンが表示されない

1. **ファイルパスを確認**
   - `public/icons/` 以下に正しく配置されているか
   - ファイル名のスペルミスがないか

2. **拡張子を確認**
   - ジャンルアイコン: DBの `Icon` フィールドは拡張子なし
   - フロントエンドで `.svg` を付加している

3. **ブラウザキャッシュをクリア**
   - 開発中はハードリフレッシュ（Ctrl+Shift+R）

### 日本語ラベルが表示されない

1. **タスクタイプ**: `getTaskTypeLabel` 関数にマッピングが追加されているか確認
2. **ジャンル**: API レスポンスに `genreName` が含まれているか確認

---

## 5. 関連ファイル一覧

### タスクタイプ関連

```
pecus.Libs/DB/Models/Enums/TaskType.cs          # Enum定義
pecus.Frontend/public/icons/task-types/         # アイコンファイル
pecus.Frontend/src/app/(dashbord)/workspaces/[code]/WorkspaceTasks.tsx  # マッピング
```

### ジャンル関連

```
pecus.Libs/DB/Models/Genre.cs                   # DBモデル
pecus.Libs/DB/Seed/DatabaseSeeder.cs            # シードデータ
pecus.Frontend/public/icons/genres/             # アイコンファイル
pecus.WebApi/Models/Responses/*/                # APIレスポンス（genreIcon, genreName）
```
