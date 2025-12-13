# ユーザーオンボーディング設計

## 概要

初回ログイン後や新機能追加時に、ユーザーへチュートリアル/ガイドを表示するための設計。
**遅延作成（Lazy Creation）パターン**を採用し、シンプルかつ拡張性の高い実装を行う。

## 設計方針

### 核心ルール

- **レコードがない = 未完了**（オンボーディング表示）
- **レコードあり & IsCompleted = true** → 完了（表示しない）
- **レコードあり & IsCompleted = false** → 未完了（スキップ後の再表示対応）

### メリット

| 項目 | 説明 |
|------|------|
| DB軽量 | 完了したものだけレコードが存在 |
| マイグレーション不要 | 新機能追加時はコード変更だけで済む |
| シンプル | 事前のレコード作成が不要 |
| 柔軟性 | 機能ごとにオンボーディングを管理可能 |

## データベース設計

### UserOnboardingProgress エンティティ

```csharp
// pecus.Libs/DB/Entities/UserOnboardingProgress.cs
public class UserOnboardingProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    /// <summary>機能を識別するキー（定数クラスで管理）</summary>
    public string FeatureKey { get; set; } = string.Empty;

    public bool IsCompleted { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
```

### インデックス

```csharp
// ApplicationDbContext.cs での設定
modelBuilder.Entity<UserOnboardingProgress>(entity =>
{
    entity.HasIndex(e => new { e.UserId, e.FeatureKey }).IsUnique();
});
```

## FeatureKey の管理

**開発者がコード上で定数として一元管理する。** マスタテーブルは作成しない。

### バックエンド（C#）

```csharp
// pecus.Libs/Constants/OnboardingFeatures.cs
public static class OnboardingFeatures
{
    /// <summary>初回ログイン時の全体ツアー</summary>
    public const string InitialTour = "initial_tour";

    /// <summary>ワークスペース機能の紹介</summary>
    public const string WorkspaceIntro = "workspace_intro";

    /// <summary>エディタの使い方ガイド</summary>
    public const string EditorGuide = "editor_guide";

    /// <summary>タスク管理機能の紹介</summary>
    public const string TaskManagement = "task_management";

    // 新機能追加時はここに追加するだけ
}
```

### フロントエンド（TypeScript）

```typescript
// src/constants/onboardingFeatures.ts
export const OnboardingFeatures = {
  InitialTour: 'initial_tour',
  WorkspaceIntro: 'workspace_intro',
  EditorGuide: 'editor_guide',
  TaskManagement: 'task_management',
} as const;

export type OnboardingFeatureKey = typeof OnboardingFeatures[keyof typeof OnboardingFeatures];
```

## API 設計

### オンボーディング状態取得

```
GET /api/users/onboarding-status
```

**レスポンス例:**
```json
{
  "initialTourCompleted": false,
  "workspaceIntroCompleted": true,
  "editorGuideCompleted": false,
  "taskManagementCompleted": false
}
```

### オンボーディング完了

```
POST /api/users/onboarding/{featureKey}/complete
```

## サービス層の実装

```csharp
public class UserOnboardingService
{
    private readonly ApplicationDbContext _context;

    public async Task<UserOnboardingStatusResponse> GetOnboardingStatusAsync(Guid userId)
    {
        var progress = await _context.UserOnboardingProgress
            .Where(p => p.UserId == userId)
            .ToListAsync();

        // レコードがない = 未完了として返す
        return new UserOnboardingStatusResponse
        {
            InitialTourCompleted = progress.Any(p => p.FeatureKey == OnboardingFeatures.InitialTour && p.IsCompleted),
            WorkspaceIntroCompleted = progress.Any(p => p.FeatureKey == OnboardingFeatures.WorkspaceIntro && p.IsCompleted),
            EditorGuideCompleted = progress.Any(p => p.FeatureKey == OnboardingFeatures.EditorGuide && p.IsCompleted),
            TaskManagementCompleted = progress.Any(p => p.FeatureKey == OnboardingFeatures.TaskManagement && p.IsCompleted),
        };
    }

    public async Task CompleteOnboardingAsync(Guid userId, string featureKey)
    {
        var existing = await _context.UserOnboardingProgress
            .FirstOrDefaultAsync(p => p.UserId == userId && p.FeatureKey == featureKey);

        if (existing == null)
        {
            // 初めて完了 → 新規作成
            _context.UserOnboardingProgress.Add(new UserOnboardingProgress
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FeatureKey = featureKey,
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
            });
        }
        else
        {
            // 既存レコードを更新（リセット後の再完了など）
            existing.IsCompleted = true;
            existing.CompletedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}
```

## フロントエンド実装

### Server Component での状態取得

```tsx
// app/workspace/page.tsx
export default async function WorkspacePage() {
  const client = await createPecusApiClients();
  const onboardingStatus = await client.users.getOnboardingStatus();

  return (
    <WorkspaceContent
      showOnboarding={!onboardingStatus.workspaceIntroCompleted}
    />
  );
}
```

### Server Action での完了処理

```typescript
// src/actions/onboarding.ts
'use server';

import { createPecusApiClients } from '@/libs/pecusApiClient';
import type { OnboardingFeatureKey } from '@/constants/onboardingFeatures';

export async function completeOnboarding(featureKey: OnboardingFeatureKey) {
  const client = await createPecusApiClients();
  await client.users.completeOnboarding(featureKey);
}
```

### クライアントコンポーネントでの表示制御

```tsx
// components/onboarding/WorkspaceOnboarding.tsx
'use client';

import { completeOnboarding } from '@/actions/onboarding';
import { OnboardingFeatures } from '@/constants/onboardingFeatures';

interface Props {
  show: boolean;
}

export function WorkspaceOnboarding({ show }: Props) {
  if (!show) return null;

  const handleComplete = async () => {
    await completeOnboarding(OnboardingFeatures.WorkspaceIntro);
    // 必要に応じてリロードまたは状態更新
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3>ワークスペースへようこそ！</h3>
        <p>ここではプロジェクトを管理できます...</p>
        <div className="modal-action">
          <button className="btn btn-primary" onClick={handleComplete}>
            わかりました
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 運用フロー

### 新機能オンボーディング追加時

```
1. 開発者が定数を追加（C# & TypeScript）
   ↓
2. フロントエンドにオンボーディングUIを実装
   ↓
3. デプロイ
   ↓
4. 既存ユーザー: レコードなし → 未完了 → オンボーディング表示
   新規ユーザー: 同様に未完了として扱われる
```

### レコードのライフサイクル

```
【デプロイ直後】
UserOnboardingProgressテーブル: (空)

【ユーザーAがinitial_tourを完了】
| UserId | FeatureKey    | IsCompleted |
|--------|---------------|-------------|
| A      | initial_tour  | true        |

【ユーザーAがworkspace_introも完了】
| UserId | FeatureKey      | IsCompleted |
|--------|-----------------|-------------|
| A      | initial_tour    | true        |
| A      | workspace_intro | true        |

【ユーザーBはまだ何も完了していない】
→ レコードなし = 全部未完了として扱われる
```

## 注意事項

- **マスタテーブルは作成しない**: FeatureKey はコード上の定数で管理
- **事前レコード作成は不要**: 完了時に初めてレコードを作成
- **IsCompleted カラムの用途**: スキップ後の再表示やリセット機能に対応可能
- **バックエンド・フロントエンドの定数同期**: 両方で同じ文字列を使用すること

## 関連ドキュメント

- [auth-architecture-redesign.md](./auth-architecture-redesign.md) — 認証設計
- [frontend-guidelines.md](./frontend-guidelines.md) — フロントエンド実装ガイドライン

---

更新履歴:
- 2025-12-13: 初版作成
